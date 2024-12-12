import { ethers } from 'ethers';
const { recoverAddress } = ethers;

class Wallet {
    constructor() {
        this.wallet = ethers.Wallet.createRandom();
    }

    getAddress() {
        return this.wallet.address;
    }

    getPrivateKey() {
        console.log("Chave privada:", this.wallet.privateKey);
        return this.wallet.privateKey;
    }

    getPublicKey() {
        return this.wallet.publicKey;
    }

    async signTransaction(transaction) {
        const message = transaction.calculateHash();
        const messageBytes = ethers.getBytes("0x" + message);
        const signature = await this.wallet.signMessage(messageBytes);
        return signature;
    }

    verifyTransaction(transaction, signature) {
        const message = transaction.calculateHash();
        try {
            const recoveredAddress = recoverAddress("0x" + message, signature);
            return recoveredAddress === this.getAddress();
        } catch (error) {
            console.error("Erro ao verificar a assinatura:", error);
            return false;
        }
    }
}

export { Wallet };