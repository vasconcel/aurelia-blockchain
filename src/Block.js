import crypto from "crypto";
import sha256 from 'crypto-js/sha256.js';

// Função para calcular o hash de um bloco usando o algoritmo SHA-256.
function hashBlockData(block) {
    // Desestrutura os campos relevantes do bloco.
    const { index, previousHash, timestamp, merkleRoot, nonce } = block;

    // Serializa os dados do bloco para garantir uma estrutura consistente de hashing.
    const data = JSON.stringify({
        index,
        previousHash,
        timestamp,
        merkleRoot,
        nonce
    });

    // Gera e retorna o hash SHA-256 do bloco com base em seus dados.
    return crypto.createHash("sha256").update(data).digest("hex");
}

// Função para gerar a Merkle Root (raiz da árvore de Merkle) das transações de um bloco.
function generateMerkleRoot(transactions) {
    // Retorna null se não houver transações para evitar erros.
    if (!transactions || transactions.length === 0) {
        return null;
    }

    // 1. Calcula o hash SHA-256 de cada transação individualmente.
    let hashes = transactions.map(tx => sha256(JSON.stringify(tx)).toString());

    // 2. Constrói a árvore de Merkle concatenando e hasheando pares de hashes em cada nível.
    while (hashes.length > 1) {
        const newHashes = [];
        for (let i = 0; i < hashes.length; i += 2) {
            const left = hashes[i];
            const right = i + 1 < hashes.length ? hashes[i + 1] : left; // Se não houver par, duplica o hash.
            newHashes.push(sha256(left + right).toString());
        }
        hashes = newHashes; // Atualiza o array de hashes com os hashes gerados no nível atual.
    }

    // 3. Retorna o único hash restante, que é a raiz da árvore de Merkle.
    return hashes[0];
}

// Classe para representar um bloco na blockchain.
class Block {
    constructor(index, previousHash, timestamp, transactions, hash, nonce, merkleRoot) {
        this.index = index;                 // Índice do bloco na cadeia.
        this.previousHash = previousHash;   // Hash do bloco anterior na cadeia.
        this.timestamp = timestamp;         // Timestamp de criação do bloco.
        this.transactions = transactions;   // Transações incluídas no bloco.
        this.hash = hash;                   // Hash do bloco atual.
        this.nonce = nonce;                 // Nonce usado para validação do bloco (Proof-of-Work).
        this.merkleRoot = merkleRoot;       // Raiz da árvore de Merkle das transações do bloco.
    }

    // Retorna o bloco gênesis (primeiro bloco da blockchain), que é imutável.
    static get genesis() {
        const genesisTransactions = []; // Bloco gênesis inicia sem transações.
        const genesisMerkleRoot = generateMerkleRoot(genesisTransactions);
        
        // Cria e calcula o hash do bloco gênesis com dados padronizados.
        const genesisBlock = new Block(0, "0", 1678886400000, genesisTransactions, null, 0, genesisMerkleRoot);
        genesisBlock.hash = hashBlockData(genesisBlock); // Define o hash após a criação do bloco.
        
        return genesisBlock;
    }

    // Método para validar todas as transações do bloco.
    validateTransactions() {
        for (const tx of this.transactions) {
            // Verifica a assinatura de cada transação, lançando erro se inválida.
            if (!tx.verifySignature()) {
                throw new Error(`Invalid transaction signature: ${JSON.stringify(tx)}`);
            }
        }
    }

    // Método para calcular e atualizar a Merkle Root do bloco com base em suas transações.
    calculateMerkleRoot() {
        this.merkleRoot = generateMerkleRoot(this.transactions);
    }
}

// Exporta a classe Block e as funções hashBlockData e generateMerkleRoot para uso externo.
export { Block, hashBlockData, generateMerkleRoot };