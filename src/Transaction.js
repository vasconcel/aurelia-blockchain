import crypto from 'crypto';

// Classe que representa uma transação entre carteiras
export class Transaction {
    constructor(senderWallet, recipientAddress, amount) {
        // Validação dos parâmetros de transação
        if (!senderWallet || !recipientAddress || typeof amount !== 'number' || amount <= 0) {
            throw new Error('Invalid transaction parameters.');
        }

        // Propriedades da transação
        this.senderWallet = senderWallet; // Carteira do remetente
        this.recipient = recipientAddress; // Endereço do destinatário
        this.amount = amount; // Quantia a ser transferida
        this.timestamp = Date.now(); // Data e hora da criação da transação
        this.signature = null; // Assinatura da transação, inicialmente nula
    }

    // Calcula o hash da transação com base nos dados da transação
    calculateHash() {
        const dataToHash = `${this.senderWallet.getPublicKey()}${this.recipient}${this.amount}${this.timestamp}`;
        return crypto.createHash('sha256').update(dataToHash).digest('hex');
    }

    // Assina a transação com a chave privada do remetente
    signTransaction() {
        this.signature = this.senderWallet.signTransaction(this); // A assinatura é gerada pela carteira do remetente
    }

    // Verifica a assinatura da transação para garantir sua autenticidade
    verifySignature() {
        if (!this.signature) return false; // Retorna falso se não houver assinatura
        return this.senderWallet.verifyTransaction(this, this.signature); // Verifica a assinatura usando a carteira do remetente
    }

    // Exibe detalhes da transação, incluindo o status da assinatura
    async displayTransaction() {
        const signature = await this.signature; // Obtém a assinatura, se disponível
        const signatureStatus = signature ? signature : "Not signed yet"; // Exibe o status da assinatura
        return `Transaction Hash: ${this.calculateHash()}\nFrom: ${this.senderWallet.getAddress()}\nTo: ${this.recipient}\nAmount: ${this.amount}\nTimestamp: ${new Date(this.timestamp).toLocaleString()}\nSignature: ${signatureStatus}`;
    }
}

// Classe para gerenciar uma lista de transações
export class TransactionList {
    constructor() {
        this.transactions = []; // Array que armazena as transações
    }

    // Adiciona uma nova transação à lista, se for uma instância válida da classe Transaction
    addTransaction(transaction) {
        if (transaction instanceof Transaction) {
            this.transactions.push(transaction);
        } else {
            throw new Error('Only instances of Transaction can be added.');
        }
    }

    // Retorna a lista de transações armazenadas
    getTransactions() {
        return this.transactions;
    }

    // Limpa a lista de transações
    clearTransactions() {
        this.transactions = [];
    }
}