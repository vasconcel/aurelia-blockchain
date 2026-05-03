import { COLOR_SCHEME, addTransaction, viewBlockchain, viewAddressHistory, exitApplication, mine, viewMetrics, runStressTest, startServer } from '../index.js';

export function handleChoice(rl, choice, blockchain) {
    switch (choice) {
        case "1":
            addTransaction(blockchain);
            break;
        case "2":
            mine();
            break;
        case "3":
            viewBlockchain();
            break;
        case "4":
            viewAddressHistory(rl, blockchain);
            break;
        case "5":
            viewMetrics();
            break;
        case "6":
            runStressTest();
            break;
        case "7":
            startServer();
            break;
        case "8":
            exitApplication();
            break;
        default:
            console.log(COLOR_SCHEME.error("Invalid choice. Please try again."));
            displayMenu(rl, blockchain);
    }
}

export function displayMenu(rl, blockchain) {
    console.log(COLOR_SCHEME.secondary("\nChoose an action:"));
    console.log(`${COLOR_SCHEME.primary("1.")} ${COLOR_SCHEME.light("Add transaction")}`);
    console.log(`${COLOR_SCHEME.primary("2.")} ${COLOR_SCHEME.light("Mine")}`);
    console.log(`${COLOR_SCHEME.primary("3.")} ${COLOR_SCHEME.light("View blockchain")}`);
    console.log(`${COLOR_SCHEME.primary("4.")} ${COLOR_SCHEME.light("View address history")}`);
    console.log(`${COLOR_SCHEME.primary("5.")} ${COLOR_SCHEME.light("View metrics")}`);
    console.log(`${COLOR_SCHEME.primary("6.")} ${COLOR_SCHEME.light("Run stress test")}`);
    console.log(`${COLOR_SCHEME.primary("7.")} ${COLOR_SCHEME.light("Start web server")}`);
    console.log(`${COLOR_SCHEME.primary("8.")} ${COLOR_SCHEME.accent("Exit")}`);

    rl.question(COLOR_SCHEME.info("Enter your choice: "), (choice) => handleChoice(rl, choice, blockchain));
}

export function handleChoice(rl, choice, blockchain) {
    switch (choice) {
        case "1":
            addTransaction(blockchain);
            break;
        case "2":
            mine();
            break;
        case "3":
            viewBlockchain();
            break;
        case "4":
            viewAddressHistory(rl, blockchain);
            break;
        case "5":
            viewMetrics(blockchain);
            break;
        case "6":
            exitApplication();
            break;
        default:
            console.log(COLOR_SCHEME.error("Invalid choice. Please try again."));
            displayMenu(rl, blockchain);
    }
}

function viewMetrics(blockchain) {
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