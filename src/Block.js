import crypto from "crypto";

// Calcula o hash de um bloco usando SHA256.
function hashBlockData(block) {
    const { index, previousHash, timestamp, transactions, nonce } = block;

    // Coleta os hashes de cada transação.
    const transactionHashes = transactions.map(tx => tx.transactionHash);

    // Serializa os dados do bloco em formato JSON.
    const data = JSON.stringify({
        index,
        previousHash,
        timestamp,
        transactionHashes,
        nonce
    });

    // Gera e retorna o hash do conjunto de dados.
    return crypto.createHash("sha256").update(data).digest("hex");
}

class Block {
    constructor(index, previousHash, timestamp, transactions, hash, nonce) {
        this.index = index;  // Índice do bloco na cadeia.
        this.previousHash = previousHash;  // Hash do bloco anterior.
        this.timestamp = timestamp;  // Data/hora de criação.
        this.transactions = transactions;  // Transações incluídas.
        this.hash = hash;  // Hash do bloco.
        this.nonce = nonce;  // Nonce usado no Proof-of-Work.
    }

    // Retorna o bloco gênesis, o primeiro da blockchain.
    static get genesis() {
        const genesisTransactions = [];
        const genesisBlock = new Block(0, "0", 1678886400000, genesisTransactions, null, 0);
        genesisBlock.hash = hashBlockData(genesisBlock);  // Calcula o hash do bloco gênesis.
        return genesisBlock;
    }
}

export { Block, hashBlockData };