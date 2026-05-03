import fs from 'fs';

/**
 * Metrics collector for blockchain research analysis.
 * Research Purpose: Tracks TPS, mining duration, and propagation delay for empirical analysis.
 */
export default class Metrics {
    /**
     * Creates a new Metrics instance.
     */
    constructor() {
        this.transactionCount = 0;
        this.miningDurations = [];
        this.blockPropagationDelays = [];
        this.timestamps = [];
    }

    /**
     * Increments transaction count.
     * @param {number} count - Number to add (default 1).
     */
    incrementTransactionCount(count = 1) {
        this.transactionCount += count;
    }

    /**
     * Records mining duration for a block.
     * @param {number} durationMs - Duration in milliseconds.
     */
    recordMiningDuration(durationMs) {
        this.miningDurations.push(durationMs);
        this.timestamps.push(Date.now());
    }

    /**
     * Records block propagation delay.
     * @param {number} delayMs - Delay in milliseconds.
     */
    recordPropagationDelay(delayMs) {
        this.blockPropagationDelays.push(delayMs);
    }

    /**
     * Gets average mining duration.
     * @returns {number} Average duration in ms.
     */
    getAverageMiningDuration() {
        if (this.miningDurations.length === 0) return 0;
        return this.miningDurations.reduce((a, b) => a + b, 0) / this.miningDurations.length;
    }

    /**
     * Gets average propagation delay.
     * @returns {number} Average delay in ms.
     */
    getAveragePropagationDelay() {
        if (this.blockPropagationDelays.length === 0) return 0;
        return this.blockPropagationDelays.reduce((a, b) => a + b, 0) / this.blockPropagationDelays.length;
    }

    /**
     * Calculates Transactions Per Second.
     * Research Purpose: Throughput measurement.
     * @returns {number} TPS.
     */
    getTPS() {
        if (this.timestamps.length < 2) return 0;
        const timeSpan = this.timestamps[this.timestamps.length - 1] - this.timestamps[0];
        if (timeSpan === 0) return 0;
        return (this.transactionCount / timeSpan) * 1000;
    }

    /**
     * Gets complete metrics summary.
     * @returns {Object} Metrics object.
     */
    getStats() {
        return {
            transactionCount: this.transactionCount,
            blocksMined: this.miningDurations.length,
            averageMiningDuration: this.getAverageMiningDuration().toFixed(2),
            averagePropagationDelay: this.getAveragePropagationDelay().toFixed(2),
            tps: this.getTPS().toFixed(2),
            miningDurations: [...this.miningDurations],
            propagationDelays: [...this.blockPropagationDelays]
        };
    }

    /**
     * Exports metrics to CSV file.
     * @param {string} filename - Output filename.
     * @returns {boolean} Success status.
     */
    exportToCSV(filename = 'metrics.csv') {
        try {
            let csv = "Block,MiningDuration(ms),PropagationDelay(ms)\n";
            
            const maxLen = Math.max(this.miningDurations.length, this.blockPropagationDelays.length);
            
            for (let i = 0; i < maxLen; i++) {
                const miningDuration = this.miningDurations[i] || '';
                const propagationDelay = this.blockPropagationDelays[i] || '';
                csv += `${i + 1},${miningDuration},${propagationDelay}\n`;
            }

            csv += `\nSummary\n`;
            csv += `Transactions,${this.transactionCount}\n`;
            csv += `BlocksMined,${this.miningDurations.length}\n`;
            csv += `AvgMiningDuration,${this.getAverageMiningDuration().toFixed(2)}\n`;
            csv += `AvgPropagationDelay,${this.getAveragePropagationDelay().toFixed(2)}\n`;
            csv += `TPS,${this.getTPS().toFixed(2)}\n`;

            fs.writeFileSync(filename, csv);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Resets all metrics.
     */
    reset() {
        this.transactionCount = 0;
        this.miningDurations = [];
        this.blockPropagationDelays = [];
        this.timestamps = [];
    }
}

export { Metrics };