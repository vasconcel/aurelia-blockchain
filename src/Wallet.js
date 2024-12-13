import { ethers } from 'ethers';
const { hashMessage, verifyMessage } = ethers;

class Wallet {
    constructor() {
        this.wallet = ethers.Wallet.createRandom();
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
        const messageBytes = ethers.getBytes("0x" + message);
        const prefixedMessage = hashMessage(messageBytes);
        const signature = await this.wallet.signMessage(messageBytes);
        return signature;
    }

    verifyTransaction(transaction, signature) {
        const message = transaction.calculateHash();
        const messageBytes = ethers.getBytes("0x" + message);
        const prefixedMessage = hashMessage(messageBytes);
        try {
            const recoveredAddress = verifyMessage(messageBytes, signature);
            return recoveredAddress === this.getAddress();
        } catch (error) {
            console.error("Erro ao verificar a assinatura:", error);
            return false;
        }
    }
}

export { Wallet };