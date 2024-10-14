// Importações.
const { Block, hashBlockData } = require("./Block.js");
const Transaction = require("./Transaction.js");

// Classe Blockchain.
class Blockchain {
    constructor() {
        this.blockchain = [Block.genesis];
        this.difficulty = 4;
    }

    // Método para retornar a blockchain.
    getBlockchain() {
        return this.blockchain;
    }

    // Método para retornar o último bloco da blockchain.
    get latestBlock() {
        return this.blockchain[this.blockchain.length -1];
    }

    // Método para verificar a validade da dificuldade do hash.
    isValidHashDifficulty(hash) {
        return hash.startsWith("0".repeat(this.difficulty));
    }

    // Função para calcular o hash de um bloco.
    computeBlockHash(block) {
        return hashBlockData(block);
    }

    // Método para minerar um novo bloco.
    mine(transactions) {
        console.log("Initiating mining...");
        try {
            console.log("Generating next block...");
            const newBlock = this.generateNextBlock(transactions);
            console.log("New block generated:", newBlock);
            console.log("Adding new block...");
            this.addBlock(newBlock);
            console.log("Block added");
            return newBlock;
        } catch (err) {
            console.error("Mining error:", err);
            return null;
        }
    }

    // Método para gerar o próximo bloco.
    generateNextBlock(transactions) {
        const nextIndex = this.latestBlock.index + 1;
        const previousHash = this.latestBlock.hash;
        let timestamp = new Date().getTime();
        let nonce = 0;
        let nextHash = hashBlockData({
            index: nextIndex,
            previousHash: previousHash,
            timestamp: timestamp,
            transactions: transactions,
            nonce: nonce,
        });

        // Algoritmo de Proof-of-Work.
        while (!this.isValidHashDifficulty(nextHash)) {
            nonce += 1;
            timestamp = new Date().getTime();
            nextHash = hashBlockData({
                index: nextIndex,
                previousHash,
                timestamp,
                transactions,
                nonce,
            });

            // Log para exibição dos hashes gerados.
            if (nonce % 1000 === 0) {
                console.log(`Nonce: ${nonce}, Hash: ${nextHash}`);
            }
        }

        // Criação do novo bloco.
        return new Block(
            nextIndex,
            previousHash,
            timestamp,
            transactions,
            nextHash,
            nonce
        );
    }

    // Método para adicionar novos blocos à blockchain.
    addBlock(nextBlock) {
        const validation = this.isValidNextBlock(nextBlock, this.latestBlock);
        if (validation === true) {
            this.blockchain.push(nextBlock);
            return true;
        } else {
            throw new Error(`Invalid block: ${validation}`);
        }
    }

    // Função para manter a integridade da blockchain.
    isValidNextBlock(nextBlock, previousBlock) {
        const nextBlockHash = this.computeBlockHash(nextBlock);
        if (previousBlock.index + 1 !== nextBlock.index) return "Invalid index";
        if (previousBlock.hash !== nextBlock.previousHash) return "Invalid previous hash";
        if (nextBlockHash !== nextBlock.hash) return "Invalid block hash";
        if (!this.isValidHashDifficulty(nextBlockHash)) return "Invalid hash difficulty";
        return true;
    }
};

module.exports = Blockchain;