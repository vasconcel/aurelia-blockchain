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
        console.log("Chave privada:", this.wallet.privateKey);
        return this.wallet.privateKey;
    }

    getPublicKey() {
        return this.wallet.publicKey;
    }

    async signTransaction(transaction) {
        const message = transaction.calculateHash();
        console.log("Mensagem a ser assinada (hash):", message);
        const messageBytes = ethers.getBytes("0x" + message);
        console.log("Mensagem em bytes:", messageBytes);

        // Use hashMessage para adicionar o prefixo
        const prefixedMessage = hashMessage(messageBytes);
        console.log("Mensagem com Prefixo:", prefixedMessage);

        const signature = await this.wallet.signMessage(messageBytes);
        console.log("Assinatura gerada:", signature);
        return signature;
    }

    verifyTransaction(transaction, signature) {
        const message = transaction.calculateHash();
        console.log("Mensagem a ser verificada (hash):", message);
        const messageBytes = ethers.getBytes("0x" + message);
        
        // Use hashMessage para adicionar o prefixo
        const prefixedMessage = hashMessage(messageBytes);
        console.log("Mensagem com Prefixo a ser verificada:", prefixedMessage);

        console.log("Assinatura recebida:", signature);
        try {
            // Use verifyMessage para recuperar o endereço
            const recoveredAddress = verifyMessage(messageBytes, signature);
            console.log("Endereço recuperado:", recoveredAddress);
            console.log("Endereço da carteira:", this.getAddress());
            return recoveredAddress === this.getAddress();
        } catch (error) {
            console.error("Erro ao verificar a assinatura:", error);
            return false;
        }
    }
}

export { Wallet };