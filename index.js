import readline from "readline";
import chalk from "chalk";
import Blockchain from "./src/Blockchain.js";
import { Transaction, TransactionList } from "./src/Transaction.js";
import { hashBlockData } from "./src/Block.js";

// Instancia a blockchain e a lista de transações.
const myBlockchain = new Blockchain();
const transactionList = new TransactionList();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Paleta de cores oceânicas.
const aqua = chalk.cyanBright;
const oceanBlue = chalk.blue;
const seafoam = chalk.rgb(157, 255, 199);
const coral = chalk.rgb(255, 127, 80);
const wave = chalk.rgb(0, 191, 255);

console.log(aqua("\nWelcome to the Aurelia Network!\n"));

// Exibe o menu principal com as opções de interação.
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

// Lida com a escolha do usuário.
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
            // Tratamento de erros.
            console.log(chalk.red("Invalid choice. Please try again."));
            displayMenu();
            break;
    }
}

// Captura e adiciona uma nova transação.
function inputTransaction() {
    rl.question(chalk.cyan("Enter the sender's name: "), (sender) => {
        rl.question(chalk.cyan("Enter the recipient's name: "), (recipient) => {
            rl.question(chalk.cyan("Enter the amount of Éfira to transfer: "), (amount) => {
                // Verifica se o valor é numérico e maior que zero.
                if (isNaN(amount) || parseFloat(amount) <= 0) {
                    console.log(chalk.red("Please enter a valid amount."));
                    return inputTransaction();  // Repete a entrada se o valor for inválido.
                }

                // Cria e adiciona a transação.
                const transaction = new Transaction(sender, recipient, parseFloat(amount));
                transactionList.addTransaction(transaction);
                console.log(chalk.green(`Transaction added: ${transaction.displayTransaction()}\n`));
                displayMenu();
            });
        });
    });
}

// Minera um bloco com as transações atuais.
function mineBlock() {
    if (transactionList.getTransactions().length === 0) {
        console.log(chalk.red("\nNo transactions to mine. Please add some transactions first.\n"));
        displayMenu();
        return;
    }

    console.log(chalk.yellow("Mining...\n"));

    // Inicia a mineração e adiciona o bloco à blockchain.
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

// Exibe a blockchain e verifica a integridade de cada bloco.
function viewBlockchain() {
    const blockchain = myBlockchain.getBlockchain();
    let isValidChain = true; // Inicializa como válido.

    blockchain.forEach(block => {
        // Cria uma cópia das transações do bloco, excluindo a última (recompensa do minerador).
        const transactionsWithoutReward = block.transactions.slice(0, -1);

        // Recalcula o hash usando as transações sem a recompensa.
        const recalculatedHash = hashBlockData({
            ...block,
            transactions: transactionsWithoutReward
        });

        if (recalculatedHash !== block.hash) {
            console.error(chalk.red(`Block ${block.index}: Hash mismatch! Stored: ${block.hash}, Recalculated: ${recalculatedHash}`));
            isValidChain = false;
        }
    });

    // Exibe uma única mensagem de validação ou erro.
    if (isValidChain) {
        console.log(chalk.green("\nBlockchain integrity verified! All blocks are valid.\n"));
    } else {
      console.error(chalk.red("\nBlockchain integrity compromised! One or more blocks are invalid.\n"));
    }

    // Exibe a blockchain formatada.
    console.log(chalk.yellow("Current Blockchain:\n"), chalk.gray(JSON.stringify(blockchain, null, 2)));
    displayMenu();
}

// Sai do programa.
function exitAurelia() {
    console.log(chalk.blueBright("\nExiting Aurelia Network...\n"));
    rl.close();
}

// Inicia o menu.
displayMenu();