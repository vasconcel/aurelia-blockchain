const crypto = require("crypto");

function hashBlockData(block) {
    const { index, previousHash, timestamp, transactions, nonce } = block;

    const transactionHashes = transactions.map(tx => tx.transactionHash);

    const data = JSON.stringify({
        index,
        previousHash,
        timestamp,
        transactionHashes,
        nonce
    });

    return crypto.createHash("sha256").update(data).digest("hex");
}

class Block {
    constructor(index, previousHash, timestamp, transactions, hash, nonce) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.hash = hash;
        this.nonce = nonce;
    }

    static get genesis() {
        const genesisTransactions = [];
        const genesisBlock = new Block(0, "0", 1678886400000, genesisTransactions, null, 0);
        genesisBlock.hash = hashBlockData(genesisBlock);
        return genesisBlock;
    }
}

module.exports = { Block, hashBlockData };