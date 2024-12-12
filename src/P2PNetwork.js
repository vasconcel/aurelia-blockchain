import Blockchain from './Blockchain.js';
import { Transaction } from './Transaction.js';

class P2PNetwork {
    constructor(blockchain, nodes = []) {
        this.blockchain = blockchain;
        this.nodes = nodes;
        this.transactionPool = [];
    }

    connectToPeer(peer) {
        this.nodes.push(peer);
    }

    broadcastTransaction(transaction) {
        this.nodes.forEach(node => node.onTransactionReceived(transaction));
    }

    broadcastBlock(block) {
        this.nodes.forEach(node => node.onBlockReceived(block));
    }

    onTransactionReceived(transaction) {
        this.transactionPool.push(transaction);
        if (this.transactionPool.length >= 2) {
            this.mineBlockWithTransactions();
        }
    }

    async mineBlockWithTransactions() {
        try {
            const transactionsToMine = structuredClone(this.transactionPool);
            const newBlock = await this.blockchain.mine(transactionsToMine);
            this.broadcastBlock(newBlock);
            this.transactionPool = [];
        } catch (error) {
            console.error('Erro ao minerar o bloco:', error);
        }
    }

    onBlockReceived(block) {
        if (!block) {
            console.error("Received an invalid block.");
            return;
        }

        if (!this.blockchain.isValidNextBlock(block, this.blockchain.latestBlock)) {
            console.error("Invalid block received.");
            return;
        }

        if (block.index > this.blockchain.latestBlock.index) {
            if (block.index === this.blockchain.latestBlock.index + 1) {
                this.blockchain.addBlock(block);
            } else {
                this.requestMissingBlocks(this.blockchain.latestBlock.index + 1, block.index - 1);
            }
        } else if (block.index === this.blockchain.latestBlock.index && block.hash !== this.blockchain.latestBlock.hash) {
            if (block.timestamp < this.blockchain.latestBlock.timestamp) {
                this.blockchain.chain.pop();
                this.blockchain.addBlock(block);
            } else if (block.timestamp === this.blockchain.latestBlock.timestamp) {
                if (block.hash < this.blockchain.latestBlock.hash) {
                    this.blockchain.chain.pop();
                    this.blockchain.addBlock(block);
                }
            }
        }
    }

    requestMissingBlocks(startIndex, endIndex) {
        console.warn(`Solicitando blocos de ${startIndex} a ${endIndex}...`);
    }
}

export default P2PNetwork;