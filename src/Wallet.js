import { ethers } from 'ethers';

class Wallet {
    constructor(privateKey = null) {
        if (privateKey) {
            this.wallet = new ethers.Wallet(privateKey);
        } else {
            this.wallet = ethers.Wallet.createRandom();
        }
    }

    getAddress() {
        return this.wallet.address;
    }

    getPrivateKey() {
        return this.wallet.privateKey;
    }

    getPublicKey() {
        return this.wallet.publicKey;
    }

    async signTransaction(transaction) {
        const message = transaction.calculateHash();
        const signature = await this.wallet.signMessage(message);
        return signature;
    }

    verifyTransaction(transaction, signature) {
        const message = transaction.calculateHash();
        try {
            const recoveredAddress = ethers.verifyMessage(message, signature);
            return recoveredAddress === this.getAddress();
        } catch (error) {
            console.error("Erro ao verificar a assinatura:", error);
            return false;
        }
    }
}

export { Wallet };