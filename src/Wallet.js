import { ethers } from 'ethers';

// Classe que representa uma carteira para gerenciar chaves e assinaturas de transações
class Wallet {
    constructor() {
        // Cria uma carteira aleatória usando a biblioteca ethers
        this.wallet = ethers.Wallet.createRandom();
    }

    // Retorna o endereço público da carteira (identificador da carteira)
    getAddress() {
        return this.wallet.address;
    }

    // Retorna a chave pública associada à carteira
    getPublicKey() {
        return this.wallet.publicKey;
    }

    // Assina uma transação utilizando a chave privada da carteira
    signTransaction(transaction) {
        // Gera o hash da transação a partir dos dados da transação
        const message = transaction.calculateHash();

        // Cria uma assinatura digital usando a chave privada da carteira
        const signature = this.wallet.signMessage(message);
        return signature;
    }

    // Verifica a autenticidade da assinatura de uma transação
    verifyTransaction(transaction, signature) {
        // Recalcula o hash da transação para comparação
        const message = transaction.calculateHash();

        // Recupera o endereço a partir da assinatura e do hash da transação
        const recoveredAddress = ethers.utils.verifyMessage(message, signature);

        // Compara o endereço recuperado com o endereço da carteira
        return recoveredAddress === this.getAddress();
    }
}

export { Wallet };