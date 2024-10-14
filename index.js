// Importações.
const readline = require("readline");
const Blockchain = require("./src/Blockchain.js");
const { Transaction, TransactionList } = require("./src/Transaction.js");

// Instanciando uma nova blockchain.
const myBlockchain = new Blockchain();
const transactionList = new TransactionList();

// Configurando o readline para capturar entradas do console.
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Função para capturar transações do console.
function inputTransaction() {
    rl.question("Enter the sender's name: ", (sender) => {
        rl.question("Enter the recipient' name: ", (recipient) => {
            rl.question("Enter the amount of Éfira to transfer: ", (amount) => {
                const transaction = new Transaction(sender, recipient, parseFloat(amount));
                transactionList.addTransaction(transaction);
                console.log(`Transaction added: ${transaction.displayTransaction()}`);

                rl.question("Do you want to add another transaction? (y/n): ", (answer) => {
                    if (answer.toLowerCase() === 'y') {
                        inputTransaction();
                    } else {
                        console.log("Starting mining...");
                        myBlockchain.mine(transactionList.getTransactions());

                        console.log("CUrrent Blockchain:", JSON.stringify(myBlockchain.getBlockchain(), null, 2));
                        rl.close();
                    }
                });
            });
        });
    });
}

inputTransaction();