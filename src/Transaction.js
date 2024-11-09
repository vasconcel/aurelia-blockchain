import crypto from 'crypto';
import { Wallet } from './Wallet.js';

export class Transaction {
    constructor(senderWallet, recipientAddress, amount) {
        this.senderWallet = senderWallet;
        this.recipient = recipientAddress;
        this.amount = amount;
        this.timestamp = Date.now(); // Usar timestamp numérico para facilitar a verificação
    }


    calculateHash() {
        const dataToHash = `${this.senderWallet.getPublicKey()}${this.recipient}${this.amount}${this.timestamp}`;
        const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');
        return hash;
    }

    async signTransaction() { // Tornar assíncrono
        if (!this.senderWallet || typeof this.senderWallet.signTransaction !== 'function') {
            throw new Error('Sender wallet must be provided and have a signTransaction method.');
        }

        this.signature = await this.senderWallet.signTransaction(this); // Aguardar a assinatura


    }

    verifySignature() {
        if (!this.senderWallet || typeof this.senderWallet.verifyTransaction !== 'function') {
            throw new Error('Sender wallet must be provided and have a verifyTransaction method.');
        }
        if (!this.signature) {
            throw new Error('Transaction must be signed before verification.');

        }

        return this.senderWallet.verifyTransaction(this, this.signature);
    }



    async displayTransaction() { // Tornar assíncrono para esperar a assinatura, se necessário.
        const signature = this.signature ? this.signature : "Not signed yet"; // Exibir mensagem se não assinada
        return `Transaction Hash: ${this.calculateHash()}\nFrom: ${this.senderWallet.getAddress()}\nTo: ${this.recipient}\nValue: ${this.amount}\nTimestamp: ${new Date(this.timestamp).toLocaleString()}\nSignature: ${signature}`;

    }

}

export class TransactionList {
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