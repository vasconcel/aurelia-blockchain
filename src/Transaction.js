import crypto from 'crypto';

/**
 * Represents a blockchain transaction.
 * Research Purpose: Model for value transfer; includes nonce for replay protection.
 */
class Transaction {
    /**
     * Creates a new Transaction instance.
     * @param {Wallet} senderWallet - Sender's wallet.
     * @param {string} recipientAddress - Recipient's address.
     * @param {number} amount - Amount to transfer.
     * @param {number} fee - Transaction fee for miner.
     * @param {number} nonce - Sequential nonce (replay protection).
     */
    constructor(senderWallet, recipientAddress, amount, fee, nonce = 0) {
        if (!senderWallet || !recipientAddress || typeof amount !== 'number' || amount <= 0) {
            throw new Error('Invalid transaction parameters.');
        }
        if (typeof fee !== 'number' || fee < 0) {
            throw new Error('Transaction fee must be a non-negative number.');
        }
        if (typeof nonce !== 'number' || nonce < 0) {
            throw new Error('Transaction nonce must be a non-negative number.');
        }
        this.senderWallet = senderWallet;
        this.recipient = recipientAddress;
        this.amount = amount;
        this.fee = fee;
        this.nonce = nonce;
        this.timestamp = Date.now();
        this.signature = null;
    }

    /**
     * Calculates SHA-256 hash of the transaction.
     * @returns {string} Transaction hash.
     */
    calculateHash() {
        const dataToHash = `${this.senderWallet.getAddress()}${this.recipient}${this.amount}${this.fee}${this.timestamp}${this.nonce}`;
        return crypto.createHash('sha256').update(dataToHash).digest('hex');
    }

    /**
     * Signs the transaction with sender's private key.
     * @returns {string} Signature hex string.
     */
    async signTransaction() {
        this.signature = await this.senderWallet.signTransaction(this);
        return this.signature;
    }

    /**
     * Verifies transaction signature.
     * Research Purpose: Transaction authenticity - ensures sender authorized this transaction.
     * @returns {boolean} True if signature is valid.
     */
    verifySignature() {
        if (!this.signature) return false;
        return this.senderWallet.verifyTransaction(this, this.signature);
    }

    /**
     * Returns human-readable transaction representation.
     * @returns {string} Formatted transaction string.
     */
    async displayTransaction() {
        const signature = await this.signature;
        const signatureStatus = signature ? signature : "Not signed yet";
        return `Transaction Hash: ${this.calculateHash()}\nFrom: ${this.senderWallet.getAddress()}\nTo: ${this.recipient}\nAmount: ${this.amount}\nFee: ${this.fee}\nTimestamp: ${new Date(this.timestamp).toLocaleString()}\nSignature: ${signatureStatus}`;
    }
}

/**
 * Container for managing multiple transactions.
 */
class TransactionList {
    /**
     * Creates a new TransactionList instance.
     */
    constructor() {
        this.transactions = [];
    }

    /**
     * Adds a transaction to the list.
     * @param {Transaction} transaction - Transaction to add.
     */
    addTransaction(transaction) {
        if (transaction instanceof Transaction) {
            this.transactions.push(transaction);
        } else {
            throw new Error('Only instances of Transaction can be added.');
        }
    }

    /**
     * Gets all transactions.
     * @returns {Array} Array of Transaction objects.
     */
    getTransactions() {
        return this.transactions;
    }

    /**
     * Clears all transactions.
     */
    clearTransactions() {
        this.transactions = [];
    }
}

export { Transaction, TransactionList };