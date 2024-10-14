const crypto = require('crypto');

class Transaction {
    constructor(sender, recipient, amount) {
        this.sender = sender;
        this.recipient = recipient;
        this.amount = amount;
        this.timestamp = Date.now();
        this.transactionHash = this.calculateHash();
    }

    calculateHash() {
        const data = this.sender + this.recipient + this.amount + this.timestamp;
        return crypto.createHash("sha256").update(data).digest("hex");
    }

    displayTransaction() {
        return `Transaction Hash: ${this.transactionHash}\n` +
               `From: ${this.sender}\n` +
               `To: ${this.recipient}\n` +
               `Value: ${this.amount}\n` +
               `Timestamp: ${new Date(this.timestamp).toLocaleString()}\n`;
    }
}

class TransactionList {
    constructor() {
        this.transactions = [];
    }

    addTransaction(transaction) {
        this.transactions.push(transaction);
    }

    getTransactions() {
        return this.transactions;
    }

    clearTransactions() {
        this.transactions = [];
    }
}

module.exports = { Transaction, TransactionList };