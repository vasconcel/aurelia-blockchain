// Importações.
const crypto = require('crypto');

// Classe Transaction.
class Transaction {
    constructor(sender, recipient, amount) {
        this.sender = sender;
        this.recipient = recipient;
        this.amount = amount;
        this.timestamp = new Date().getTime();
        this.transactionHash = this.calculateHash();
    }

    // Método para calcular o hash da transação.
    calculateHash() {
        return crypto
            .createHash("sha256")
            .update(this.sender + this.recipient + this.amount + this.timestamp)
            .digest("hex");
    }

    // Método para exibir informações da transação.
    displayTransaction() {
        return `Transaction: ${this.transactionHash}
                From: ${this.sender} 
                To: ${this.recipient}
                Value: ${this.amount}
                Timestamp: ${this.timestamp}`;
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