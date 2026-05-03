import crypto from "crypto";

/**
 * SHA-256 hashing utility for cryptographic operations.
 * @param {string} data - String data to hash.
 * @returns {string} Hexadecimal hash string.
 */
function sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generates a Merkle root from a list of transactions using recursive hashing.
 * Research Purpose: Enables efficient verification of transaction integrity within a block.
 * @param {Array} transactions - Array of Transaction objects.
 * @returns {string|null} Merkle root hash or null if no transactions.
 */
function generateMerkleRoot(transactions) {
    if (!transactions || transactions.length === 0) return null;

    let hashes = transactions.map(tx => sha256(JSON.stringify(tx)));

    while (hashes.length > 1) {
        const newHashes = [];
        for (let i = 0; i < hashes.length; i += 2) {
            const left = hashes[i];
            const right = i + 1 < hashes.length ? hashes[i + 1] : left;
            newHashes.push(sha256(left + right));
        }
        hashes = newHashes;
    }
    return hashes[0];
}

/**
 * Represents a single block in the blockchain.
 * Contains transactions, proof-of-work nonce, and cryptographic hashes for chain integrity.
 */
class Block {
    /**
     * Creates a new Block instance.
     * @param {number} index - Block position in the chain.
     * @param {string} previousHash - Hash of the previous block.
     * @param {number} timestamp - Block creation timestamp (ms).
     * @param {Array} transactions - Array of Transaction objects.
     * @param {number} nonce - Proof-of-work counter value.
     * @param {string|null} merkleRoot - Merkle root hash of transactions.
     * @param {number} difficulty - Mining difficulty level (1-5).
     */
    constructor(index, previousHash, timestamp, transactions, nonce, merkleRoot, difficulty = 4) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.nonce = nonce;
        this.merkleRoot = merkleRoot;
        this.difficulty = difficulty;
        this.hash = this.calculateBlockHash();
    }

    /**
     * Creates the genesis block (block 0) for chain initialization.
     * @returns {Block} Genesis block instance.
     */
    static getGenesis() {
        const genesisTransactions = [];
        const genesisMerkleRoot = generateMerkleRoot(genesisTransactions);
        return new Block(0, "0", 1678886400000, genesisTransactions, 0, genesisMerkleRoot, 4);
    }

    /**
     * Calculates cumulative difficulty contribution of this block.
     * Research Purpose: Used in fork resolution (heaviest chain rule).
     * @returns {number} Cumulative difficulty (16^difficulty).
     */
    getCumulativeDifficulty() {
        return Math.pow(16, this.difficulty);
    }

    /**
     * Calculates total cumulative difficulty for a chain.
     * Research Purpose: Fork resolution algorithm compares cumulative difficulty.
     * @param {Array} chain - Array of Block objects.
     * @returns {number} Total cumulative difficulty.
     */
    calculateChainDifficulty(chain) {
        let total = 0;
        for (const block of chain) {
            total += Math.pow(16, block.difficulty || 4);
        }
        return total;
    }

    /**
     * Computes SHA-256 hash of the block including all transaction data.
     * Research Purpose: Ensures block integrity; tampering any field invalidates hash.
     * @returns {string} Block hash.
     */
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
                nonce: tx.nonce,
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

    /**
     * Validates all transaction signatures in the block.
     * Research Purpose: Ensures transaction authenticity; prevents fraud.
     * @throws {Error} If any transaction signature is invalid.
     */
    validateTransactions() {
        for (const tx of this.transactions) {
            if (!tx.verifySignature()) {
                throw new Error(`Invalid transaction signature: ${JSON.stringify(tx)}`);
            }
        }
    }

    /**
     * Recalculates Merkle root from current transactions.
     * Research Purpose: Updates root after transactions are modified.
     */
    calculateMerkleRoot() {
        this.merkleRoot = generateMerkleRoot(this.transactions);
    }
}

export { Block, generateMerkleRoot };