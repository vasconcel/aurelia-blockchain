import readline from "readline";
import chalk from "chalk";
import Blockchain from "./src/Blockchain.js";
import { displayMenu, questionAsync } from './src/ui.js';
import { askForValidInput } from './src/helpers.js';
import { Transaction } from "./src/Transaction.js";
import { Storage } from './src/Storage.js';
import { Wallet } from './src/Wallet.js';
import ServerManager from './src/Server.js';

const args = process.argv.slice(2);

if (args.includes('--server') || args.includes('-s')) {
    const port = parseInt(args[args.indexOf('--port') + 1] || args[args.indexOf('-p') + 1]) || 3000;
    const server = new ServerManager(port);
    server.start();
    
    process.on('SIGINT', () => {
        console.log('\nShutting down server...');
        server.stop(() => {
            process.exit(0);
        });
    });
} else {
    const COLOR_SCHEME = {
        primary: chalk.cyanBright,
        secondary: chalk.blue,
        success: chalk.green,
        warning: chalk.yellow,
        error: chalk.red,
        info: chalk.rgb(0, 191, 255),
        light: chalk.rgb(157, 255, 199),
        accent: chalk.rgb(255, 127, 80),
    };

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const storage = new Storage();
    let blockchain = new Blockchain();

    const savedData = storage.load();
    if (savedData) {
        console.log(COLOR_SCHEME.info("\nLoading saved blockchain state..."));
        blockchain.chain = savedData.chain;
        blockchain.ledger.setState(savedData.ledger);
        blockchain.latestBlock = savedData.chain[savedData.chain.length - 1];
        blockchain.cumulativeDifficulty = blockchain.calculateCumulativeDifficulty();
        console.log(COLOR_SCHEME.success(`Loaded ${savedData.chain.length} blocks from storage.\n`));
    }

    const _originalAddBlock = blockchain.addBlock.bind(blockchain);
    blockchain.addBlock = function(newBlock) {
        const result = _originalAddBlock(newBlock);
        if (result) {
            storage.save(blockchain);
        }
        return result;
    };

    async function addTransaction() {
        try {
            const recipientAddress = await askForValidInput(
                rl,
                "Enter the recipient's address (0x...): ",
                (input) => input.startsWith('0x')
            );

            const amount = await askForValidInput(
                rl,
                "Enter the amount to send: ",
                (input) => !isNaN(input) && parseFloat(input) > 0
            );

            const fee = await askForValidInput(
                rl,
                "Enter the transaction fee: ",
                (input) => !isNaN(input) && parseFloat(input) >= 0
            );

            const senderAddress = blockchain.miningRewardWallet.getAddress();
            const nonce = blockchain.ledger.getNonce(senderAddress) + 1;
            const transaction = new Transaction(blockchain.miningRewardWallet, recipientAddress, parseFloat(amount), parseFloat(fee), nonce);

            await transaction.signTransaction();

            blockchain.p2pNetwork.broadcastTransaction(transaction);
            console.log(COLOR_SCHEME.success("Transaction broadcasted successfully!\n"));
        } catch (error) {
            console.error(COLOR_SCHEME.error("Error adding transaction:", error));
        }

        displayMenu(rl, blockchain);
    }

    async function mine() {
        try {
            await blockchain.mine(blockchain.p2pNetwork.transactionPool);
            blockchain.p2pNetwork.transactionPool = [];
            console.log(COLOR_SCHEME.success("Mining completed.\n"));
        } catch (error) {
            console.error(COLOR_SCHEME.error("Error during mining:", error));
        }
        displayMenu(rl, blockchain);
    }

    function viewBlockchain() {
        console.log(COLOR_SCHEME.secondary("\nViewing Blockchain...\n"));
        blockchain.getBlockchain().forEach((block) => console.log(JSON.stringify(block, null, 2)));
        displayMenu(rl, blockchain);
    }

    function viewMetrics() {
        if (blockchain.metrics) {
            const stats = blockchain.metrics.getStats();
            console.log(COLOR_SCHEME.secondary("\n=== Research Metrics ===\n"));
            console.log(`${COLOR_SCHEME.primary("Transactions Processed:")} ${stats.transactionCount}`);
            console.log(`${COLOR_SCHEME.primary("Blocks Mined:")} ${stats.blocksMined}`);
            console.log(`${COLOR_SCHEME.primary("Avg Mining Duration:")} ${stats.averageMiningDuration}ms`);
            console.log(`${COLOR_SCHEME.primary("Avg Propagation Delay:")} ${stats.averagePropagationDelay}ms`);
            console.log(COLOR_SCHEME.secondary("\nMining Durations (ms):"));
            stats.miningDurations.forEach((d, i) => console.log(`  Block ${i+1}: ${d}ms`));
            console.log(COLOR_SCHEME.secondary("\nPropagation Delays (ms):"));
            stats.propagationDelays.forEach((d, i) => console.log(`  Block ${i+1}: ${d}ms`));
            console.log("");
        } else {
            console.log(COLOR_SCHEME.warning("No metrics available."));
        }
        displayMenu(rl, blockchain);
    }

    async function runStressTest() {
        try {
            const numTransactions = parseInt(await askForValidInput(
                rl,
                "How many transactions? ",
                (input) => !isNaN(input) && parseInt(input) > 0
            ));

            console.log(COLOR_SCHEME.info("\nGenerating stress test with", numTransactions, "transactions...\n"));

            const wallets = [];
            for (let i = 0; i < Math.min(numTransactions, 20); i++) {
                wallets.push(new Wallet());
                blockchain.initializeBalances({ [wallets[i].getAddress()]: 1000 });
            }

            let txCount = 0;
            for (let i = 0; i < numTransactions; i++) {
                const senderWallet = wallets[Math.floor(Math.random() * wallets.length)];
                const recipientWallet = wallets[Math.floor(Math.random() * wallets.length)];
                
                if (senderWallet.getAddress() === recipientWallet.getAddress()) {
                    continue;
                }

                const amount = Math.random() * 50 + 1;
                const fee = Math.random() * 0.5;
                const nonce = blockchain.ledger.getNonce(senderWallet.getAddress()) + 1;

                try {
                    const tx = new Transaction(senderWallet, recipientWallet.getAddress(), amount, fee, nonce);
                    await tx.signTransaction();
                    blockchain.p2pNetwork.broadcastTransaction(tx);
                    txCount++;
                } catch (e) {}
            }

            console.log(COLOR_SCHEME.success(`Generated ${txCount} transactions. Starting mining...\n`));

            await blockchain.mine();

            while (blockchain.p2pNetwork.transactionPool.length > 0) {
                console.log(COLOR_SCHEME.info(`Pool has ${blockchain.p2pNetwork.transactionPool.length} transactions. Mining next block...`));
                await blockchain.mine();
            }

            if (blockchain.metrics) {
                blockchain.metrics.exportToCSV();
            }

            console.log(COLOR_SCHEME.success("\nStress test completed!"));
        } catch (error) {
            console.error(COLOR_SCHEME.error("Error during stress test:", error));
        }
        displayMenu(rl, blockchain);
    }

    async function viewAddressHistory() {
        const address = await questionAsync(rl, COLOR_SCHEME.primary("Enter the address (0x...): "));
        const history = blockchain.getAddressHistory(address);

        if (history.length === 0) {
            console.log(COLOR_SCHEME.warning(`No transactions found for address: ${address}`));
        } else {
            console.log(COLOR_SCHEME.secondary(`\nTransaction history for ${address}:\n`));
            for (const transaction of history) {
                const displayTx = await transaction.displayTransaction();
                console.log(`${COLOR_SCHEME.primary(`Transaction:`)}\n${displayTx}\n`);
            }
        }
        displayMenu(rl, blockchain);
    }

    function startServer() {
        console.log(COLOR_SCHEME.info("\nStarting Web Server...\n"));
        const server = new ServerManager(3000);
        server.start();
    }

    function exitApplication() {
        storage.save(blockchain);
        console.log(COLOR_SCHEME.secondary("\nSaving and exiting...\n"));
        rl.close();
    }

    console.log(COLOR_SCHEME.primary("\nWelcome to the Aurelia Network!\n"));
    console.log(COLOR_SCHEME.info("Note: Use --server or -s flag to start web server mode"));
    console.log(COLOR_SCHEME.info("Example: npm start -- --server --port 3000\n"));
    displayMenu(rl, blockchain);

    export { COLOR_SCHEME, rl, addTransaction, viewBlockchain, viewAddressHistory, exitApplication, mine, viewMetrics, runStressTest, startServer };
}