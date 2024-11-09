import { ethers } from 'ethers';

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

    signTransaction(transaction) {
        const message = transaction.calculateHash();
        const signature = this.wallet.signMessage(message);
        return signature;
    }

    verifyTransaction(transaction, signature) {
        const message = transaction.calculateHash();
        const recoveredAddress = ethers.utils.verifyMessage(message, signature);
        return recoveredAddress === this.getAddress();
    }
}

export { Wallet };