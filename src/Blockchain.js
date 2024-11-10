import { Block, hashBlockData, generateMerkleRoot } from "./Block.js";
import { Transaction } from "./Transaction.js";
import { Wallet } from './Wallet.js';

// Classe que representa a Blockchain
class Blockchain {
    constructor() {
        // Inicia a blockchain com o bloco gênesis
        this.chain = [Block.genesis];
        
        // Definições de dificuldade e recompensa de mineração
        this.difficulty = 4;            // Quantidade de zeros exigidos no hash para validar o bloco
        this.blockReward = 50;          // Recompensa inicial para mineradores por bloco
        this.halvingInterval = 210000;  // Intervalo para halving da recompensa (em blocos)
        
        // Carteira usada para a recompensa de mineração
        this.miningRewardWallet = new Wallet();
        
        // Índice de transações para rastrear histórico de transações de endereços
        this.transactionIndex = {};
    }

    // Retorna a cadeia de blocos
    getBlockchain() {
        return this.chain;
    }

    // Retorna o último bloco da cadeia
    get latestBlock() {
        return this.chain[this.chain.length - 1];
    }

    // Verifica se o hash do bloco atende à dificuldade atual da rede
    isValidHashDifficulty(hash) {
        return hash.startsWith("0".repeat(this.difficulty));
    }

    // Método assíncrono para mineração de um novo bloco
    async mine(transactions) {
        // Verifica se há transações para minerar
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
            timestamp = Date.now(); // Atualiza o timestamp em cada iteração
            nextHash = hashBlockData({
                index: nextIndex,
                previousHash,
                timestamp,
                transactions,
                nonce,
                merkleRoot,
            });

            // Verifica se o hash gerado atende à dificuldade
            if (this.isValidHashDifficulty(nextHash)) {
                // Cria o novo bloco e atualiza a recompensa se o halvingInterval for atingido
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
                this.updateTransactionIndex(transactions); // Atualiza o índice de transações

                return newBlock;
            }
            nonce++; // Incrementa o nonce para a próxima tentativa
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

            // Adiciona transação ao índice do destinatário (exceto a carteira de recompensa)
            if (recipient !== this.miningRewardWallet.getAddress()) {
                if (!this.transactionIndex[recipient]) {
                    this.transactionIndex[recipient] = [];
                }
                this.transactionIndex[recipient].push(tx);
            }
        }
    }

    // Retorna o histórico de transações de um endereço específico
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
        if (previousBlock.index + 1 !== newBlock.index) return false; // Verifica o índice do bloco
        if (previousBlock.hash !== newBlock.previousHash) return false; // Verifica o hash do bloco anterior
        if (hashBlockData(newBlock) !== newBlock.hash) return false; // Verifica o hash do novo bloco
        if (!this.isValidHashDifficulty(newBlock.hash)) return false; // Verifica a dificuldade
        if (generateMerkleRoot(newBlock.transactions) !== newBlock.merkleRoot) return false; // Verifica a Merkle Root
        return true;
    }

    // Verifica a validade de toda a cadeia de blocos
    isValidChain() {
        for (let i = 1; i < this.chain.length; i++) {
            try {
                if (!this.isValidNextBlock(this.chain[i], this.chain[i - 1])) {
                    return false;
                }
                this.chain[i].validateTransactions(); // Valida as transações do bloco
            } catch (error) {
                console.error(`Error validating block ${i}:`, error);
                return false;
            }
        }
        return true; // Retorna true se todos os blocos e transações forem válidos
    }
}

// Exporta a classe Blockchain para ser usada em outros módulos.
export default Blockchain;