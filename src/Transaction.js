const crypto = require('crypto');

class Transaction {
    constructor(sender, recipient, amount) {
        this.sender = sender; // Endereço do remetente.
        this.recipient = recipient; // Endereço do destinatário.
        this.amount = amount; // Valor da transação.
        this.timestamp = Date.now(); // Marca temporal da transação.
        this.transactionHash = this.calculateHash(); // Calcula o hash da transação.
    }

    calculateHash() {
        // Gera um hash único para a transação com base nos dados.
        const data = this.sender + this.recipient + this.amount + this.timestamp;
        return crypto.createHash("sha256").update(data).digest("hex");
    }

    displayTransaction() {
        // Exibe detalhes da transação de forma legível.
        return `Transaction Hash: ${this.transactionHash}\n` +
               `From: ${this.sender}\n` +
               `To: ${this.recipient}\n` +
               `Value: ${this.amount}\n` +
               `Timestamp: ${new Date(this.timestamp).toLocaleString()}\n`;
    }
}

class TransactionList {
    constructor() {
        this.transactions = []; // Inicializa a lista de transações.
    }

    addTransaction(transaction) {
        // Adiciona uma nova transação à lista.
        this.transactions.push(transaction);
    }

    getTransactions() {
        // Retorna todas as transações na lista.
        return this.transactions;
    }

    clearTransactions() {
        // Limpa a lista de transações.
        this.transactions = [];
    }
}

module.exports = { Transaction, TransactionList };