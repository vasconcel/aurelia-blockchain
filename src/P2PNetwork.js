import Blockchain from './Blockchain.js';

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
          this.nodes.forEach(node => {
            node.onTransactionReceived(transaction);
        });
    }

    broadcastBlock(block) {        
        this.nodes.forEach(node => {
            node.onBlockReceived(block);    
        });
    }


    onTransactionReceived(transaction) {
        if (this.blockchain.isValidTransaction(transaction)) {
            this.transactionPool.push(transaction);

            if(this.transactionPool.length >= 2){
                this.mineBlockWithTransactions();
            }
        }
    }

     mineBlockWithTransactions() {
        try {
            const newBlock = this.blockchain.mine(this.transactionPool);
            console.log('Bloco minerado com sucesso:', newBlock);
            this.broadcastBlock(newBlock);
            this.transactionPool = [];
        } catch (error) {
            console.error('Erro ao minerar o bloco:', error);
        }
    }


    onBlockReceived(block) {
        if (!this.blockchain.isValidBlock(block, this.blockchain.latestBlock)) {
            console.error("Bloco inválido recebido.");
            return;
        }

        if (block.index > this.blockchain.latestBlock.index) {
            this.blockchain.chain = [ ...this.blockchain.chain, block];
            console.warn('Blockchain atualizada devido a um novo bloco recebido.');
        }
    }
}


export default P2PNetwork;