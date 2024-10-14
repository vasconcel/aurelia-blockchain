const readline = require("readline");
const Blockchain = require("./src/Blockchain.js");
const { Transaction, TransactionList } = require("./src/Transaction.js");
const { hashBlockData } = require("./src/Block.js");

const myBlockchain = new Blockchain();
const transactionList = new TransactionList();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

console.log("\nWelcome to the Aurelia Network!\n");

function displayMenu() {
    console.log("\nChoose an action:");
    console.log("1. Add transaction");
    console.log("2. Mine block");
    console.log("3. View blockchain");
    console.log("4. Exit");
    rl.question("Enter your choice: ", (choice) => {
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
            console.log("Invalid choice. Please try again.");
            displayMenu();
            break;
    }
}

function inputTransaction() {
    rl.question("Enter the sender's name: ", (sender) => {
        rl.question("Enter the recipient's name: ", (recipient) => {
            rl.question("Enter the amount of Éfira to transfer: ", (amount) => {
                if (isNaN(amount) || parseFloat(amount) <= 0) {
                    console.log("Please enter a valid amount.");
                    return inputTransaction();
                }

                const transaction = new Transaction(sender, recipient, parseFloat(amount));
                transactionList.addTransaction(transaction);
                console.log(`Transaction added: ${transaction.displayTransaction()}\n`);
                displayMenu();
            });
        });
    });
}

function mineBlock() {
    if (transactionList.getTransactions().length === 0) {
        console.log("\nNo transactions to mine. Please add some transactions first.\n");
        displayMenu();
        return;
    }

    myBlockchain.mine(transactionList.getTransactions())
        .then(() => {
            console.log("Mining complete!\n");
            transactionList.clearTransactions();
            displayMenu();
        })
        .catch(error => {
            console.error("Mining error:", error);
            displayMenu();
        });
}

function viewBlockchain() {
    const blockchain = myBlockchain.getBlockchain();
    blockchain.forEach(block => {
        const recalculatedHash = hashBlockData(block);
        if (recalculatedHash !== block.hash) {
            console.error(`Block ${block.index}: Hash mismatch! Stored: ${block.hash}, Recalculated: ${recalculatedHash}`);
        }
    });
    console.log("\nCurrent Blockchain:\n", JSON.stringify(blockchain, null, 2));
    displayMenu();
}

function exitAurelia() {
    console.log("\nExiting Aurelia Network...\n");
    rl.close();
}

displayMenu();