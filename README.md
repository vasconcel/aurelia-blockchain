# Aurelia Blockchain // Simulated Network

## Overview

This project is an educational and **simulated** implementation of a basic blockchain, named `Aurelia Network`. It was created as part of an activity within the **AWS Blockchain** & **Real Digital** scholarship program by Compass UOL. The primary objective is to demonstrate fundamental blockchain concepts in an accessible and practical manner, including block mining via a simplified Proof-of-Work (PoW) system, transaction management, conflict resolution (forks), and chain integrity verification.

## Features

*   **Genesis Block Creation:** The chain initializes with a predefined genesis block.
*   **Transaction Addition:** Allows adding new transactions to the memory pool (`transaction pool`) before the next block is mined.
*   **Block Mining:** Implements a simplified Proof-of-Work (`PoW`) algorithm to add new blocks to the chain. Mining difficulty is configurable.
*   **P2P Network Simulation:** Simulates a Peer-to-Peer network where nodes (instances of the `Blockchain` class) can connect, broadcast transactions and blocks, and resolve chain conflicts (forks). Communication is simulated via the `P2PNetwork` class, without using WebSockets.
*   **Fork Resolution:** Implements a basic fork resolution mechanism, prioritizing the longest chain. In case of a tie, the chain with the block having the oldest timestamp is preferred.
*   **Balance Control:** Maintains address balances (within the `balances` map in the `Blockchain` class), updating them after each mined block.
*   **Transaction Fees:** Includes transaction fees as an incentive for miners.
*   **Miner Reward:** The miner who solves the PoW puzzle receives a token reward (fixed reward + transaction fees). The fixed reward undergoes *halving* every `halvingInterval` blocks.
*   **Chain Validation:** Verifies the blockchain's integrity, ensuring no block has been tampered with. Includes checks for hashes (previous block, calculated current hash, difficulty hash), `Merkle Root`, and transaction signatures.
*   **Address History:** Allows querying the transaction history for a specific address (stored in the `transactionIndex` map within the `Blockchain` class).
*   **Merkle Tree:** Utilizes a Merkle Tree to compute the `merkleRoot`, improving efficiency in validating blocks with numerous transactions.
*   **Command Line Interface (CLI):** Provides a user-friendly text-based interface for interacting with the blockchain.

## Core_Technologies

*   `Node.js`: JavaScript runtime environment.
*   `JavaScript`: Primary programming language.
*   `ethers.js`: Library for interacting with wallets and digital signatures.
*   `crypto-js`: Library for cryptographic functions (`SHA256`).
*   `Mocha` & `Chai`: Frameworks for unit testing.
*   `async-mutex`: Library for managing concurrency during mining.

## Execution_Guide

1.  **Prerequisites:** Ensure you have Node.js and npm (Node Package Manager) installed on your system.

2.  **Clone the Repository:**

    ```bash
    git clone https://github.com/vasconcel/aurelia-blockchain.git
    ```

3.  **Install Dependencies:**

    ```bash
    cd aurelia-blockchain
    npm install
    ```

4.  **Run the Application:**

    ```bash
    node index.js
    ```

    The CLI will guide you through the available options:

    *   **1. Add transaction:** Adds a new transaction to the transaction pool.
    *   **2. Mine:** Initiates the mining of a new block, including pending transactions and the reward transaction.
    *   **3. View blockchain:** Displays the current blockchain.
    *   **4. View address history:** Shows the transaction history for a specific address.
    *   **5. Exit:** Terminates the application.

5.  **Interacting with the CLI:**

    Follow the CLI prompts. For example, to add a transaction, choose option "1", enter the recipient's address, the amount to transfer, and the transaction fee. To mine a block, choose option "2".

6.  **Run Tests:**

    ```bash
    npm test
    ```

    The tests validate the blockchain's functionality across various scenarios. The `mineForTest` function is used internally within the tests to simulate mining with controlled parameters.

## License

This repository is licensed under the [MIT License](https://choosealicense.com/licenses/mit/).
