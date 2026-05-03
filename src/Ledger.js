import { Transaction } from './Transaction.js';

/**
 * Ledger managing address balances, nonces, and transaction history.
 * Research Purpose: Tracks state changes from transactions; essential for replay protection.
 */
export default class Ledger {
    /**
     * Creates a new Ledger instance.
     * @param {Object} initialBalances - Initial address to balance map.
     */
    constructor(initialBalances = {}) {
        this.balances = { ...initialBalances };
        this.nonces = {};
        this.transactionIndex = {};
    }

    /**
     * Initializes or updates balances.
     * @param {Object} balances - Address to balance map.
     */
    initialize(balances) {
        for (const address in balances) {
            this.balances[address] = balances[address];
        }
    }

    /**
     * Gets balance for an address.
     * @param {string} address - Wallet address.
     * @returns {number} Current balance.
     */
    getBalance(address) {
        return this.balances[address] || 0;
    }

    /**
     * Gets nonce for an address.
     * Research Purpose: Nonce-based replay protection.
     * @param {string} address - Wallet address.
     * @returns {number} Current nonce.
     */
    getNonce(address) {
        return this.nonces[address] || 0;
    }

    /**
     * Gets transaction history for an address.
     * @param {string} address - Wallet address.
     * @returns {Array} Array of transactions.
     */
    getHistory(address) {
        return this.transactionIndex[address] || [];
    }

    /**
     * Updates ledger balances and nonces from processed transactions.
     * @param {Array} transactions - Array of Transaction objects.
     * @param {string|null} miningRewardWalletAddress - Miner reward address (coinbase).
     */
    update(transactions, miningRewardWalletAddress = null) {
        for (const tx of transactions) {
            if (!(tx instanceof Transaction)) {
                continue;
            }

            const sender = tx.senderWallet.getAddress();
            const recipient = tx.recipient;

            if (!this.balances[sender]) this.balances[sender] = 0;
            if (!this.balances[recipient]) this.balances[recipient] = 0;

            const isCoinbase = sender === miningRewardWalletAddress;
            
            if (isCoinbase) {
                this.balances[recipient] += (tx.amount + tx.fee);
            } else {
                this.balances[sender] -= (tx.amount + tx.fee);
                this.balances[recipient] += tx.amount;
            }

            this.nonces[sender] = tx.nonce;

            this._indexTransaction(sender, tx);
            if (recipient !== sender) {
                this._indexTransaction(recipient, tx);
            }
        }
    }

    /**
     * Credits amount to an address (for simulation).
     * @param {string} address - Wallet address.
     * @param {number} amount - Amount to credit.
     */
    credit(address, amount) {
        if (!this.balances[address]) this.balances[address] = 0;
        this.balances[address] += amount;
    }

    /**
     * Debits amount from an address (for simulation).
     * @param {string} address - Wallet address.
     * @param {number} amount - Amount to debit.
     */
    debit(address, amount) {
        if (!this.balances[address]) this.balances[address] = 0;
        this.balances[address] -= amount;
    }

    /**
     * Sets nonce for an address.
     * @param {string} address - Wallet address.
     * @param {number} nonce - Nonce value.
     */
    setNonce(address, nonce) {
        this.nonces[address] = nonce;
    }

    /**
     * Indexes a transaction for address history.
     * @param {string} address - Wallet address.
     * @param {Transaction} tx - Transaction to index.
     */
    _indexTransaction(address, tx) {
        if (!this.transactionIndex[address]) {
            this.transactionIndex[address] = [];
        }
        this.transactionIndex[address].push(tx);
    }

    /**
     * Gets current ledger state for serialization.
     * @returns {Object} State {balances, nonces}.
     */
    getState() {
        return {
            balances: { ...this.balances },
            nonces: { ...this.nonces }
        };
    }

    /**
     * Restores ledger state from serialization.
     * @param {Object} state - State {balances, nonces}.
     */
    setState(state) {
        if (state.balances) {
            this.balances = { ...state.balances };
        }
        if (state.nonces) {
            this.nonces = { ...state.nonces };
        }
    }
}

export { Ledger };