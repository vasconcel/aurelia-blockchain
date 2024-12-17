import { Transaction } from './Transaction.js';
import { Wallet } from './Wallet.js';

class P2PNetwork {
    constructor(blockchain, nodes = []) {
        this.blockchain = blockchain;
        this.nodes = nodes;
        this.transactionPool = [];
    }

    connectToPeer(peer) {
        this.nodes.push(peer);
    }

    async broadcastTransaction(transaction) {
        for (const node of this.nodes) {
            await node.onTransactionReceived(transaction, node);
        }
        this.onTransactionReceived(transaction, this);
    }

    broadcastBlock(block) {
        console.log("Transmitindo bloco:", block);
        this.nodes.forEach(node => node.onBlockReceived(block));
    }

    async onTransactionReceived(transaction, node) {
        console.log(`Nó ${node.blockchain.id || 'principal'} - Transação recebida. Validando...`);
        if (node.blockchain.isValidTransaction(transaction)) {
            console.log(`Nó ${node.blockchain.id || 'principal'} - Transação válida. Adicionando ao pool...`);
            node.transactionPool.push(transaction);
        } else {
            console.error(`Nó ${node.blockchain.id || 'principal'} - Transação inválida recebida. Descartando...`);
        }
    }

    async onBlockReceived(block) {
        console.log(`Nó ${this.blockchain.id || 'principal'} - onBlockReceived - Bloco recebido:`, block);
        if (!block || block.hash === undefined) {
            console.error(`Nó ${this.blockchain.id || 'principal'} - Received an invalid block.`);
            return;
        }

        const blockExists = this.blockchain.chain.some(existingBlock => existingBlock.hash === block.hash);
        if (blockExists) {
            console.log(`Nó ${this.blockchain.id || 'principal'} - Bloco recebido já existe na cadeia. Ignorando.`);
            return;
        }

        if (block.index === this.blockchain.latestBlock.index + 1) {
            console.log(`Nó ${this.blockchain.id || 'principal'} - onBlockReceived - Recebendo bloco com index imediatamente posterior.`);
            if (this.blockchain.isValidNextBlock(block, this.blockchain.latestBlock)) {
                this.blockchain.addBlock(block);
                console.log(`Nó ${this.blockchain.id || 'principal'} - Bloco válido recebido e adicionado à cadeia.`);
                this.transactionPool = this.transactionPool.filter(tx => {
                    return !block.transactions.some(blockTx => blockTx.signature === tx.signature);
                });
                this.blockchain.latestBlock = block;
            } else {
                console.error(`Nó ${this.blockchain.id || 'principal'} - Bloco inválido recebido e rejeitado.`);
            }
        } else if (block.index > this.blockchain.latestBlock.index + 1) {
            console.log(`Nó ${this.blockchain.id || 'principal'} - onBlockReceived - Recebendo bloco de um futuro distante. Solicitando blocos faltantes.`);
            this.requestMissingBlocks(this.blockchain.latestBlock.index + 1, block.index - 1);
        } else if (block.index <= this.blockchain.latestBlock.index) {
            console.log(`Nó ${this.blockchain.id || 'principal'} - Bloco recebido é mais antigo ou igual ao último bloco. Verificando forks.`);
            await this.resolveFork();
        }
    }

    async resolveFork(forkedBlockchain) {
        for (const node of this.nodes) {
            const theirLatestBlock = await node.requestBlockchain();
            if (theirLatestBlock && theirLatestBlock.index > this.blockchain.latestBlock.index) {
                console.log("Possível fork detectado. Recebido bloco com index maior.");
                await this.requestMissingBlocks(this.blockchain.latestBlock.index + 1, theirLatestBlock.index, forkedBlockchain);
                if(this.blockchain.isValidChain()){
                    this.blockchain.latestBlock = theirLatestBlock;
                    console.log("Fork resolvido. Adotada a blockchain mais longa.");
                    return;
                }
                console.warn("Blockchain recebida inválida. Continuando com a atual.");
                return;
            } else if (theirLatestBlock && theirLatestBlock.index === this.blockchain.latestBlock.index) {
                console.log("Possível fork detectado. Recebido bloco com mesmo index.");
                if (theirLatestBlock.timestamp > this.blockchain.latestBlock.timestamp) {
                    console.log("Fork resolved. Adopted a block with a later timestamp.");
                    this.blockchain.addBlock(theirLatestBlock);
                    this.blockchain.latestBlock = theirLatestBlock;
                    return;
                }
            }
        }
        console.warn("Fork resolution failed. Staying with current chain.");
    }

    async requestMissingBlocks(startIndex, endIndex, forkedBlockchain) {
        console.warn(`Blocos faltando de ${startIndex} a ${endIndex}. Solicitando...`);
        if (forkedBlockchain) {
            for (let i = startIndex; i <= endIndex; i++) {
                const missingBlock = forkedBlockchain.chain.find(block => block.index === i);
                if (missingBlock) {
                    console.log("Adicionando bloco faltante:", missingBlock);
                    this.blockchain.addBlock(missingBlock);
                }
            }
        }
    }

    async requestBlockchain() {
        return null;
    }
}

export default P2PNetwork;