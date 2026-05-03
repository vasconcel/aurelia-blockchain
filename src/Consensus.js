import * as crypto from 'crypto';
import { generateMerkleRoot } from './Block.js';
import { Transaction } from './Transaction.js';
import { Wallet } from './Wallet.js';
import { Ledger } from './Ledger.js';

/**
 * SHA-256 hashing utility.
 * @param {string} data - Data to hash.
 * @returns {string} Hex hash.
 */
function calculateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Pure function provider for block validation and consensus rules.
 * Research Purpose: Implements fork resolution (heaviest chain), transaction validation, and replay protection.
 */
export default class Consensus {
    /**
     * Validates a block against consensus rules.
     * Research Purpose: Ensures block integrity - hash, previous hash, merkle root, timestamp, difficulty.
     * @param {Block} newBlock - Block to validate.
     * @param {Block} previousBlock - Previous block in chain.
     * @param {Object} options - Validation options {difficulty, maxTimestampDiff}.
     * @returns {boolean} True if valid.
     */
    static validateBlock(newBlock, previousBlock, options = {}) {
        const difficulty = options.difficulty || 4;
        const maxTimestampDiff = options.maxTimestampDiff || 15 * 60 * 1000;
        const currentTimestamp = Date.now();

        if (!newBlock || !previousBlock) {
            return false;
        }

        if (previousBlock.index + 1 !== newBlock.index) {
            return false;
        }

        if (previousBlock.hash !== newBlock.previousHash) {
            return false;
        }

        if (Consensus.calculateBlockHash(newBlock) !== newBlock.hash) {
            return false;
        }

        if (!Consensus.validateHashDifficulty(newBlock.hash, difficulty)) {
            return false;
        }

        if (generateMerkleRoot(newBlock.transactions) !== newBlock.merkleRoot) {
            return false;
        }

        if (newBlock.timestamp > currentTimestamp + maxTimestampDiff || newBlock.timestamp < previousBlock.timestamp - maxTimestampDiff) {
            return false;
        }

        return true;
    }

    /**
     * Validates a transaction against consensus rules.
     * Research Purpose: Replay protection via nonce, signature verification, balance check.
     * @param {Transaction} transaction - Transaction to validate.
     * @param {Ledger} ledger - Current ledger state.
     * @param {Object} options - Validation options {simulatedLedger}.
     * @returns {boolean} True if valid.
     */
    static validateTransaction(transaction, ledger, options = {}) {
        if (!transaction || typeof transaction !== 'object') {
            return false;
        }

        if (!transaction.senderWallet || typeof transaction.senderWallet.getAddress !== 'function') {
            return false;
        }

        if (transaction.senderWallet instanceof Wallet) {
            if (!transaction.verifySignature()) {
                return false;
            }
        }

        const sender = transaction.senderWallet.getAddress();
        
        if (transaction.fee < 0) {
            return false;
        }

        let workingLedger = ledger;
        
        if (options.simulatedLedger) {
            workingLedger = options.simulatedLedger;
        }
        
        const senderBalance = workingLedger.getBalance(sender);
        const currentNonce = workingLedger.getNonce(sender);

        if (senderBalance < transaction.amount + transaction.fee) {
            return false;
        }

        if (transaction.nonce !== currentNonce + 1) {
            return false;
        }

        if (options.simulatedLedger) {
            options.simulatedLedger.debit(sender, transaction.amount + transaction.fee);
            options.simulatedLedger.credit(transaction.recipient, transaction.amount);
            options.simulatedLedger.setNonce(sender, transaction.nonce);
        }

        return true;
    }

    /**
     * Validates all transactions in a block.
     * Research Purpose: Ensures all transactions are valid before block acceptance.
     * @param {Block} newBlock - Block containing transactions.
     * @param {Block} previousBlock - Previous block.
     * @param {Ledger} ledger - Current ledger.
     * @param {Object} options - Validation options.
     * @returns {boolean} True if all valid.
     */
    static validateBlockTransactions(newBlock, previousBlock, ledger, options = {}) {
        if (!newBlock || !newBlock.transactions) {
            return false;
        }

        for (const tx of newBlock.transactions) {
            if (!(tx instanceof Transaction)) {
                return false;
            }
            if (!Consensus.validateTransaction(tx, ledger, options)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Validates entire blockchain integrity.
     * @param {Array} chain - Array of Block objects.
     * @param {Ledger} ledger - Current ledger.
     * @param {Object} options - Validation options.
     * @returns {boolean} True if chain is valid.
     */
    static validateChain(chain, ledger, options = {}) {
        if (!chain || chain.length === 0) {
            return false;
        }

        for (let i = 1; i < chain.length; i++) {
            try {
                const currentBlock = chain[i];
                const previousBlock = chain[i - 1];

                if (!Consensus.validateBlock(currentBlock, previousBlock, options)) {
                    return false;
                }
            } catch (error) {
                return false;
            }
        }
        return true;
    }

    /**
     * Validates Merkle root matches transactions.
     * @param {Block} block - Block to validate.
     * @returns {boolean} True if valid.
     */
    static validateMerkleRoot(block) {
        if (!block || !block.transactions) {
            return false;
        }

        const calculatedMerkleRoot = generateMerkleRoot(block.transactions);
        return calculatedMerkleRoot === block.merkleRoot;
    }

    /**
     * Validates hash meets difficulty requirement.
     * Research Purpose: Proof-of-Work verification.
     * @param {string} hash - Hash to validate.
     * @param {number} difficulty - Required difficulty level.
     * @returns {boolean} True if valid.
     */
    static validateHashDifficulty(hash, difficulty) {
        if (!hash) {
            return false;
        }
        return hash.startsWith('0'.repeat(difficulty));
    }

    /**
     * Calculates hash for a block.
     * @param {Block} block - Block to hash.
     * @returns {string} Block hash.
     */
    static calculateBlockHash(block) {
        const { index, previousHash, timestamp, merkleRoot, nonce } = block;
        const transactions = block.transactions.map(tx => {
            const senderAddress = tx.senderWallet ? tx.senderWallet.getAddress() : 'Coinbase';
            return JSON.stringify({
                sender: senderAddress,
                recipient: tx.recipient,
                amount: tx.amount,
                fee: tx.fee,
                timestamp: tx.timestamp,
                nonce: tx.nonce,
                signature: tx.signature
            });
        });

        transactions.sort((a, b) => {
            const hashA = calculateHash(JSON.stringify(a));
            const hashB = calculateHash(JSON.stringify(b));
            return hashA.localeCompare(hashB);
        });

        const blockString = `${index}${previousHash}${timestamp}${merkleRoot}${nonce}${transactions.join('')}`;
        return calculateHash(blockString);
    }
}

export { Consensus };