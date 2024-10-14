// index.js
const readline = require("readline");
const Blockchain = require("./src/Blockchain.js");
const { Transaction, TransactionList } = require("./src/Transaction.js");

// Estilização para o console
const chalk = require('chalk'); // Importe o chalk

// Nome da Rede
const networkName = "Aurelia Network";

// Instanciando uma nova blockchain.
const myBlockchain = new Blockchain();
const transactionList = new TransactionList();

// Configurando o readline para capturar entradas do console.
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Função para exibir o cabeçalho da rede
function displayHeader() {
    console.log(chalk.blue(`\n=== ${networkName} ===\n`));
}


// Função para capturar transações do console.
function inputTransaction() {
    displayHeader(); // Exibe o cabeçalho

    rl.question(chalk.yellow("Enter the sender's name: "), (sender) => {
        rl.question(chalk.yellow("Enter the recipient' name: "), (recipient) => {
            rl.question(chalk.yellow("Enter the amount of Éfira to transfer: "), (amount) => {
                const transaction = new Transaction(sender, recipient, parseFloat(amount));
                transactionList.addTransaction(transaction);
                console.log(chalk.green(`Transaction added: ${transaction.displayTransaction()}`));

                rl.question(chalk.yellow("Do you want to add another transaction? (y/n): "), (answer) => {
                    if (answer.toLowerCase() === 'y') {
                        inputTransaction();
                    } else {
                        console.log(chalk.cyan("\nStarting mining...\n"));
                        myBlockchain.mine(transactionList.getTransactions())
                            .then(() => { // Adicione um then para lidar com a promessa resolvida
                                console.log(chalk.green("Current Blockchain:"), JSON.stringify(myBlockchain.getBlockchain(), null, 2));
                                rl.close();
                            });
                    }
                });
            });
        });
    });
}

inputTransaction();