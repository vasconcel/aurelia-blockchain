const readline = require("readline");
const chalk = require("chalk"); // Import chalk for styling
const Blockchain = require("./src/Blockchain.js");
const { Transaction, TransactionList } = require("./src/Transaction.js");
const { hashBlockData } = require("./src/Block.js");

const myBlockchain = new Blockchain();
const transactionList = new TransactionList();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Ocean-themed colors
const aqua = chalk.cyanBright;
const oceanBlue = chalk.blue;
const seafoam = chalk.rgb(157, 255, 199)
const coral = chalk.rgb(255, 127, 80);
const wave = chalk.rgb(0, 191, 255);

console.log(aqua("\nWelcome to the Aurelia Network!\n"));

function displayMenu() {
    console.log(oceanBlue("\nChoose an action:"));
    console.log(`${aqua("1.")} ${seafoam("Add transaction")}`);
    console.log(`${aqua("2.")} ${seafoam("Mine block")}`);
    console.log(`${aqua("3.")} ${seafoam("View blockchain")}`);
    console.log(`${aqua("4.")} ${coral("Exit")}`);
    rl.question(wave("Enter your choice: "), (choice) => {
        handleChoice(choice);
    });
}

function handleChoice(choice) {
    switch (choice) {
        case "1":
            inputTransaction();
            break;
        case "2":
            mineBlock();
            break;
        case "3":
            viewBlockchain();
            break;
        case "4":
            exitAurelia();
            break;
        default:
            console.log(chalk.red("Invalid choice. Please try again."));
            displayMenu();
            break;
    }
}

function inputTransaction() {
    rl.question(chalk.cyan("Enter the sender's name: "), (sender) => {
        rl.question(chalk.cyan("Enter the recipient's name: "), (recipient) => {
            rl.question(chalk.cyan("Enter the amount of Éfira to transfer: "), (amount) => {
                if (isNaN(amount) || parseFloat(amount) <= 0) {
                    console.log(chalk.red("Please enter a valid amount."));
                    return inputTransaction();
                }

                const transaction = new Transaction(sender, recipient, parseFloat(amount));
                transactionList.addTransaction(transaction);
                console.log(chalk.green(`Transaction added: ${transaction.displayTransaction()}\n`));
                displayMenu();
            });
        });
    });
}


function mineBlock() {
    if (transactionList.getTransactions().length === 0) {
        console.log(chalk.red("\nNo transactions to mine. Please add some transactions first.\n"));
        displayMenu();
        return;
    }

    console.log(chalk.yellow("Mining...\n")); // Indicate mining start

    myBlockchain.mine(transactionList.getTransactions())
        .then(() => {
            console.log(chalk.green("Mining complete!\n"));
            transactionList.clearTransactions();
            displayMenu();
        })
        .catch(error => {
            console.error(chalk.red("Mining error:", error));
            displayMenu();
        });
}

function viewBlockchain() {
    const blockchain = myBlockchain.getBlockchain();
    blockchain.forEach(block => {
        const recalculatedHash = hashBlockData(block);
        if (recalculatedHash !== block.hash) {
            console.error(chalk.red(`Block ${block.index}: Hash mismatch! Stored: ${block.hash}, Recalculated: ${recalculatedHash}`));
        }
    });
    console.log(chalk.yellow("\nCurrent Blockchain:\n"), chalk.gray(JSON.stringify(blockchain, null, 2)));
    displayMenu();
}


function exitAurelia() {
    console.log(chalk.blueBright("\nExiting Aurelia Network...\n"));
    rl.close();
}

displayMenu();