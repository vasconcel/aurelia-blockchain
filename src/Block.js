import crypto from "crypto";
import sha256 from 'crypto-js/sha256.js';

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
    constructor(index, previousHash, timestamp, transactions, nonce, merkleRoot) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.nonce = nonce;
        this.merkleRoot = merkleRoot;
        this.hash = this.calculateBlockHash();
    }

    static get genesis() {
        const genesisTransactions = [];
        const genesisMerkleRoot = generateMerkleRoot(genesisTransactions);
        const genesisBlock = new Block(0, "0", 1678886400000, genesisTransactions, 0, genesisMerkleRoot);
        return genesisBlock;
    }

    calculateBlockHash() {
        const { index, previousHash, timestamp, merkleRoot, nonce } = this;
        const transactions = this.transactions.map(tx => {
            const senderAddress = tx.senderWallet ? tx.senderWallet.getAddress() : 'Coinbase';
            return JSON.stringify({
                sender: senderAddress,
                recipient: tx.recipient,
                amount: tx.amount,
                fee: tx.fee,
                timestamp: tx.timestamp,
                signature: tx.signature
            });
        });

        transactions.sort((a, b) => {
            const hashA = crypto.createHash('sha256').update(JSON.stringify(a)).digest('hex');
            const hashB = crypto.createHash('sha256').update(JSON.stringify(b)).digest('hex');
            return hashA.localeCompare(hashB);
        });

        const blockString = `${index}${previousHash}${timestamp}${merkleRoot}${nonce}${transactions.join('')}`;
        return crypto.createHash('sha256').update(blockString).digest('hex');
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

export { Block, generateMerkleRoot };