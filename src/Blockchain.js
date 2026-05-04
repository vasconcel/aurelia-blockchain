import { Block, generateMerkleRoot } from "./Block.js";
import { Transaction } from "./Transaction.js";
import { Wallet } from './Wallet.js';
import P2PNetwork from './P2PNetwork.js';
import { Mutex } from 'async-mutex';
import { Consensus } from './Consensus.js';
import { Ledger } from './Ledger.js';
import { Metrics } from './Metrics.js';

/**
 * Main blockchain controller managing chain state, mining, and consensus.
 * Coordinates transaction validation, block mining, ledger updates, and P2P communication.
 */
export default class Blockchain {
    /**
     * Creates a new Blockchain instance with genesis block.
     */
    constructor() {
        this.chain = [Block.getGenesis()];
        this.difficulty = 4;
        this.blockReward = 50;
        this.halvingInterval = 210000;
        this.miningRewardWallet = new Wallet();
        this.p2pNetwork = new P2PNetwork(this);
        this.latestBlock = this.chain[0];
        this.mineMutex = new Mutex();
        this.maxTimestampDiff = 15 * 60 * 1000;
        this.cumulativeDifficulty = this.latestBlock.getCumulativeDifficulty();
        
        const initialBalances = {
            "0x0000000000000000000000000000000000000000": 1000000,
            [this.miningRewardWallet.getAddress()]: 1000,
        };
        
        this.ledger = new Ledger(initialBalances);
        this.metrics = new Metrics();
        
        this.mine = this.mine.bind(this);
    }

    /**
     * Gets current cumulative difficulty of the chain.
     * Research Purpose: Fork resolution metric.
     * @returns {number} Cumulative difficulty.
     */
    getCumulativeDifficulty() {
        return this.cumulativeDifficulty;
    }

    /**
     * Recalculates cumulative difficulty for entire chain.
     * @returns {number} Total cumulative difficulty.
     */
    calculateCumulativeDifficulty() {
        let total = 0;
        for (const block of this.chain) {
            total += Math.pow(16, block.difficulty);
        }
        return total;
    }

    /**
     * Synchronizes ledger with persisted state.
     * @param {Object} initialState - Ledger state to restore.
     */
    syncLedger(initialState) {
        if (initialState) {
            this.ledger.setState(initialState);
        }
        
        const minerAddress = this.miningRewardWallet.getAddress();
        const minerBalance = this.ledger.getBalance(minerAddress);
        
        if (minerBalance < 1000) {
            console.log('Seeding miner wallet with 1000 tokens (balance was:', minerBalance, ')');
            this.ledger.credit(minerAddress, 1000 - minerBalance);
        }
    }

    /**
     * Gets the entire blockchain.
     * @returns {Array} Array of Block objects.
     */
    getBlockchain() {
        return this.chain;
    }

    /**
     * Initializes ledger balances.
     * @param {Object} balances - Address to balance map.
     */
    initializeBalances(balances) {
        this.ledger.initialize(balances);
    }

    /**
     * Updates ledger with processed transactions.
     * @param {Array} transactions - Array of Transaction objects.
     */
    updateBalances(transactions) {
        this.ledger.update(transactions);
    }

    /**
     * Mines a new block with valid transactions from the mempool.
     * Research Purpose: Simulates Proof-of-Work consensus; records mining duration metrics.
     * @param {Object} options - Mining options {difficulty, isTestMode}.
     * @returns {Block|null} Newly mined block or null if failed.
     */
    async mine(options = {}) {
        const release = await this.mineMutex.acquire();
        try {
            const isTestMode = options.isTestMode || (typeof process.env.TEST_MODE !== 'undefined' && process.env.TEST_MODE === 'true');
            const difficulty = options.difficulty || (isTestMode ? 1 : this.difficulty);
            
            let transactionsToMine;
            
            if (!isTestMode) {
                const validTransactions = this.p2pNetwork.transactionPool.filter(tx => {
                    if (!this.isValidTransaction(tx)) {
                        return false;
                    }
                    return true;
                });

                if (validTransactions.length === 0) {
                    return;
                }
                transactionsToMine = validTransactions;
            } else {
                transactionsToMine = this.p2pNetwork.transactionPool;
            }

            const previousBlock = this.latestBlock;
            const nextIndex = previousBlock.index + 1;
            const previousHash = previousBlock.hash;
            let timestamp = Date.now();
            const totalFees = transactionsToMine.reduce((sum, tx) => sum + tx.fee, 0);
            const miningStartTime = Date.now();

            const minerRewardAddress = this.miningRewardWallet.getAddress();
            const minerRewardNonce = this.ledger.getNonce(minerRewardAddress) + 1;
            
            const minerRewardTransaction = new Transaction(
                this.miningRewardWallet,
                minerRewardAddress,
                this.blockReward + totalFees,
                0,
                minerRewardNonce
            );

            minerRewardTransaction.timestamp = timestamp;
            await minerRewardTransaction.signTransaction();

            const transactionsToMineWithReward = [minerRewardTransaction, ...transactionsToMine];
            const merkleRoot = generateMerkleRoot(transactionsToMineWithReward);
            let nonce = 0;
            let newBlock;

            do {
                timestamp = Date.now();
                newBlock = new Block(
                    nextIndex,
                    previousHash,
                    timestamp,
                    transactionsToMineWithReward,
                    nonce,
                    merkleRoot,
                    difficulty
                );
                nonce++;
            } while (!newBlock.hash.startsWith('0'.repeat(difficulty)));

            const miningDuration = Date.now() - miningStartTime;
            
            if (this.isValidNextBlock(newBlock, previousBlock)) {
                this.addBlock(newBlock);
                this.p2pNetwork.broadcastBlock(newBlock);
                
                if (this.metrics) {
                    this.metrics.recordMiningDuration(miningDuration);
                    this.metrics.incrementTransactionCount(transactionsToMine.length);
                }

                if ((nextIndex) % this.halvingInterval === 0) {
                    this.blockReward /= 2;
                }

                this.p2pNetwork.transactionPool = [];
                return newBlock;
            } else {
                return;
            }
        } catch (error) {
        } finally {
            release();
        }
    }

    /**
     * Validates a transaction against consensus rules.
     * @param {Transaction} transaction - Transaction to validate.
     * @returns {boolean} True if valid.
     */
    isValidTransaction(transaction) {
        return Consensus.validateTransaction(transaction, this.ledger);
    }

    /**
     * Gets balance for an address.
     * @param {string} address - Wallet address.
     * @returns {number} Current balance.
     */
    getBalance(address) {
        return this.ledger.getBalance(address);
    }

    /**
     * Gets nonce for an address.
     * @param {string} address - Wallet address.
     * @returns {number} Current nonce.
     */
    getNonce(address) {
        return this.ledger.getNonce(address);
    }

    /**
     * Updates transaction index for address history.
     * @param {Array} transactions - Transactions to index.
     */
    updateTransactionIndex(transactions) {
        for (const tx of transactions) {
            const sender = tx.senderWallet.getAddress();
            const recipient = tx.recipient;
            this.ledger.getHistory(sender);
        }
    }

    /**
     * Gets transaction history for an address.
     * @param {string} address - Wallet address.
     * @returns {Array} Array of transactions.
     */
    getAddressHistory(address) {
        return this.ledger.getHistory(address);
    }

    /**
     * Adds a new block to the chain after validation.
     * @param {Block} newBlock - Block to add.
     * @returns {boolean} True if added successfully.
     */
    addBlock(newBlock) {
        if (this.chain.some(b => b.hash === newBlock.hash)) {
            return false;
        }
        if (this.isValidNextBlock(newBlock, this.latestBlock)) {
            this.chain.push(newBlock);
            this.latestBlock = newBlock;
            this.cumulativeDifficulty = this.calculateCumulativeDifficulty();
            this.ledger.update(newBlock.transactions, this.miningRewardWallet.getAddress());
            return true;
        }
        return false;
    }

    /**
     * Validates a block before adding to chain.
     * @param {Block} newBlock - Block to validate.
     * @param {Block} previousBlock - Previous block in chain.
     * @returns {boolean} True if valid.
     */
    isValidNextBlock(newBlock, previousBlock) {
        const options = {
            difficulty: this.difficulty,
            maxTimestampDiff: this.maxTimestampDiff
        };

        if (!Consensus.validateBlock(newBlock, previousBlock, options)) {
            return false;
        }

        const simulatedLedger = this._createSimulatedLedger(newBlock.transactions);
        
        if (!Consensus.validateBlockTransactions(newBlock, previousBlock, this.ledger, { simulatedLedger })) {
            return false;
        }

        return true;
    }

    /**
     * Creates a temporary ledger for transaction simulation.
     * @param {Array} transactions - Transactions to simulate.
     * @returns {Ledger} Simulated ledger instance.
     */
    _createSimulatedLedger(transactions) {
        const tempLedger = new Ledger({});
        tempLedger.setState(this.ledger.getState());
        return tempLedger;
    }

    /**
     * Validates entire blockchain integrity.
     * @returns {boolean} True if chain is valid.
     */
    isValidChain() {
        for (let i = 1; i < this.chain.length; i++) {
            try {
                if (!Consensus.validateBlock(this.chain[i], this.chain[i - 1], { 
                    difficulty: this.difficulty, 
                    maxTimestampDiff: this.maxTimestampDiff 
                })) {
                    return false;
                }
                this.chain[i].validateTransactions();
            } catch (error) {
                return false;
            }
        }
        return true;
    }

    /**
     * Calculates hash for a block.
     * @param {Block} block - Block to hash.
     * @returns {string} Block hash.
     */
    calculateBlockHash(block) {
        return Consensus.calculateBlockHash(block);
    }

    /**
     * Validates hash meets difficulty requirement.
     * @param {string} hash - Hash to validate.
     * @returns {boolean} True if valid.
     */
    isValidHashDifficulty(hash) {
        return Consensus.validateHashDifficulty(hash, this.difficulty);
    }
}

export { Blockchain };