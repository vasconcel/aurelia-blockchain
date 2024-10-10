// Importações.
const Block = require("./Block.js");
const Transaction = require("./Transaction.js");
const crypto = require("crypto");

// Classe Blockchain.
class Blockchain {
    constructor() {
        this.blockchain = [Block.genesis()];
        this.difficulty = 3;
    }

    // Método para retornar a blockchain.
    get() {
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
    calculateHashForBlock(block) {
        const { index, previousHash, timestamp, transactions, nonce } = block;

        return this.calculateHash(
            index,
            previousHash,
            timestamp,
            transactions,
            nonce
        );
    }

    // Função para gerar um hash SHA256.
    calculateHash(index, previousHash, timestamp, transactions, nonce) {
        const stringifiedTransactions = JSON.stringify(transactions);
        return crypto
            .createHash("sha256")
            .update(index + previousHash + timestamp + stringifiedTransactions + nonce)
            .digest("hex");
    }

    // Método para minerar um novo bloco.
    mine(transactions) {
        try {
            const newBlock = this.generateNextBlock(transactions);
            this.addBlock(newBlock);
            return newBlock;
        } catch (err) {
            console.error("Erro de mineração:", err);
            return null;
        }
    }

    // Método para gerar o próximo bloco.
    generateNextBlock(transactions) {
        // Preparação dos dados.
        const nextIndex = this.latestBlock.index + 1;
        const previousHash = this.latestBlock.hash;
        let timestamp = new Date().getTime();
        let nonce = 0;
        let nextHash = this.calculateHash(
            nextIndex,
            previousHash,
            timestamp,
            transactions,
            nonce
        );

        // Algoritmo de Proof-of-Work.
        while (!this.isValidHashDifficulty(nextHash)) {
            nonce = nonce + 1;
            timestamp = new Date().getTime();
            nextHash = this.calculateHash(
                nextIndex,
                previousHash,
                timestamp,
                transactions,
                nonce
            );
        }

        // Criação do novo bloco.
        const nextBlock = new Block(
            nextIndex,
            previousHash,
            timestamp,
            transactions,
            nextHash,
            nonce
        );

        return nextBlock;
    }

    // Método para adicionar novos blocos à blockchain.
    addBlock(nextBlock) {
        if (this.isValidNextBlock(nextBlock, this.latestBlock)) {
            this.blockchain.push(nextBlock);
        } else {
            const invalidReason = this.getInvalidReason(nextBlock, this.latestBlock);
            const err = new Error("Bloco inválido: ${invalidReason}");
            console.error(err);
            throw err;
        }
    }

    getInvalidReason(nextBlock, previousBlock) {
        const nextBlockHash = this.calculateHashForBlock(nextBlock);

        if (previousBlock.index + 1 !== nextBlock.index) return "Invalid index";
        if (previousBlock.hash !== nextBlock.previousHash) return "Invalid previous hash";
        if (nextBlockHash !== nextBlock.hash) return "Invalid block hash";
        if (!this.isValidHashDifficulty(nextBlockHash)) return "Invalid hash difficulty";

        return "Unknown reason";
    }

    // Função para manter a integridade da blockchain.
    isValidNextBlock(nextBlock, previousBlock) {
        const nextBlockHash = this.calculateHashForBlock(nextBlock);

        if (previousBlock.index + 1 !== nextBlock.index) return false;
        if (previousBlock.hash !== nextBlock.previousHash) return false;
        if (nextBlockHash !== nextBlock.hash) return false;
        if (!this.isValidHashDifficulty(nextBlockHash)) return false;

        return true;
    }
};

module.exports = Blockchain;