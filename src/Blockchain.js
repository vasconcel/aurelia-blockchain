// Importações.
const Block = require("./Block.js");
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
    calculateHash(index, previousHash, timestamp, data, nonce) {
        return crypto
            .createHash("sha256")
            .update(index + previousHash + timestamp + data + nonce)
            .digest("hex");
    }

    // Método para minerar um novo bloco.
    mine(data) {
        const nextBlock = this.generateNextBlock(data);
        try {
            this.addBlock(nextBlock);
        } catch (err) {
          throw err;  
        };
    }

    // Método para gerar o próximo bloco.
    generateNextBlock(data) {
        // Preparação dos dados.
        const nextIndex = this.latestBlock.index + 1;
        const previousHash = this.latestBlock.hash;
        let timestamp = new Date().getTime();
        let nonce = 0;
        let nextHash = this.calculateHash(
            nextIndex,
            previousHash,
            timestamp,
            data,
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
                data,
                nonce
            );
        }

        // Criação do novo bloco.
        const nextBlock = new Block(
            nextIndex,
            previousHash,
            timestamp,
            data,
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
          throw "Error: Invalid block";  
        }
    }

    // Função para manter a integridade da blockchain.
    isValidNextBlock(nextBlock, previousBlock) {
        const nextBlockHash = this.calculateHashForBlock(nextBlock);

        if (previousBlock.index + 1 !== nextBlock.index) {
            return false;
        } else if (previousBlock.hash !== nextBlock.previousHash) {
            return false;
        } else if (nextBlockHash !== nextBlock.hash) {
            return false;
        } else if (!this.isValidHashDifficulty(nextBlockHash)) {
            return false;
        } else {
            return true;
        }
    }
};

module.exports = Blockchain;