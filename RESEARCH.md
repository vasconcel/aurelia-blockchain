# Aurelia Blockchain - Research Documentation

## Methodology

Aurelia is an educational blockchain implementation designed to simulate real-world blockchain behavior while providing research metrics for empirical analysis. It models the core mechanics of a Proof-of-Work consensus system without requiring significant computational resources.

### Core Simulation Components

1. **Block Structure**: Each block contains:
   - Index, Timestamp, Transactions
   - Nonce (proof-of-work counter)
   - Merkle Root (transaction hash tree)
   - Hash (SHA-256)
   - Difficulty level used when mined

2. **Transaction Lifecycle**:
   - Creation → Signing → Broadcast → Mempool → Mining → Block Inclusion → Confirmation

3. **Mining Process**: 
   - Proof-of-Work with adjustable difficulty (1-5)
   - Nonce incrementation until hash meets difficulty criteria
   - Block reward distribution to miner

## Metrics Explained

### Transactions Per Second (TPS)
**Definition**: The number of transactions processed per second.

**Calculation**: `Total Transactions / Total Time Span (ms) × 1000`

**Research Significance**: Measures throughput capacity. Real blockchains like Bitcoin handle ~7 TPS, Ethereum ~15-30 TPS. This metric helps understand how network latency and block size affect throughput.

### Mining Duration
**Definition**: Time spent in the proof-of-work loop (from nonce=0 until valid hash found).

**Measurement**: `End Timestamp - Start Timestamp`

**Research Significance**: 
- Lower difficulty = faster mining
- CPU performance directly impacts this metric
- Used to calculate energy consumption estimates

### Block Propagation Delay
**Definition**: Time between a block being mined and its receipt by other network nodes.

**Calculation**: `Receipt Timestamp - Mining Timestamp`

**Research Significance**: Critical for fork analysis. Longer propagation increases fork probability. Measured in milliseconds.

## Security Model

### Transaction Nonce (Replay Protection)
Each transaction includes a `nonce` field that:
- Must be sequential (0, 1, 2, ...)
- Starts at 1 for first transaction from an address
- Prevents transaction replay attacks

**Validation**:
```
transaction.nonce === ledger.getNonce(sender) + 1
```

### Heaviest Chain Rule (Cumulative Difficulty)
Fork resolution uses cumulative difficulty instead of simple chain length:

```
Cumulative Difficulty = Σ(16^block_difficulty)
```

For difficulty=4: Each block contributes 65,536 (16^4) to total.

**Tie-breaker**: When cumulative difficulties are equal, the chain with the earliest timestamp wins.

### Balance Tracking
- **Initial Supply**: 1,000,000 coins to zero address + 1,000 to miner
- **Mining Rewards**: Dynamic based on block count (halving every 210,000 blocks)
- **Transaction Fees**: Deducted from sender, added to block reward

## Network Simulation

### Latency Model
Broadcasts include random delays (100-500ms) to simulate real-world network conditions. This enables observation of:
- Fork formation
- Block propagation effects
- Mempool synchronization

### Peer-to-Peer Events
- `block_mined`: Emitted when new block added
- `transaction_added`: Emitted when transaction enters mempool
- Real-time updates via Socket.io

## Research Applications

1. **Throughput Analysis**: How TPS scales with difficulty and transaction size
2. **Network Stability**: Fork frequency vs. propagation delay
3. **Security Validation**: Nonce-based replay protection effectiveness
4. **Performance Profiling**: Mining duration distributions
5. **Economic Modeling**: Fee market dynamics

## Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| Difficulty | 1-5 | Hash target (1=easiest) |
| Block Reward | 50 (initial) | Coins per mined block |
| Halving Interval | 210,000 blocks | Reward reduction schedule |
| Max Timestamp Diff | 15 minutes | Block timestamp tolerance |

## Technology Stack

- **Backend**: Node.js + Express + Socket.io
- **Frontend**: React + Vite + Tailwind CSS
- **Storage**: JSON file-based persistence
- **Cryptography**: Native Node.js crypto (SHA-256)
- **Signing**: ethers.js for wallet signatures
