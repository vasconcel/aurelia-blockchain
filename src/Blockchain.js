// Importações.
const { Block, hashBlockData } = require("./Block.js");
const Transaction = require("./Transaction.js");

// Classe Blockchain.
class Blockchain {
    constructor() {
        this.blockchain = [Block.genesis];
        this.difficulty = 5;
    }

    // Método para retornar a blockchain.
    getBlockchain() {
        return this.blockchain;
    }

    // Método para retornar o último bloco da blockchain.
    get latestBlock() {
        return this.blockchain[this.blockchain.length - 1];
    }

    // Método para verificar a validade da dificuldade do hash.
    isValidHashDifficulty(hash) {
        return hash.startsWith("0".repeat(this.difficulty));
    }

    // Função para calcular o hash de um bloco.
    computeBlockHash(block) {
        return hashBlockData(block);
    }

    // Método para minerar um novo bloco com animação de loading.
    async mine(transactions) {
        console.log("Initiating mining...");
        try {
            const newBlock = await this.generateNextBlock(transactions);
            console.log("\nNew block generated:", newBlock);
            this.addBlock(newBlock);
            console.log("Block added!");
            return newBlock;
        } catch (err) {
            console.error("Mining error:", err);
            return null;
        }
    }

    // Método para gerar o próximo bloco com animação de loading.
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

        const loadingSymbols = ['.', '..', '...', '....'];
        let loadingIndex = 0;

        // Algoritmo de Proof-of-Work.
        return new Promise((resolve) => {
            // Função para exibir a animação de "loading".
            const interval = setInterval(() => {
                // Limpa a linha anterior antes de escrever o novo estado.
                process.stdout.write(`\rMining${loadingSymbols[loadingIndex]}   `);
                loadingIndex = (loadingIndex + 1) % loadingSymbols.length;  // Reinicia o índice após o último símbolo.
            }, 500);

            const mineBlock = () => {
                if (this.isValidHashDifficulty(nextHash)) {
                    clearInterval(interval);  // Para a animação.
                    process.stdout.write("\rMining completed!        \n"); // Limpa a linha de loading
                    resolve(new Block(nextIndex, previousHash, timestamp, transactions, nextHash, nonce));
                } else {
                    nonce += 1;
                    timestamp = new Date().getTime();
                    nextHash = hashBlockData({
                        index: nextIndex,
                        previousHash,
                        timestamp,
                        transactions,
                        nonce,
                    });

                    // Usando `setImmediate` para garantir que o event loop não seja bloqueado.
                    setImmediate(mineBlock);
                }
            };

            // Iniciar o processo de mineração.
            setImmediate(mineBlock);
        });
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
}

module.exports = Blockchain;