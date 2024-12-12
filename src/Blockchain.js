import { Block, hashBlockData, generateMerkleRoot } from "./Block.js";
import { Transaction } from "./Transaction.js";
import { Wallet } from './Wallet.js';

class Blockchain {
    constructor() {
        this.chain = [Block.genesis];
        this.difficulty = 4;
        this.blockReward = 50;
        this.halvingInterval = 210000;
        this.miningRewardWallet = new Wallet();     
        this.transactionIndex = {};
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

    // Método assíncrono para mineração de um novo bloco
    async mine(transactions) {
        if (!transactions || transactions.length === 0) {
            throw new Error("No transactions to mine.");
        }

        // Configurações iniciais do novo bloco
        const nextIndex = this.latestBlock.index + 1;
        const previousHash = this.latestBlock.hash;
        let timestamp = Date.now();
        const merkleRoot = generateMerkleRoot(transactions);
        let nonce = 0;
        let nextHash;

        // Adiciona uma transação de recompensa para o minerador
        const minerRewardTransaction = new Transaction(
            this.miningRewardWallet,
            this.miningRewardWallet.getAddress(),
            this.blockReward
        );
        transactions.push(minerRewardTransaction);

        // Loop de mineração até encontrar um hash válido
        while (true) {
            timestamp = Date.now();
            nextHash = hashBlockData({
                index: nextIndex,
                previousHash,
                timestamp,
                transactions,
                nonce,
                merkleRoot,
            });

            // Verifica se o hash gerado atende à dificuldade, cria o novo bloco e atualiza a recompensa
            if (this.isValidHashDifficulty(nextHash)) {
                const newBlock = new Block(
                    nextIndex,
                    previousHash,
                    timestamp,
                    transactions,
                    nextHash,
                    nonce,
                    merkleRoot
                );

                // Halving da recompensa para manter a economia da rede
                if (nextIndex % this.halvingInterval === 0) {
                    this.blockReward /= 2;
                    console.log(`\nBlock reward halved! New reward: ${this.blockReward}`);
                }

                // Adiciona o novo bloco à cadeia
                this.chain.push(newBlock);
                this.updateTransactionIndex(transactions);

                return newBlock;
            }
            nonce++;
        }
    }

    // Atualiza o índice de transações para rastrear histórico de endereços
    updateTransactionIndex(transactions) {
        for (const tx of transactions) {
            const sender = tx.senderWallet.getAddress();
            const recipient = tx.recipient;

            // Adiciona transação ao índice do remetente
            if (!this.transactionIndex[sender]) {
                this.transactionIndex[sender] = [];
            }
            this.transactionIndex[sender].push(tx);

            // Adiciona transação ao índice do destinatário
            if (recipient !== this.miningRewardWallet.getAddress()) {
                if (!this.transactionIndex[recipient]) {
                    this.transactionIndex[recipient] = [];
                }
                this.transactionIndex[recipient].push(tx);
            }
        }
    }

    getAddressHistory(address) {
        return this.transactionIndex[address] || [];
    }

    // Adiciona um novo bloco à cadeia, se válido
    addBlock(newBlock) {
        if (!this.isValidNextBlock(newBlock, this.latestBlock)) {
            console.error("Invalid block");
            return false;
        }
        this.chain.push(newBlock);
        this.updateTransactionIndex(newBlock.transactions);
        return true;
    }

    // Verifica se o bloco seguinte é válido em relação ao bloco anterior
    isValidNextBlock(newBlock, previousBlock) {
        if (previousBlock.index + 1 !== newBlock.index) return false;
        if (previousBlock.hash !== newBlock.previousHash) return false;
        if (hashBlockData(newBlock) !== newBlock.hash) return false;
        if (!this.isValidHashDifficulty(newBlock.hash)) return false;
        if (generateMerkleRoot(newBlock.transactions) !== newBlock.merkleRoot) return false;
        return true;
    }

    // Verifica a validade de toda a cadeia de blocos
    isValidChain() {
        for (let i = 1; i < this.chain.length; i++) {
            try {
                if (!this.isValidNextBlock(this.chain[i], this.chain[i - 1])) {
                    return false;
                }
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