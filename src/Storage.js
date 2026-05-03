import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Storage handler for blockchain persistence.
 * Research Purpose: Persists chain state and ledger for research continuity.
 */
export default class Storage {
    /**
     * Creates a new Storage instance.
     * @param {string} dataDir - Directory for data files.
     */
    constructor(dataDir = './data') {
        this.dataDir = dataDir;
        this.blockchainFile = path.join(this.dataDir, 'blockchain.json');
        this._ensureDataDir();
    }

    /**
     * Ensures data directory exists.
     */
    _ensureDataDir() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    /**
     * Saves blockchain to JSON file.
     * @param {Blockchain} blockchain - Blockchain to save.
     * @returns {boolean} Success status.
     */
    save(blockchain) {
        try {
            const data = {
                chain: blockchain.chain.map(block => ({
                    index: block.index,
                    previousHash: block.previousHash,
                    timestamp: block.timestamp,
                    transactions: block.transactions.map(tx => ({
                        senderWallet: tx.senderWallet,
                        recipient: tx.recipient,
                        amount: tx.amount,
                        fee: tx.fee,
                        nonce: tx.nonce,
                        timestamp: tx.timestamp,
                        signature: tx.signature
                    })),
                    nonce: block.nonce,
                    merkleRoot: block.merkleRoot,
                    difficulty: block.difficulty,
                    hash: block.hash
                })),
                ledger: {
                    balances: blockchain.ledger.balances,
                    nonces: blockchain.ledger.nonces,
                    transactionIndex: blockchain.ledger.transactionIndex
                },
                metadata: {
                    savedAt: Date.now(),
                    blockCount: blockchain.chain.length
                }
            };

            fs.writeFileSync(this.blockchainFile, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Loads blockchain from JSON file.
     * @returns {Object|null} Loaded data or null.
     */
    load() {
        try {
            if (!fs.existsSync(this.blockchainFile)) {
                return null;
            }

            const rawData = fs.readFileSync(this.blockchainFile, 'utf8');
            const data = JSON.parse(rawData);
            return data;
        } catch (error) {
            return null;
        }
    }

    /**
     * Checks if blockchain file exists.
     * @returns {boolean} True if exists.
     */
    exists() {
        return fs.existsSync(this.blockchainFile);
    }

    /**
     * Gets file metadata.
     * @returns {Object|null} Metadata or null.
     */
    getMetadata() {
        if (!this.exists()) return null;
        try {
            const rawData = fs.readFileSync(this.blockchainFile, 'utf8');
            const data = JSON.parse(rawData);
            return data.metadata;
        } catch {
            return null;
        }
    }
}

import { Block, generateMerkleRoot } from './Block.js';
import { Transaction } from './Transaction.js';
import { Wallet } from './Wallet.js';

/**
 * Rehydrates a plain JSON block object into a proper Block instance.
 * CRITICAL: Without this, consensus validation fails because methods like calculateBlockHash() are missing.
 * @param {Object} blockData - Raw JSON block data.
 * @param {Object} walletMap - Map of address to Wallet instances.
 * @returns {Block} Rehydrated Block instance.
 */
export function rehydrateBlock(blockData, walletMap = {}) {
    const transactions = blockData.transactions.map(txData => {
        const senderWallet = txData.senderWallet || txData.sender;
        let wallet;
        
        if (typeof senderWallet === 'string') {
            wallet = walletMap[senderWallet];
            if (!wallet) {
                wallet = new Wallet();
                wallet.address = senderWallet;
                walletMap[senderWallet] = wallet;
            }
        } else if (senderWallet && senderWallet.getAddress) {
            wallet = senderWallet;
        } else {
            wallet = new Wallet();
            wallet.address = senderWallet?.address || 'Coinbase';
        }

        return rehydrateTransaction({
            senderWallet: wallet,
            recipient: txData.recipient,
            amount: txData.amount,
            fee: txData.fee,
            nonce: txData.nonce,
            timestamp: txData.timestamp,
            signature: txData.signature
        });
    });

    const merkleRoot = generateMerkleRoot(transactions);

    return new Block(
        blockData.index,
        blockData.previousHash,
        blockData.timestamp,
        transactions,
        blockData.nonce,
        merkleRoot,
        blockData.difficulty
    );
}

/**
 * Rehydrates a plain JSON transaction object into a proper Transaction instance.
 * @param {Object} txData - Raw JSON transaction data.
 * @returns {Transaction} Rehydrated Transaction instance.
 */
export function rehydrateTransaction(txData) {
    const tx = Object.create(Transaction.prototype);
    tx.senderWallet = txData.senderWallet;
    tx.recipient = txData.recipient;
    tx.amount = txData.amount;
    tx.fee = txData.fee;
    tx.nonce = txData.nonce;
    tx.timestamp = txData.timestamp;
    tx.signature = txData.signature;
    return tx;
}

export { Storage };