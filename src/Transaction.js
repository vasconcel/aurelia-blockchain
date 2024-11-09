import crypto from 'crypto';
import { Wallet } from './Wallet.js';

export class Transaction {
    constructor(senderWallet, recipientAddress, amount) {
        if (!senderWallet || !recipientAddress || typeof amount !== 'number' || amount <= 0) {
            throw new Error('Invalid transaction parameters.');
        }
        this.senderWallet = senderWallet;
        this.recipient = recipientAddress;
        this.amount = amount;
        this.timestamp = Date.now();
    }

    calculateHash() {
        const dataToHash = `${this.senderWallet.getPublicKey()}${this.recipient}${this.amount}${this.timestamp}`;
        return crypto.createHash('sha256').update(dataToHash).digest('hex');
    }

    signTransaction() {
        this.signature = this.senderWallet.signTransaction(this);
    }

    verifySignature() {
        return this.senderWallet.verifyTransaction(this, this.signature);
    }

    displayTransaction() {
        const signatureStatus = this.signature ? this.signature : "Not signed yet";
        return `Transaction Hash: ${this.calculateHash()}\nFrom: ${this.senderWallet.getAddress()}\nTo: ${this.recipient}\nAmount: ${this.amount}\nTimestamp: ${new Date(this.timestamp).toLocaleString()}\nSignature: ${signatureStatus}`;
    }
}

// Classe para gerenciar várias transações
export class TransactionList {
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