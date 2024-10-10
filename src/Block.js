// Importações.
const crypto = require("crypto");

// Função utilitária para calcular o hash.
function calculateBlockHash(index, previousHash, timestamp, transactions, nonce) {
    const stringifiedDAta = JSON.stringify({ index, previousHash, timestamp, transactions, nonce });
    return crypto
        .createHash("sha256")
        .update(stringifiedData)
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
        genesisBlock.hash = calculateBlockHash(
            genesisBlock.index,
            genesisBlock.previousHash,
            genesisBlock.timestamp,
            genesisBlock.transactions,
            genesisBlock.nonce
        )
        return genesisBlock;
    }
}

module.exports = Block;