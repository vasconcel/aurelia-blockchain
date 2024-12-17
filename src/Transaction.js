import crypto from 'crypto';

class Transaction {
    constructor(senderWallet, recipientAddress, amount, fee) {
        if (!senderWallet || !recipientAddress || typeof amount !== 'number' || amount <= 0) {
            throw new Error('Invalid transaction parameters.');
        }
        if (typeof fee !== 'number' || fee < 0) {
            throw new Error('Transaction fee must be a non-negative number.');
        }
        this.senderWallet = senderWallet;
        this.recipient = recipientAddress;
        this.amount = amount;
        this.fee = fee;
        this.timestamp = Date.now();
        this.signature = null;
    }

    calculateHash() {
        const dataToHash = `${this.senderWallet.getAddress()}${this.recipient}${this.amount}${this.fee}${this.timestamp}`;
        return crypto.createHash('sha256').update(dataToHash).digest('hex');
    }

    async signTransaction() {
        this.signature = await this.senderWallet.signTransaction(this);
        return this.signature;
    }

    verifySignature() {
        if (!this.signature) return false;
        return this.senderWallet.verifyTransaction(this, this.signature);
    }

    async displayTransaction() {
        const signature = await this.signature;
        const signatureStatus = signature ? signature : "Not signed yet";
        return `Transaction Hash: ${this.calculateHash()}\nFrom: ${this.senderWallet.getAddress()}\nTo: ${this.recipient}\nAmount: ${this.amount}\nFee: ${this.fee}\nTimestamp: ${new Date(this.timestamp).toLocaleString()}\nSignature: ${signatureStatus}`;
    }
}

class TransactionList {
    constructor() {
        this.transactions = [];
    }

    addTransaction(transaction) {
        if (transaction instanceof Transaction) {
            this.transactions.push(transaction);
        } else {
            throw new Error('Only instances of Transaction can be added.');
        }
    }

    getTransactions() {
        return this.transactions;
    }

    clearTransactions() {
        this.transactions = [];
    }
}

export { Transaction, TransactionList };