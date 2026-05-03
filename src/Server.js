import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import Blockchain from './Blockchain.js';
import { Transaction } from './Transaction.js';
import { Wallet } from './Wallet.js';
import { Storage, rehydrateBlock } from './Storage.js';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DEFAULT_DIFFICULTY = IS_PRODUCTION ? 1 : 4;

class ServerManager {
    constructor(port = 3000) {
        this.port = port;
        this.isProduction = IS_PRODUCTION;
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: IS_PRODUCTION ? false : "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.blockchain = new Blockchain();
        this.blockchain.difficulty = DEFAULT_DIFFICULTY;
        this.storage = new Storage();
        this.miningInProgress = false;
        
        this._setupMiddleware();
        this._setupRoutes();
        this._setupSocketIO();
        this._loadPersistedData();
    }

    _setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
    }

    _setupRoutes() {
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'ok', 
                timestamp: Date.now(),
                production: this.isProduction,
                difficulty: this.blockchain.difficulty
            });
        });

        this.app.get('/blockchain', (req, res) => {
            res.json({
                chain: this.blockchain.chain,
                length: this.blockchain.chain.length,
                difficulty: this.blockchain.difficulty,
                cumulativeDifficulty: this.blockchain.getCumulativeDifficulty()
            });
        });

        this.app.get('/blockchain/:index', (req, res) => {
            const index = parseInt(req.params.index);
            if (index < 0 || index >= this.blockchain.chain.length) {
                return res.status(404).json({ error: 'Block not found' });
            }
            res.json(this.blockchain.chain[index]);
        });

        this.app.get('/balance/:address', (req, res) => {
            const { address } = req.params;
            res.json({
                address,
                balance: this.blockchain.ledger.getBalance(address),
                nonce: this.blockchain.ledger.getNonce(address)
            });
        });

        this.app.post('/transaction', async (req, res) => {
            try {
                const { recipient, amount, fee, senderAddress } = req.body;
                
                if (!recipient || !amount) {
                    return res.status(400).json({ error: 'Missing required fields' });
                }

                const senderWallet = senderAddress 
                    ? this._getWalletByAddress(senderAddress)
                    : this.blockchain.miningRewardWallet;

                if (!senderWallet) {
                    return res.status(400).json({ error: 'Invalid sender' });
                }

                const sender = senderWallet.getAddress();
                const nonce = this.blockchain.ledger.getNonce(sender) + 1;
                const txFee = fee || 0;
                
                const tx = new Transaction(senderWallet, recipient, amount, txFee, nonce);
                await tx.signTransaction();
                
                this.blockchain.p2pNetwork.broadcastTransaction(tx);
                
                this.io.emit('transaction_added', {
                    transaction: tx,
                    poolSize: this.blockchain.p2pNetwork.transactionPool.length
                });
                
                res.json({ 
                    success: true, 
                    transaction: tx,
                    poolSize: this.blockchain.p2pNetwork.transactionPool.length
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/transaction-pool', (req, res) => {
            res.json({
                pool: this.blockchain.p2pNetwork.transactionPool,
                length: this.blockchain.p2pNetwork.transactionPool.length
            });
        });

        this.app.post('/mine', async (req, res) => {
            if (this.miningInProgress) {
                return res.status(409).json({ error: 'Mining already in progress' });
            }

            const difficulty = req.body.difficulty || this.blockchain.difficulty;
            
            res.json({ 
                success: true, 
                message: 'Mining started',
                difficulty
            });

            setImmediate(async () => {
                this.miningInProgress = true;
                try {
                    const block = await this.blockchain.mine({ 
                        isTestMode: false,
                        difficulty 
                    });
                    
                    if (block) {
                        this.io.emit('block_mined', {
                            block,
                            chainLength: this.blockchain.chain.length,
                            cumulativeDifficulty: this.blockchain.getCumulativeDifficulty()
                        });
                    }
                } catch (error) {
                    this.io.emit('mining_error', { error: error.message });
                } finally {
                    this.miningInProgress = false;
                }
            });
        });

        this.app.post('/mine/stop', (req, res) => {
            this.blockchain.mineMutex = null;
            this.miningInProgress = false;
            res.json({ success: true, message: 'Mining stopped' });
        });

        this.app.get('/metrics', (req, res) => {
            if (this.blockchain.metrics) {
                res.json(this.blockchain.metrics.getStats());
            } else {
                res.json({ error: 'No metrics available' });
            }
        });

        this.app.post('/metrics/export', (req, res) => {
            if (this.blockchain.metrics) {
                this.blockchain.metrics.exportToCSV();
                res.json({ success: true, message: 'Metrics exported to metrics.csv' });
            } else {
                res.status(400).json({ error: 'No metrics to export' });
            }
        });

        this.app.get('/peers', (req, res) => {
            res.json({
                nodes: this.blockchain.p2pNetwork.nodes.map(n => ({
                    blockchainId: n.blockchain.id,
                    chainLength: n.blockchain.chain.length
                })),
                count: this.blockchain.p2pNetwork.nodes.length
            });
        });

        this.app.get('/wallet', (req, res) => {
            res.json({
                address: this.blockchain.miningRewardWallet.getAddress(),
                balance: this.blockchain.ledger.getBalance(this.blockchain.miningRewardWallet.getAddress()),
                nonce: this.blockchain.ledger.getNonce(this.blockchain.miningRewardWallet.getAddress())
            });
        });
    }

    _setupSocketIO() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            socket.emit('chain_sync', {
                chainLength: this.blockchain.chain.length,
                cumulativeDifficulty: this.blockchain.getCumulativeDifficulty()
            });

            socket.on('subscribe_blocks', () => {
                socket.emit('block_mined', {
                    block: this.blockchain.latestBlock,
                    chainLength: this.blockchain.chain.length
                });
            });

            socket.on('subscribe_transactions', () => {
                socket.emit('transaction_added', {
                    poolSize: this.blockchain.p2pNetwork.transactionPool.length
                });
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }

    _loadPersistedData() {
        const savedData = this.storage.load();
        if (savedData) {
            try {
                const walletMap = {};
                walletMap[this.blockchain.miningRewardWallet.getAddress()] = this.blockchain.miningRewardWallet;
                
                const rehydratedChain = savedData.chain.map(blockData => 
                    rehydrateBlock(blockData, walletMap)
                );
                
                this.blockchain.chain = rehydratedChain;
                this.blockchain.ledger.setState(savedData.ledger);
                this.blockchain.latestBlock = rehydratedChain[rehydratedChain.length - 1];
                this.blockchain.cumulativeDifficulty = this.blockchain.calculateCumulativeDifficulty();
                console.log(`Loaded ${savedData.chain.length} blocks from storage`);
            } catch (error) {
                console.error('Error loading persisted data:', error.message);
            }
        }
    }

    _getWalletByAddress(address) {
        if (address === this.blockchain.miningRewardWallet.getAddress()) {
            return this.blockchain.miningRewardWallet;
        }
        return null;
    }

    _persistBlock(newBlock) {
        this.storage.save(this.blockchain);
    }

    start() {
        const originalAddBlock = this.blockchain.addBlock.bind(this.blockchain);
        this.blockchain.addBlock = (block) => {
            const result = originalAddBlock(block);
            if (result) {
                this._persistBlock(block);
            }
            return result;
        };

        this.server.listen(this.port, () => {
            console.log(`\n🚀 Aurelia Blockchain Server running on http://localhost:${this.port}`);
            console.log(`📡 Socket.io enabled`);
            console.log(`\nAPI Endpoints:`);
            console.log(`  GET  /health              - Health check`);
            console.log(`  GET  /blockchain          - Full chain`);
            console.log(`  GET  /blockchain/:index   - Block by index`);
            console.log(`  GET  /balance/:address    - Balance & nonce`);
            console.log(`  POST /transaction        - Create transaction`);
            console.log(`  GET  /transaction-pool    - Transaction pool`);
            console.log(`  POST /mine                - Start mining`);
            console.log(`  POST /mine/stop           - Stop mining`);
            console.log(`  GET  /metrics            - Research metrics`);
            console.log(`  POST /metrics/export     - Export metrics to CSV`);
            console.log(`  GET  /peers              - Connected peers`);
            console.log(`  GET  /wallet             - Miner wallet info`);
            console.log('');
        });
    }

    stop(callback) {
        this.storage.save(this.blockchain);
        this.server.close(callback);
    }
}

export default ServerManager;