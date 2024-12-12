import { Block, hashBlockData, generateMerkleRoot } from "./Block.js";
import { Transaction } from "./Transaction.js";
import { Wallet } from './Wallet.js';
import P2PNetwork from './P2PNetwork.js';

class Blockchain {
    constructor() {
        this.chain = [Block.genesis];
        this.difficulty = 4;
        this.blockReward = 50;
        this.halvingInterval = 210000;
        this.miningRewardWallet = new Wallet();
        this.transactionIndex = {};
        this.balances = {};
        this.p2pNetwork = new P2PNetwork(this);
        this.latestBlock = this.chain[0];
    }

    getBlockchain() {
        return this.chain;
    }

    isValidHashDifficulty(hash) {
        return hash.startsWith("0".repeat(this.difficulty));
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

            this.balances[sender] -= (tx.amount + tx.fee);
            this.balances[recipient] += tx.amount;
        }
    }

    async mine(transactions) {
        if (!transactions || transactions.length === 0) {
            console.warn("No transactions to mine.");
            return;
        }

        const validTransactions = transactions.filter(tx => {
            if (!(tx instanceof Transaction) || !this.isValidTransaction(tx)) {
                console.error("Invalid transaction found and skipped.");
                return false;
            }
            return true;
        });

        if (validTransactions.length === 0) {
            console.warn("No valid transactions to mine after filtering.");
            return;
        }

        const nextIndex = this.latestBlock.index + 1;
        const previousHash = this.latestBlock.hash;
        let timestamp = Date.now();
        const totalFees = validTransactions.reduce((sum, tx) => sum + tx.fee, 0);
        const minerRewardTransaction = new Transaction(
            this.miningRewardWallet,
            this.miningRewardWallet.getAddress(),
            this.blockReward + totalFees,
            0
        );
        validTransactions.unshift(minerRewardTransaction);

        const merkleRoot = generateMerkleRoot(validTransactions);
        let nonce = 0;
        let nextHash;

        while (true) {
            nextHash = hashBlockData({
                index: nextIndex,
                previousHash,
                timestamp,
                transactions: validTransactions,
                nonce,
                merkleRoot,
            });

            if (this.isValidHashDifficulty(nextHash)) {
                const newBlock = new Block(
                    nextIndex,
                    previousHash,
                    timestamp,
                    validTransactions,
                    nextHash,
                    nonce,
                    merkleRoot
                );

                if (nextIndex % this.halvingInterval === 0) {
                    this.blockReward /= 2;
                    console.log(`\nBlock reward halved! New reward: ${this.blockReward}`);
                }

                this.addBlock(newBlock);
                this.p2pNetwork.broadcastBlock(newBlock);
                return newBlock;
            }
            nonce++;
        }
    }

    isValidTransaction(transaction) {
        if (!transaction || typeof transaction !== 'object') {
            console.error('Invalid transaction: Transaction is not an object');
            return false;
        }

        if (!transaction.verifySignature()) {
            console.error('Invalid transaction signature');
            return false;
        }

        const sender = transaction.senderWallet.getAddress();
        const senderBalance = this.getBalance(sender);

        if (senderBalance < transaction.amount + transaction.fee) {
            console.error(`Insufficient balance`);
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
        if (!this.isValidNextBlock(newBlock, this.latestBlock)) {
            console.error("Invalid block");
            return false;
        }
        this.chain.push(newBlock);
        this.latestBlock = newBlock;
        this.updateTransactionIndex(newBlock.transactions);
        this.updateBalances(newBlock.transactions);
        return true;
    }

    isValidNextBlock(newBlock, previousBlock) {
        if (previousBlock.index + 1 !== newBlock.index) {
            console.error("Invalid block index");
            return false;
        }

        if (previousBlock.hash !== newBlock.previousHash) {
            console.error("Invalid previous hash");
            return false;
        }

        if (hashBlockData(newBlock) !== newBlock.hash) {
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
}

export default Blockchain;