import { Block, hashBlockData, generateMerkleRoot } from "./Block.js";
import { Transaction } from "./Transaction.js";
import { Wallet } from './Wallet.js';

class Blockchain {
    constructor() {
        this.chain = [Block.genesis];
        this.difficulty = 4;
        this.blockReward = 50;
        this.halvingInterval = 210000;
        this.miningRewardWallet = new Wallet(); // Cria a carteira para recompensas de mineração.

    }

    getBlockchain() {
        return this.chain;
    }

    get latestBlock() {
        return this.chain[this.chain.length - 1];
    }

    isValidHashDifficulty(hash) {
        return hash.startsWith("0".repeat(this.difficulty));
    }

    async mine(transactions) {
        let nextHash, nonce = 0;

        const newBlock = await new Promise(async (resolve) => {
            const nextIndex = this.latestBlock.index + 1;
            const previousHash = this.latestBlock.hash;
            let timestamp = Date.now();
            const merkleRoot = generateMerkleRoot(transactions);

            const minerRewardTransaction = new Transaction(
                this.miningRewardWallet,
                this.miningRewardWallet.getAddress(),
                this.blockReward
            );
            transactions.push(minerRewardTransaction);

            // Loop da Prova de Trabalho
            while (true) {
                timestamp = Date.now(); // Atualiza o timestamp a cada iteração
                nextHash = hashBlockData({
                    index: nextIndex,
                    previousHash,
                    timestamp,
                    transactions,
                    nonce,
                    merkleRoot
                });

                if (this.isValidHashDifficulty(nextHash)) {
                    const newBlock = new Block(nextIndex, previousHash, timestamp, transactions, nextHash, nonce, merkleRoot);

                    if (nextIndex % this.halvingInterval === 0) {
                        this.blockReward /= 2;
                        console.log(`\nBlock reward halved! New reward: ${this.blockReward} Éfira\n`);
                    }

                    resolve(newBlock);
                    break; // Sai do loop quando um hash válido é encontrado
                }
                nonce++; // Incrementa o nonce para a próxima tentativa
            }
        });

        this.chain.push(newBlock); // Adiciona o bloco minerado à chain
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
        const recalculatedMerkleRoot = generateMerkleRoot(nextBlock.transactions); // Recalcula a Merkle Root

        if (previousBlock.index + 1 !== nextBlock.index) {
            return "Invalid index"; // O índice do próximo bloco deve ser sequencial.
        } else if (previousBlock.hash !== nextBlock.previousHash) {
            return "Invalid previous hash"; // O hash do bloco anterior deve corresponder.
        } else if (nextBlockHash !== nextBlock.hash) {
            return "Invalid block hash"; // O hash do bloco deve ser válido.
        } else if (!this.isValidHashDifficulty(nextBlockHash)) {
            return "Invalid hash difficulty"; // A dificuldade do hash deve ser respeitada.
        } else if (recalculatedMerkleRoot !== nextBlock.merkleRoot) {
            return "Invalid merkle root"; // Verifica a integridade da Merkle Root
        }

        return true; // O bloco é válido.
    }
}

export default Blockchain;