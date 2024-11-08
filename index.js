import readline from "readline";
import chalk from "chalk";
import Blockchain from "./src/Blockchain.js";
import { Transaction, TransactionList } from "./src/Transaction.js";

// Constantes para cores do console
const COLOR_SCHEME = {
    primary: chalk.cyanBright,
    secondary: chalk.blue,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
    info: chalk.rgb(0, 191, 255), // wave
    light: chalk.rgb(157, 255, 199), // seafoam
    accent: chalk.rgb(255, 127, 80), // coral
};

// Interface de leitura de linha
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Instâncias da blockchain e da lista de transações
const blockchain = new Blockchain();
const transactionList = new TransactionList();

// Função principal para exibir o menu
function displayMenu() {
    console.log(COLOR_SCHEME.secondary("\nChoose an action:"));
    console.log(`${COLOR_SCHEME.primary("1.")} ${COLOR_SCHEME.light("Add transaction")}`);
    console.log(`${COLOR_SCHEME.primary("2.")} ${COLOR_SCHEME.light("Mine block")}`);
    console.log(`${COLOR_SCHEME.primary("3.")} ${COLOR_SCHEME.light("View blockchain")}`);
    console.log(`${COLOR_SCHEME.primary("4.")} ${COLOR_SCHEME.accent("Exit")}`);

    rl.question(COLOR_SCHEME.info("Enter your choice: "), handleChoice);
}

// Função para lidar com a escolha do usuário
function handleChoice(choice) {
    switch (choice) {
        case "1":
            addTransaction();
            break;
        case "2":
            mineBlock();
            break;
        case "3":
            viewBlockchain();
            break;
        case "4":
            exitApplication();
            break;
        default:
            console.log(COLOR_SCHEME.error("Invalid choice. Please try again."));
            displayMenu();
    }
}

// Função para adicionar uma nova transação
function addTransaction() {
    rl.question(COLOR_SCHEME.primary("Enter the sender's name: "), (sender) => {
        rl.question(COLOR_SCHEME.primary("Enter the recipient's name: "), (recipient) => {
            rl.question(COLOR_SCHEME.primary("Enter the amount of Éfira to transfer: "), (amount) => {
                const amountValue = parseFloat(amount);

                if (isNaN(amountValue) || amountValue <= 0) {
                    console.log(COLOR_SCHEME.error("Please enter a valid amount."));
                    return addTransaction();
                }

                const transaction = new Transaction(sender, recipient, amountValue);
                transactionList.addTransaction(transaction);
                console.log(COLOR_SCHEME.success(`Transaction added: ${transaction.displayTransaction()}\n`));
                displayMenu();
            });
        });
    });
}

// Função para minerar um bloco
async function mineBlock() {
    const transactions = transactionList.getTransactions();

    if (transactions.length === 0) {
        console.log(COLOR_SCHEME.error("\nNo transactions to mine. Please add some transactions first.\n"));
        displayMenu();
        return;
    }

    console.log(COLOR_SCHEME.warning("Mining...\n"));

    try {
        await blockchain.mine(transactions);
        console.log(COLOR_SCHEME.success("Mining complete!\n"));
        transactionList.clearTransactions();
    } catch (error) {
        console.error(COLOR_SCHEME.error("Mining error:", error));
    } finally { // Garante que o menu será exibido mesmo com erros.
        displayMenu();
    }
}

// Função para visualizar a blockchain
function viewBlockchain() {
  console.log(COLOR_SCHEME.warning("Current Blockchain:\n"), chalk.gray(JSON.stringify(blockchain.getBlockchain(), null, 2)));
  displayMenu();
}

// Função para sair do aplicativo
function exitApplication() {
    console.log(COLOR_SCHEME.secondary("\nExiting Aurelia Network...\n"));
    rl.close();
}

// Inicia a aplicação exibindo o menu.
console.log(COLOR_SCHEME.primary("\nWelcome to the Aurelia Network!\n"));
displayMenu();