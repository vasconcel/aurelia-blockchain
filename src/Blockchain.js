import { Block, hashBlockData, generateMerkleRoot } from "./Block.js";
import { Transaction } from "./Transaction.js";
import { Wallet } from './Wallet.js';

class Blockchain {
    constructor() {
        this.chain = [Block.genesis];
        this.difficulty = 4; // Ajuste a dificuldade conforme necessário
        this.blockReward = 50;
        this.halvingInterval = 210000; // Intervalo de halving (em blocos)
        this.miningRewardWallet = new Wallet(); // Carteira para recompensas de mineração
        this.transactionIndex = {}; // Índice para rastrear transações por endereço
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
        if (!transactions || transactions.length === 0) {
            throw new Error("No transactions to mine.");
        }

        const nextIndex = this.latestBlock.index + 1;
        const previousHash = this.latestBlock.hash;
        let timestamp = Date.now();
        const merkleRoot = generateMerkleRoot(transactions);
        let nonce = 0;
        let nextHash;

        const minerRewardTransaction = new Transaction(
            this.miningRewardWallet,
            this.miningRewardWallet.getAddress(),
            this.blockReward
        );
        transactions.push(minerRewardTransaction);


        while (true) {
            timestamp = Date.now(); // Atualiza o timestamp a cada iteração
            nextHash = hashBlockData({
                index: nextIndex,
                previousHash,
                timestamp,
                transactions,
                nonce,
                merkleRoot,
            });

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

                // Halving da recompensa
                if (nextIndex % this.halvingInterval === 0) {
                    this.blockReward /= 2;
                    console.log(`\nBlock reward halved! New reward: ${this.blockReward}`);
                }

                this.chain.push(newBlock);
                this.updateTransactionIndex(transactions); // Atualiza o índice após minerar
                return newBlock; // Retorna o bloco minerado
            }
            nonce++;
        }
    }

    updateTransactionIndex(transactions) {
        for (const tx of transactions) {
            const sender = tx.senderWallet.getAddress();
            const recipient = tx.recipient;

            // Adiciona transação ao índice do remetente
            if (!this.transactionIndex[sender]) {
                this.transactionIndex[sender] = [];
            }
            this.transactionIndex[sender].push(tx);

            // Adiciona transação ao índice do destinatário (a menos que seja a carteira de recompensa)
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


    addBlock(newBlock) {
        if (!this.isValidNextBlock(newBlock, this.latestBlock)) {
            console.error("Invalid block");
            return false;
        }
        this.chain.push(newBlock);
        this.updateTransactionIndex(newBlock.transactions);
        return true;
    }

    isValidNextBlock(newBlock, previousBlock) {
        if (previousBlock.index + 1 !== newBlock.index) return false;
        if (previousBlock.hash !== newBlock.previousHash) return false;
        if (hashBlockData(newBlock) !== newBlock.hash) return false;
        if (!this.isValidHashDifficulty(newBlock.hash)) return false;
        if (generateMerkleRoot(newBlock.transactions) !== newBlock.merkleRoot) return false;
        return true;
    }

    isValidChain() {
        for (let i = 1; i < this.chain.length; i++) {
            if (!this.isValidNextBlock(this.chain[i], this.chain[i - 1])) {
                return false;
            }
        }
        return true;
    }
}

export default Blockchain;