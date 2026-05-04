# 🎐 Aurelia Network v2.0

**A Bioluminescent Blockchain Ecosystem for Empirical Software Engineering Research**

---

## Overview

Aurelia Network is a full-stack, Dockerized blockchain implementation designed for **empirical software engineering research**. Originally a command-line educational tool, the system has evolved into a **modern web dashboard** featuring the "Moon Jellyfish" (Aurelia aurita) bioluminescent aesthetic—translucent, fluid, and visually immersive.

The platform enables researchers to observe real-time blockchain consensus, transaction propagation, and mining dynamics through an elegant interface backed by a robust Node.js backend.

---

## Key Research Features

### 📊 Consensus Mechanism
- **Heaviest Chain Rule**: Chain selection based on cumulative difficulty, not just block count
- **Proof-of-Work**: Configurable mining difficulty (1-5) for controlled experimentation

### 🔐 Security
- **Replay Protection**: Cryptographic nonces ensure transaction uniqueness
- **Digital Signatures**: Every transaction signed by the sender's wallet using `ethers.js`
- **Chain Integrity**: SHA-256 hash validation with Merkle tree verification

### 📡 Observability
- **Real-time TPS**: Live transactions per second tracking
- **Mining Duration**: Block-by-block mining time metrics
- **Propagation Delay**: Network broadcast latency measurement
- **CSV Export**: `metrics.csv` for academic data collection and analysis

### 💾 Persistence
- **JSON State Rehydration**: Full blockchain state restored on server restart
- **Transaction Ledger**: Complete history per address
- **Metrics Persistence**: Research data survives container restarts

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, Socket.io |
| Frontend | React 19, Tailwind CSS 4, Vite |
| Database | JSON File-based (no external DB required) |
| Deployment | Docker, Docker Compose |
| Wallet | ethers.js v6 |

---

## Quick Start

```bash
# Clone and start the full stack
docker compose up --build

# Access the research dashboard
open http://localhost:5173
```

**Ports:**
- Frontend (Research UI): `http://localhost:5173`
- Backend (API + Socket.io): `http://localhost:3000`

---

## Research Methodology

### Step-by-Step Guide

The dashboard features a **sequential research workflow**:

| Step | Component | Action |
|------|----------|--------|
| Step 1 | Transaction Form | Create a signed data transaction |
| Step 2 | Memory Pool | Observe network propagation |
| Step 3 | Mining Panel | Process block with configurable difficulty |
| Step 4 | Tentacles | Analyze the resulting chain structure |

### Data Collection

1. **Interactive Observation**: Watch real-time metrics as blocks are mined
2. **Export Metrics**: Click "Export Metrics" in the Mining panel
3. **CSV Analysis**: Review `metrics.csv` for:
   - Transaction count per block
   - Mining duration variability
   - Propagation delay patterns

```bash
# View exported metrics
cat data/metrics.csv
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/debug` | Express alive diagnostic |
| GET | `/blockchain` | Full Chain JSON |
| GET | `/blockchain/:index` | Specific block |
| GET | `/balance/:address` | Address balance & nonce |
| POST | `/transaction` | Create signed transaction |
| GET | `/transaction-pool` | Pending transactions |
| POST | `/mine` | Start mining (async) |
| POST | `/mine/stop` | Stop active mining |
| GET | `/metrics` | Research metrics |
| POST | `/metrics/export` | Export to CSV |
| GET | `/wallet` | Miner wallet info |

### WebSocket Events

- `block_mined` - New block discovered
- `transaction_added` - Transaction in mempool
- `mining_error` - Mining failure
- `connection_change` - Client connection status

---

## Project Structure

```
aurelia-blockchain/
├── src/                    # Backend source
│   ├── Blockchain.js       # Core consensus engine
│   ├── Transaction.js     # Signed transactions
│   ├── Server.js        # Express + Socket.io wrapper
│   └── Storage.js       # JSON persistence
├── frontend/              # React research UI
│   ├── src/
│   │   ├── components/ # Dashboard modules
│   │   └── App.jsx     # Main layout
│   └── public/assets/  # Background imagery
├── data/                # Persistent state (gitignored)
├── docker-compose.yml    # Full stack orchestration
└── README.md          # This file
```

---

## License

MIT License - See LICENSE file for details.

---

*Aurelia Network v2.0 - Where Empirical Research Meets Bioluminescent Design*