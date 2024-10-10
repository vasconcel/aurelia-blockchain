// Importações.
const crypto = require("crypto");

// Função utilitária para calcular o hash.
function calculateBlockHash(block) {
    const { index, previousHash, timestamp, transactions, nonce } = block;
    const data = JSON.stringify({ index, previousHash, timestamp, transactions, nonce });
    return crypto
        .createHash("sha256")
        .update(data)
        .digest("hex");
}

// Classe Block.
class Block {
    constructor(index, previousHash, timestamp, transactions, hash, nonce) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.hash = hash;
        this.nonce = nonce;
    }

    // Método estático de retorno do bloco gênesis.
    static get genesis() {
        const genesisBlock = new Block(0, "0", 1678886400000, [], null, 0);
        genesisBlock.hash = calculateBlockHash(genesisBlock);
        return genesisBlock;
    }
}

module.exports = { Block, calculateBlockHash };