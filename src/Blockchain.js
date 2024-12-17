import { Block, generateMerkleRoot } from "./Block.js";
import { Transaction } from "./Transaction.js";
import { Wallet } from './Wallet.js';
import P2PNetwork from './P2PNetwork.js';
import { Mutex } from 'async-mutex';
import * as crypto from 'crypto';

function calculateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

export async function mineForTest(blockchain, difficulty, maxTimestampDiff) {
    const diff = difficulty || blockchain.difficulty;
    const maxDiff = maxTimestampDiff || blockchain.maxTimestampDiff;

    const previousBlock = blockchain.latestBlock;
    const nextIndex = previousBlock.index + 1;
    const previousHash = previousBlock.hash;
    let timestamp = Date.now();
    const transactionsToMine = blockchain.p2pNetwork.transactionPool;
    
    const totalFees = transactionsToMine.reduce((sum, tx) => sum + tx.fee, 0);
    const minerRewardTransaction = new Transaction(
        blockchain.miningRewardWallet,
        blockchain.miningRewardWallet.getAddress(),
        blockchain.blockReward + totalFees,
        0
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
            merkleRoot
        );
        nonce++;
    } while (!newBlock.hash.startsWith("0".repeat(diff)));

    console.log("Bloco minerado (para teste):", newBlock);

    if (blockchain.isValidNextBlock(newBlock, previousBlock)) {
        blockchain.addBlock(newBlock);
        blockchain.p2pNetwork.broadcastBlock(newBlock);

        console.log("Bloco minerado com sucesso (para teste):", newBlock);
        blockchain.p2pNetwork.transactionPool = [];
        return newBlock;
    } else {
        console.error("Bloco minerado inválido (para teste), não será adicionado à cadeia.");
        return;
    }
}

export default class Blockchain {
    constructor() {
        this.chain = [Block.genesis];
        this.difficulty = 4;
        this.blockReward = 50;
        this.halvingInterval = 210000;
        this.miningRewardWallet = new Wallet();
        this.transactionIndex = {};
        this.p2pNetwork = new P2PNetwork(this);
        this.latestBlock = this.chain[0];
        this.mineMutex = new Mutex();
        this.initialBalances = {
            "0x0000000000000000000000000000000000000000": 1000000,
            [this.miningRewardWallet.getAddress()]: 1000,
        };
        this.balances = { ...this.initialBalances };
        this.maxTimestampDiff = 15 * 60 * 1000;
        this.mine = this.mine.bind(this);
    }

    getBlockchain() {
        return this.chain;
    }

    isValidHashDifficulty(hash) {
        return hash.startsWith("0".repeat(this.difficulty));
    }

    initializeBalances(balances) {
        for (const address in balances) {
            this.balances[address] = balances[address];
        }
    }

    updateBalances(transactions) {
        for (const tx of transactions) {
            if (!(tx instanceof Transaction)) {
                console.error('Invalid transaction: Transaction is not an instance of Transaction');
                continue;
            }

            const sender = tx.senderWallet.getAddress();
            const recipient = tx.recipient;

            if (!this.balances[sender]) this.balances[sender] = 0;
            if (!this.balances[recipient]) this.balances[recipient] = 0;

            if (sender === this.miningRewardWallet.getAddress()) {
                this.balances[this.miningRewardWallet.getAddress()] += (tx.amount + tx.fee);
            } else {
                this.balances[sender] -= (tx.amount + tx.fee);
                this.balances[recipient] += tx.amount;
            }
        }
    }

    async mine(difficulty, maxTimestampDiff) {
        const release = await this.mineMutex.acquire();
        try {
            if (typeof process.env.TEST_MODE !== 'undefined' && process.env.TEST_MODE === 'true') {
                return await mineForTest(this, difficulty, maxTimestampDiff);
            }

            const validTransactions = this.p2pNetwork.transactionPool.filter(tx => {
                if (!this.isValidTransaction(tx)) {
                    console.error("Transação considerada inválida para mineração.");
                    return false;
                }
                return true;
            });

            if (validTransactions.length === 0) {
                console.warn("No valid transactions to mine after filtering.");
                return;
            }

            const previousBlock = this.latestBlock;
            const nextIndex = previousBlock.index + 1;
            const previousHash = previousBlock.hash;
            let timestamp = Date.now();
            const totalFees = validTransactions.reduce((sum, tx) => sum + tx.fee, 0);

            const minerRewardTransaction = new Transaction(
                this.miningRewardWallet,
                this.miningRewardWallet.getAddress(),
                this.blockReward + totalFees,
                0
            );

            minerRewardTransaction.timestamp = timestamp;
            await minerRewardTransaction.signTransaction();

            const transactionsToMine = [minerRewardTransaction, ...validTransactions];
            const merkleRoot = generateMerkleRoot(transactionsToMine);
            let nonce = 0;
            let newBlock;

            do {
                timestamp = Date.now();
                newBlock = new Block(
                    nextIndex,
                    previousHash,
                    timestamp,
                    transactionsToMine,
                    nonce,
                    merkleRoot
                );
                nonce++;
            } while (!this.isValidHashDifficulty(newBlock.hash));

            if (this.isValidNextBlock(newBlock, previousBlock)) {
                this.addBlock(newBlock);
                this.p2pNetwork.broadcastBlock(newBlock);

                if ((nextIndex) % this.halvingInterval === 0) {
                    this.blockReward /= 2;
                    console.log(`\nBlock reward halved! New reward: ${this.blockReward}`);
                }

                console.log("Bloco minerado com sucesso:", newBlock);
                this.p2pNetwork.transactionPool = [];
                return newBlock;
            } else {
                console.error("Bloco minerado inválido, não será adicionado à cadeia.");
                return;
            }
        } catch (error) {
            console.error("Erro durante a mineração:", error);
        } finally {
            release();
        }
    }

    isValidTransaction(transaction) {
        if (!transaction || typeof transaction !== 'object') {
            console.error('Invalid transaction: Transaction is not an object');
            return false;
        }

        if (!transaction.senderWallet || typeof transaction.senderWallet.getAddress !== 'function') {
            console.error('Invalid transaction: senderWallet is undefined or getAddress is not a function', transaction.senderWallet);
            return false;
        }

        if(transaction.senderWallet instanceof Wallet){
            if (!transaction.verifySignature()) {
                console.error('Invalid transaction signature');
                return false;
            }
        }

        const sender = transaction.senderWallet.getAddress();
        const senderBalance = this.initialBalances[sender] !== undefined ? this.initialBalances[sender] : this.balances[sender];

        if (senderBalance < transaction.amount + transaction.fee) {
            console.error(`Insufficient balance for sender: ${sender}`);
            return false;
        }

        if (transaction.fee < 0) {
            console.error(`Invalid transaction fee: ${transaction.fee}`);
            return false;
        }

        return true;
    }

    getBalance(address) {
        return this.balances[address] || 0;
    }

    updateTransactionIndex(transactions) {
        for (const tx of transactions) {
            const sender = tx.senderWallet.getAddress();
            const recipient = tx.recipient;

            if (!this.transactionIndex[sender]) this.transactionIndex[sender] = [];
            this.transactionIndex[sender].push(tx);

            if (recipient !== this.miningRewardWallet.getAddress()) {
                if (!this.transactionIndex[recipient]) this.transactionIndex[recipient] = [];
                this.transactionIndex[recipient].push(tx);
            }
        }
    }

    getAddressHistory(address) {
        return this.transactionIndex[address] || [];
    }

    addBlock(newBlock) {
        if (this.isValidNextBlock(newBlock, this.latestBlock)) {
            this.chain.push(newBlock);
            this.latestBlock = newBlock;
            this.updateTransactionIndex(newBlock.transactions);
            this.updateBalances(newBlock.transactions);
            return true;
        }
        console.error("Invalid block received. Not adding to chain.");
        return false;
    }

    isValidNextBlock(newBlock, previousBlock) {
        const currentTimestamp = Date.now();

        if (previousBlock.index + 1 !== newBlock.index) {
            console.error("Invalid block index");
            return false;
        }

        if (previousBlock.hash !== newBlock.previousHash) {
            console.error("Invalid previous hash");
            return false;
        }

        if (this.calculateBlockHash(newBlock) !== newBlock.hash) {
            console.error("Invalid block hash");
            return false;
        }

        if (!this.isValidHashDifficulty(newBlock.hash)) {
            console.error("Invalid hash difficulty");
            return false;
        }

        if (generateMerkleRoot(newBlock.transactions) !== newBlock.merkleRoot) {
            console.error("Invalid merkle root");
            return false;
        }

        if (newBlock.timestamp > currentTimestamp + this.maxTimestampDiff || newBlock.timestamp < previousBlock.timestamp - this.maxTimestampDiff) {
            console.error(`Invalid timestamp: Block timestamp ${newBlock.timestamp} is out of the allowed range.`);
            return false;
        }

        for (const tx of newBlock.transactions) {
            if (!(tx instanceof Transaction) || !this.isValidTransaction(tx)) {
                console.error(`Invalid transaction in block`);
                return false;
            }
        }

        return true;
    }

    isValidChain() {
        for (let i = 1; i < this.chain.length; i++) {
            try {
                if (!this.isValidNextBlock(this.chain[i], this.chain[i - 1])) return false;
                this.chain[i].validateTransactions();
            } catch (error) {
                console.error(`Error validating block ${i}:`, error);
                return false;
            }
        }
        return true;
    }

    calculateBlockHash(block) {
        const { index, previousHash, timestamp, merkleRoot, nonce } = block;
        const transactions = block.transactions.map(tx => {
            const senderAddress = tx.senderWallet ? tx.senderWallet.getAddress() : 'Coinbase';
            return JSON.stringify({
                sender: senderAddress,
                recipient: tx.recipient,
                amount: tx.amount,
                fee: tx.fee,
                timestamp: tx.timestamp,
                signature: tx.signature
            });
        });

        transactions.sort((a, b) => {
            const hashA = calculateHash(JSON.stringify(a));
            const hashB = calculateHash(JSON.stringify(b));
            return hashA.localeCompare(hashB);
        });

        const blockString = `${index}${previousHash}${timestamp}${merkleRoot}${nonce}${transactions.join('')}`;
        return calculateHash(blockString);
    }
}

export { Blockchain };