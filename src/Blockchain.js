// Importações.
const { Block, calculateBlockHash } = require("./Block.js");
const Transaction = require("./Transaction.js");

// Classe Blockchain.
class Blockchain {
    constructor() {
        this.blockchain = [Block.genesis()];
        this.difficulty = 3;
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
        const data = JSON.stringify({ index, previousHash, timestamp, transactions, nonce });
        return crypto
            .createHash("sha256")
            .update(data)
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
        const nextIndex = this.latestBlock.index + 1;
        const previousHash = this.latestBlock.hash;
        let timestamp = new Date().getTime();
        let nonce = 0;

        let nextHash = calculateBlockHash(
            nextIndex,
            previousHash,
            timestamp,
            transactions,
            nonce
        );

        // Algoritmo de Proof-of-Work.
        while (!this.isValidHashDifficulty(nextHash)) {
            nonce += 1;
            timestamp = new Date().getTime();
            nextHash = calculateBlockHash(
                nextIndex,
                previousHash,
                timestamp,
                transactions,
                nonce
            );
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
        const nextBlockHash = calculateBlockHash(nextBlock);

        if (previousBlock.index + 1 !== nextBlock.index) return "Invalid index";
        if (previousBlock.hash !== nextBlock.previousHash) return "Invalid previous hash";
        if (nextBlockHash !== nextBlock.hash) return "Invalid block hash";
        if (!this.isValidHashDifficulty(nextBlockHash)) return "Invalid hash difficulty";

        return true;
    }
};

module.exports = Blockchain;