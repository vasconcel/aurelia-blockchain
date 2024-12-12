import crypto from "crypto";
import sha256 from 'crypto-js/sha256.js';

function hashBlockData(block) {
    const { index, previousHash, timestamp, merkleRoot, nonce } = block;
    const data = JSON.stringify({ index, previousHash, timestamp, merkleRoot, nonce });
    return crypto.createHash("sha256").update(data).digest("hex");
}

function generateMerkleRoot(transactions) {
    if (!transactions || transactions.length === 0) return null;

    let hashes = transactions.map(tx => sha256(JSON.stringify(tx)).toString());
    while (hashes.length > 1) {
        const newHashes = [];
        for (let i = 0; i < hashes.length; i += 2) {
            const left = hashes[i];
            const right = i + 1 < hashes.length ? hashes[i + 1] : left;
            newHashes.push(sha256(left + right).toString());
        }
        hashes = newHashes;
    }
    return hashes[0];
}

class Block {
    constructor(index, previousHash, timestamp, transactions, hash, nonce, merkleRoot) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.hash = hash;
        this.nonce = nonce;
        this.merkleRoot = merkleRoot;
    }

    static get genesis() {
        const genesisTransactions = [];
        const genesisMerkleRoot = generateMerkleRoot(genesisTransactions);
        const genesisBlock = new Block(0, "0", 1678886400000, genesisTransactions, null, 0, genesisMerkleRoot);
        genesisBlock.hash = hashBlockData(genesisBlock);
        return genesisBlock;
    }

    validateTransactions() {
        for (const tx of this.transactions) {
            if (!tx.verifySignature()) {
                throw new Error(`Invalid transaction signature: ${JSON.stringify(tx)}`);
            }
        }
    }

    calculateMerkleRoot() {
        this.merkleRoot = generateMerkleRoot(this.transactions);
    }
}

export { Block, hashBlockData, generateMerkleRoot };