import { ethers } from 'ethers';

class Wallet {
    constructor() {
        this.wallet = ethers.Wallet.createRandom();
        this.provider = ethers.getDefaultProvider(); // ou um provider específico, se necessário
        this.signer = this.wallet.connect(this.provider);
    }

    getAddress() {
        return this.wallet.address;
    }

    getPublicKey() {
        return this.wallet.publicKey;
    }

    signTransaction(transaction) {
      const message = transaction.calculateHash();
      return this.signer.signMessage(message);

    }

    verifyTransaction(transaction, signature) {
        try {
            const message = transaction.calculateHash();
            const recoveredAddress = ethers.utils.verifyMessage(message, signature);
            return recoveredAddress === this.getAddress();
        } catch (error) {
            return false; // Lidando com potenciais erros na verificação
        }
    }
}

export { Wallet };