import { Block, hashBlockData } from "./Block.js";
import { Transaction } from "./Transaction.js";

class Blockchain {
    constructor() {
        this.blockchain = [Block.genesis]; // Inicia a blockchain com o bloco gênesis.
        this.difficulty = 5;              // Dificuldade de mineração (número de zeros no hash).
        this.blockReward = 50;            // Recompensa inicial para mineradores.
        this.halvingInterval = 210000;    // Intervalo para reduzir a recompensa pela metade.
    }

    getBlockchain() {
        return this.blockchain;
    }

    get latestBlock() {
        return this.blockchain[this.blockchain.length - 1]; // Retorna o último bloco.
    }

    isValidHashDifficulty(hash) {
        return hash.startsWith("0".repeat(this.difficulty)); // Verifica se o hash começa com 'n' zeros.
    }

    async mine(transactions) {
        try {
            const newBlock = await this.generateNextBlock(transactions); // Gera o próximo bloco.
            this.addBlock(newBlock); // Adiciona o bloco à blockchain.
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
            // Executa Proof-of-Work até encontrar um hash que satisfaça a dificuldade.
            while (!this.isValidHashDifficulty(nextHash)) {
                nonce++;
                timestamp = Date.now();
                nextHash = createHash();
            }

            // Adiciona uma transação de recompensa ao minerador.
            const minerRewardTransaction = new Transaction(
                "Aurelia Network",  // Origem da recompensa.
                "Miner Address",    // Endereço do minerador.
                this.blockReward    // Valor da recompensa.
            );

            transactions.push(minerRewardTransaction); // Adiciona recompensa ao bloco.

            const newBlock = new Block(nextIndex, previousHash, timestamp, transactions, nextHash, nonce);

            // Aplica halving da recompensa após o intervalo definido.
            if (nextIndex % this.halvingInterval === 0) {
                this.blockReward /= 2;
                console.log(`\nBlock reward halved! New reward: ${this.blockReward} Éfira\n`);
            }

            resolve(newBlock); // Retorna o novo bloco após a mineração.
        });
    }

    addBlock(newBlock) {
        if (this.isValidNextBlock(newBlock, this.latestBlock)) {
            this.blockchain.push(newBlock); // Se válido, adiciona o bloco.
        } else {
            console.error("Invalid block:", this.isValidNextBlock(newBlock, this.latestBlock));
        }
    }

    isValidNextBlock(nextBlock, previousBlock) {
        const nextBlockHash = hashBlockData(nextBlock);

        if (previousBlock.index + 1 !== nextBlock.index) {
            return "Invalid index"; // O índice do próximo bloco deve ser sequencial.
        } else if (previousBlock.hash !== nextBlock.previousHash) {
            return "Invalid previous hash"; // O hash do bloco anterior deve corresponder.
        } else if (nextBlockHash !== nextBlock.hash) {
            return "Invalid block hash"; // O hash do bloco deve ser válido.
        } else if (!this.isValidHashDifficulty(nextBlockHash)) {
            return "Invalid hash difficulty"; // A dificuldade do hash deve ser respeitada.
        }

        return true; // O bloco é válido.
    }
}

export default Blockchain;