// ServerManager - Last synced: 2025-05-04
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
        this.httpServer = createServer(this.app);
        this.io = new Server(this.httpServer, {
            cors: {
                origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
                methods: ["GET", "POST"],
                credentials: true
            }
        });
        
        this.app.use(cors({
            origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
            methods: ["GET", "POST"],
            credentials: true
        }));
        this.app.use(express.json());
        
        this.app.use((req, res, next) => {
            if (this.blockchain) {
                req.blockchain = this.blockchain;
            }
            next();
        });
        
        this._registerAllRoutes();
        
        this.storage = new Storage();
    }

    _registerAllRoutes() {
        this.app.get('/debug', (req, res) => res.json({ message: 'Express is alive', timestamp: Date.now() }));
        
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'ok', 
                timestamp: Date.now(),
                production: this.isProduction,
                difficulty: this.blockchain?.difficulty || DEFAULT_DIFFICULTY
            });
        });

        this.app.get('/status', (req, res) => {
            res.json({ 
                status: 'online', 
                chainLength: this.blockchain?.chain?.length || 0,
                peers: this.blockchain?.p2pNetwork?.nodes?.length || 0
            });
        });

        this.app.get('/blockchain', (req, res) => {
            res.json({
                chain: this.blockchain?.chain || [],
                length: this.blockchain?.chain?.length || 0,
                difficulty: this.blockchain?.difficulty || DEFAULT_DIFFICULTY,
                cumulativeDifficulty: this.blockchain?.getCumulativeDifficulty?.() || 0
            });
        });

        this.app.get('/blockchain/:index', (req, res) => {
            const index = parseInt(req.params.index);
            const chain = this.blockchain?.chain || [];
            if (index < 0 || index >= chain.length) {
                return res.status(404).json({ error: 'Block not found' });
            }
            res.json(chain[index]);
        });

        this.app.get('/balance/:address', (req, res) => {
            const { address } = req.params;
            res.json({
                address,
                balance: this.blockchain?.ledger?.getBalance?.(address) || 0,
                nonce: this.blockchain?.ledger?.getNonce?.(address) || 0
            });
        });

        this.app.post('/transaction', async (req, res) => {
            try {
                const { recipient, amount, fee, senderAddress } = req.body;
                console.log('API Received transaction request:', { recipient, amount, fee, senderAddress });
                
                if (!recipient || !amount) {
                    return res.status(400).json({ success: false, error: 'Missing required fields: recipient and amount are required' });
                }

                const senderWallet = senderAddress 
                    ? this._getWalletByAddress(senderAddress)
                    : this.blockchain?.miningRewardWallet;

                if (!senderWallet) {
                    return res.status(400).json({ success: false, error: 'Invalid sender: miner wallet not found' });
                }

                const sender = senderWallet.getAddress();
                const senderBalance = this.blockchain?.ledger?.getBalance?.(sender) || 0;
                console.log('Sender balance check:', { sender, balance: senderBalance });
                
                const currentNonce = this.blockchain?.ledger?.getNonce?.(sender) || 0;
                const nonce = currentNonce + 1;
                const txFee = fee || 0;
                
                console.log('Creating transaction with:', { sender, recipient, amount, fee: txFee, nonce, balance: senderBalance });
                
                if (senderBalance < amount + txFee) {
                    return res.status(400).json({ 
                        success: false, 
                        error: `Insufficient balance: have ${senderBalance.toFixed(2)}, need ${(amount + txFee).toFixed(2)}` 
                    });
                }
                
                const tx = new Transaction(senderWallet, recipient, amount, txFee, nonce);
                await tx.signTransaction();
                console.log('Transaction signed successfully, signature:', tx.signature?.substring(0, 20) + '...');
                
                const added = this.blockchain?.p2pNetwork?.broadcastTransaction?.(tx);
                
                const poolSize = this.blockchain?.p2pNetwork?.transactionPool?.length || 0;
                console.log('Transaction broadcasted, pool size:', poolSize, 'added:', added);
                
                if (!added) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Transaction validation failed (Check balance/nonce). Balance: ' + senderBalance.toFixed(2) 
                    });
                }
                
                this.io?.emit('transaction_added', {
                    transaction: tx,
                    poolSize: poolSize
                });
                
                res.json({ 
                    success: true, 
                    transaction: tx,
                    poolSize: poolSize
                });
            } catch (error) {
                console.error('Transaction error:', error.message);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        this.app.get('/transaction-pool', (req, res) => {
            res.json({
                pool: this.blockchain?.p2pNetwork?.transactionPool || [],
                length: this.blockchain?.p2pNetwork?.transactionPool?.length || 0
            });
        });

        this.app.post('/mine', async (req, res) => {
            if (this.miningInProgress) {
                return res.status(409).json({ error: 'Mining already in progress' });
            }

            const difficulty = req.body.difficulty || this.blockchain?.difficulty || DEFAULT_DIFFICULTY;
            console.log(`API: Mining requested at difficulty ${difficulty}`);
            
            res.json({ 
                success: true, 
                message: 'Mining started',
                difficulty
            });

            setImmediate(async () => {
                this.miningInProgress = true;
                try {
                    const block = await this.blockchain?.mine({ 
                        isTestMode: false,
                        difficulty 
                    });
                    
                    console.log('API: Block mined successfully!');

                    if (block) {
                        this.io?.emit('block_mined', {
                            block,
                            chainLength: this.blockchain?.chain?.length || 0,
                            cumulativeDifficulty: this.blockchain?.getCumulativeDifficulty?.() || 0
                        });
                    }
                } catch (error) {
                    this.io?.emit('mining_error', { error: error.message });
                } finally {
                    this.miningInProgress = false;
                }
            });
        });

        this.app.post('/mine/stop', (req, res) => {
            if (this.blockchain) {
                this.blockchain.mineMutex = null;
            }
            this.miningInProgress = false;
            res.json({ success: true, message: 'Mining stopped' });
        });

        this.app.get('/metrics', (req, res) => {
            if (this.blockchain?.metrics) {
                res.json(this.blockchain.metrics.getStats());
            } else {
                res.json({ error: 'No metrics available' });
            }
        });

        this.app.post('/metrics/export', (req, res) => {
            if (this.blockchain?.metrics) {
                this.blockchain.metrics.exportToCSV();
                res.json({ success: true, message: 'Metrics exported to metrics.csv' });
            } else {
                res.status(400).json({ error: 'No metrics to export' });
            }
        });

        this.app.get('/peers', (req, res) => {
            res.json({
                nodes: this.blockchain?.p2pNetwork?.nodes?.map(n => ({
                    blockchainId: n.blockchain?.id,
                    chainLength: n.blockchain?.chain?.length
                })) || [],
                count: this.blockchain?.p2pNetwork?.nodes?.length || 0
            });
        });

        this.app.get('/wallet', (req, res) => {
            res.json({
                address: this.blockchain?.miningRewardWallet?.getAddress?.() || '',
                balance: this.blockchain?.ledger?.getBalance?.(this.blockchain?.miningRewardWallet?.getAddress?.()) || 0,
                nonce: this.blockchain?.ledger?.getNonce?.(this.blockchain?.miningRewardWallet?.getAddress?.()) || 0
            });
        });

        console.log('=== ROUTES REGISTERED ===');
        console.log('GET  /debug');
        console.log('GET  /health');
        console.log('GET  /status');
        console.log('GET  /blockchain');
        console.log('GET  /blockchain/:index');
        console.log('GET  /balance/:address');
        console.log('POST /transaction');
        console.log('GET  /transaction-pool');
        console.log('POST /mine');
        console.log('POST /mine/stop');
        console.log('GET  /metrics');
        console.log('POST /metrics/export');
        console.log('GET  /peers');
        console.log('GET  /wallet');
        console.log('========================');
    }

    _getWalletByAddress(address) {
        if (address === this.blockchain?.miningRewardWallet?.getAddress?.()) {
            return this.blockchain.miningRewardWallet;
        }
        return null;
    }

    _persistBlock(newBlock) {
        this.storage?.save(this.blockchain);
    }

    start(blockchain) {
        this.blockchain = blockchain;
        
        const originalAddBlock = this.blockchain.addBlock.bind(this.blockchain);
        this.blockchain.addBlock = (block) => {
            const result = originalAddBlock(block);
            if (result) {
                this._persistBlock(block);
            }
            return result;
        };

        this.storage?.load?.();
        const savedData = this.storage?.load?.();
        if (savedData) {
            try {
                const walletMap = {};
                if (this.blockchain?.miningRewardWallet) {
                    walletMap[this.blockchain.miningRewardWallet.getAddress()] = this.blockchain.miningRewardWallet;
                }
                
                const rehydratedChain = savedData.chain?.map(blockData => 
                    rehydrateBlock(blockData, walletMap)
                ) || [];
                
                this.blockchain.chain = rehydratedChain;
                this.blockchain.ledger?.setState?.(savedData.ledger);
                this.blockchain.latestBlock = rehydratedChain[rehydratedChain.length - 1];
                this.blockchain.syncLedger(savedData.ledger);
                console.log(`Loaded ${rehydratedChain.length} blocks from storage`);
            } catch (error) {
                console.error('Error loading persisted data:', error.message);
            }
        }

        this.httpServer.listen(this.port, () => {
            console.log(`\n🚀 Aurelia Blockchain Server running on http://localhost:${this.port}`);
            console.log(`📡 Socket.io enabled`);
        });
    }

    stop(callback) {
        this.storage?.save?.(this.blockchain);
        this.httpServer.close(callback);
    }
}

export default ServerManager;