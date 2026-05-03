import { generateMerkleRoot } from './Block.js';

/**
 * P2P Network simulation for blockchain communication.
 * Research Purpose: Simulates block/transaction broadcast, fork resolution.
 */
class P2PNetwork {
    /**
     * Creates a new P2PNetwork instance.
     * @param {Blockchain} blockchain - Blockchain instance.
     * @param {Array} nodes - Array of peer nodes.
     */
    constructor(blockchain, nodes = []) {
        this.blockchain = blockchain;
        this.nodes = nodes;
        this.transactionPool = [];
    }

    /**
     * Connects to a peer node.
     * @param {Object} peer - Peer blockchain instance.
     * @param {boolean} syncState - Whether to sync state.
     */
    connectToPeer(peer, syncState = false) {
        this.nodes.push(peer);
        
        if (syncState && this.blockchain.chain.length > 1 && peer.blockchain.chain.length <= 1) {
            peer.blockchain.ledger.setState(this.blockchain.ledger.getState());
        }
    }

    /**
     * Broadcasts a transaction to all nodes.
     * @param {Transaction} transaction - Transaction to broadcast.
     */
    async broadcastTransaction(transaction) {
        for (const node of this.nodes) {
            await node.onTransactionReceived(transaction, node);
        }
        this.onTransactionReceived(transaction, this);
    }

    /**
     * Broadcasts a block to all nodes with simulated propagation delay.
     * Research Purpose: Measures propagation delay for fork analysis.
     * @param {Block} block - Block to broadcast.
     */
    broadcastBlock(block) {
        const miningTimestamp = block.timestamp;
        
        this.nodes.forEach((node, index) => {
            const delay = 100 + Math.random() * 400;
            
            setTimeout(() => {
                if (this.blockchain.metrics) {
                    const propagationDelay = Date.now() - miningTimestamp;
                    this.blockchain.metrics.recordPropagationDelay(propagationDelay);
                }
                
                node.onBlockReceived(block);
            }, delay);
        });
    }

    /**
     * Handles incoming transaction, validates and adds to pool.
     * @param {Transaction} transaction - Transaction received.
     * @param {Object} node - Node receiving the transaction.
     */
    async onTransactionReceived(transaction, node) {
        if (node.blockchain.isValidTransaction(transaction)) {
            node.transactionPool.push(transaction);
        }
    }

    /**
     * Handles incoming block, validates and adds to chain.
     * Research Purpose: Fork detection and resolution.
     * @param {Block} block - Block received.
     */
    async onBlockReceived(block) {
        if (!block || block.hash === undefined) {
            return;
        }

        const blockExists = this.blockchain.chain.some(existingBlock => existingBlock.hash === block.hash);
        if (blockExists) {
            return;
        }

        if (block.index === this.blockchain.latestBlock.index + 1) {
            if (this.blockchain.isValidNextBlock(block, this.blockchain.latestBlock)) {
                this.blockchain.addBlock(block);
                this.transactionPool = this.transactionPool.filter(tx => {
                    return !block.transactions.some(blockTx => blockTx.signature === tx.signature);
                });
                this.blockchain.latestBlock = block;
            }
        } else if (block.index > this.blockchain.latestBlock.index + 1) {
            this.requestMissingBlocks(this.blockchain.latestBlock.index + 1, block.index - 1);
        } else if (block.index <= this.blockchain.latestBlock.index) {
            await this.resolveFork();
        }
    }

    /**
     * Resolves forks using heaviest chain rule.
     * Research Purpose: Fork resolution algorithm.
     * @param {Blockchain} forkedBlockchain - Potential forked blockchain.
     */
    async resolveFork(forkedBlockchain) {
        for (const node of this.nodes) {
            const theirLatestBlock = await node.requestBlockchain();
            if (!theirLatestBlock) continue;
            
            const theirCumulativeDifficulty = theirLatestBlock.getCumulativeDifficulty 
                ? theirLatestBlock.getCumulativeDifficulty() 
                : this.blockchain.calculateCumulativeDifficulty();
            
            const myCumulativeDifficulty = this.blockchain.getCumulativeDifficulty();
            
            if (theirLatestBlock.index > this.blockchain.latestBlock.index) {
                await this.requestMissingBlocks(this.blockchain.latestBlock.index + 1, theirLatestBlock.index, forkedBlockchain);
                if(this.blockchain.isValidChain()){
                    this.blockchain.latestBlock = theirLatestBlock;
                    return;
                }
                return;
            } else if (theirLatestBlock.index === this.blockchain.latestBlock.index) {
                
                if (theirCumulativeDifficulty > myCumulativeDifficulty) {
                    this.blockchain.addBlock(theirLatestBlock);
                    this.blockchain.latestBlock = theirLatestBlock;
                    return;
                } else if (theirCumulativeDifficulty === myCumulativeDifficulty) {
                    if (theirLatestBlock.timestamp < this.blockchain.latestBlock.timestamp) {
                        this.blockchain.addBlock(theirLatestBlock);
                        this.blockchain.latestBlock = theirLatestBlock;
                        return;
                    }
                }
            }
        }
    }

    /**
     * Requests missing blocks from peers.
     * @param {number} startIndex - Start block index.
     * @param {number} endIndex - End block index.
     * @param {Blockchain} forkedBlockchain - Forked blockchain.
     */
    async requestMissingBlocks(startIndex, endIndex, forkedBlockchain) {
        if (forkedBlockchain) {
            for (let i = startIndex; i <= endIndex; i++) {
                const missingBlock = forkedBlockchain.chain.find(block => block.index === i);
                if (missingBlock) {
                    this.blockchain.addBlock(missingBlock);
                }
            }
        }
    }

    /**
     * Requests blockchain from peers.
     * @returns {null} Always null (not implemented).
     */
    async requestBlockchain() {
        return null;
    }
}

export default P2PNetwork;