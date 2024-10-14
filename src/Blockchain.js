const { Block, hashBlockData } = require("./Block.js");
const { Transaction } = require("./Transaction.js");

class Blockchain {
    constructor() {
        this.blockchain = [Block.genesis];
        this.difficulty = 5;
        this.blockReward = 50;
        this.halvingInterval = 210000;
    }

    getBlockchain() {
        return this.blockchain;
    }

    get latestBlock() {
        return this.blockchain[this.blockchain.length - 1];
    }

    isValidHashDifficulty(hash) {
        return hash.startsWith("0".repeat(this.difficulty));
    }

    async mine(transactions) {
        try {
            const newBlock = await this.generateNextBlock(transactions);
            this.addBlock(newBlock);
            console.log("\nBlock mined:", newBlock);
        } catch (error) {
            console.log("Mining error:", error);
        }
    }

    generateNextBlock(transactions) {
        const nextIndex = this.latestBlock.index + 1;
        const previousHash = this.latestBlock.hash;
        let timestamp = Date.now();
        let nonce = 0;

        const createHash = () => hashBlockData({
            index: nextIndex,
            previousHash,
            timestamp,
            transactions,
            nonce
        });

        let nextHash = createHash();

        return new Promise((resolve) => {
            while (!this.isValidHashDifficulty(nextHash)) {
                nonce++;
                timestamp = Date.now();
                nextHash = createHash();
            }

            const minerRewardTransaction = new Transaction(
                "Aurelia Network",
                "Miner Address",
                this.blockReward
            );

            transactions.push(minerRewardTransaction);

            const newBlock = new Block(nextIndex, previousHash, timestamp, transactions, nextHash, nonce);

            if (nextIndex % this.halvingInterval === 0) {
                this.blockReward /= 2;
                console.log(`\nBlock reward halved! New reward: ${this.blockReward} Éfira\n`);
            }

            resolve(newBlock);
        });
    }

    addBlock(newBlock) {
        if (this.isValidNextBlock(newBlock, this.latestBlock)) {
            this.blockchain.push(newBlock);
        } else {
            console.error("Invalid block:", this.isValidNextBlock(newBlock, this.latestBlock));
        }
    }

    isValidNextBlock(nextBlock, previousBlock) {
        const nextBlockHash = hashBlockData(nextBlock);

        if (previousBlock.index + 1 !== nextBlock.index) {
            return "Invalid index";
        } else if (previousBlock.hash !== nextBlock.previousHash) {
            return "Invalid previous hash";
        } else if (nextBlockHash !== nextBlock.hash) {
            return "Invalid block hash";
        } else if (!this.isValidHashDifficulty(nextBlockHash)) {
            return "Invalid hash difficulty";
        }

        return true;
    }
}

module.exports = Blockchain;