import crypto from "crypto";
import sha256 from 'crypto-js/sha256.js';

// Calcula o hash de um bloco usando sha256.
function hashBlockData(block) {
    const { index, previousHash, timestamp, merkleRoot, nonce } = block;

    // Serializa os dados do bloco em formato JSON.
    const data = JSON.stringify({
        index,
        previousHash,
        timestamp,
        merkleRoot,
        nonce
    });

    // Gera e retorna o hash do conjunto de dados.
    return crypto.createHash("sha256").update(data).digest("hex");
}

function generateMerkleRoot(transactions) {
    if (!transactions || transactions.length === 0) {
      return null; // Trata o caso de nenhuma transação
    }
  
    // 1. Calcula o hash de cada transação:
    let hashes = transactions.map(tx => sha256(JSON.stringify(tx)).toString());
  
    // 2. Constrói a árvore em níveis, concatenando e hasheando pares de hashes:
    while (hashes.length > 1) {
      const newHashes = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = i + 1 < hashes.length ? hashes[i + 1] : left; // Duplica o último hash se ímpar
        newHashes.push(sha256(left + right).toString());
      }
      hashes = newHashes;
    }
  
    // 3. Retorna a raiz da árvore (o único hash restante):
    return hashes[0];
  }

class Block {
    constructor(index, previousHash, timestamp, transactions, hash, nonce, merkleRoot) {
        this.index = index;  // Índice do bloco na cadeia.
        this.previousHash = previousHash;  // Hash do bloco anterior.
        this.timestamp = timestamp;  // Data/hora de criação.
        this.transactions = transactions;  // Transações incluídas.
        this.hash = hash;  // Hash do bloco.
        this.nonce = nonce;  // Nonce usado no Proof-of-Work.
        this.merkleRoot = merkleRoot; // Raiz da Merkle Tree
    }

    // Retorna o bloco gênesis, o primeiro da blockchain.
    static get genesis() {
        const genesisTransactions = [];
        const genesisMerkleRoot = generateMerkleRoot(genesisTransactions); // Calcula a Merkle Root do bloco gênesis
        const genesisBlock = new Block(0, "0", 1678886400000, genesisTransactions, null, 0, genesisMerkleRoot);
        genesisBlock.hash = hashBlockData(genesisBlock);  // Calcula o hash do bloco gênesis.
        return genesisBlock;
    }
}

export { Block, hashBlockData, generateMerkleRoot };