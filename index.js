import readline from "readline";
import chalk from "chalk";
import Blockchain from "./src/Blockchain.js";
import { Transaction, TransactionList } from "./src/Transaction.js";
import { Wallet } from "./src/Wallet.js";

// Definição de um esquema de cores para mensagens no console, visando legibilidade e distinção entre tipos de mensagens
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

// Criação de uma interface de leitura de linha para capturar inputs do usuário
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Instância da blockchain e lista de transações para gerenciamento de operações
const blockchain = new Blockchain();
const transactionList = new TransactionList();

// Exibe o menu principal com opções de ações para o usuário
function displayMenu() {
    console.log(COLOR_SCHEME.secondary("\nChoose an action:"));
    console.log(`${COLOR_SCHEME.primary("1.")} ${COLOR_SCHEME.light("Add transaction")}`);
    console.log(`${COLOR_SCHEME.primary("2.")} ${COLOR_SCHEME.light("Mine block")}`);
    console.log(`${COLOR_SCHEME.primary("3.")} ${COLOR_SCHEME.light("View blockchain")}`);
    console.log(`${COLOR_SCHEME.primary("4.")} ${COLOR_SCHEME.light("View address history")}`);
    console.log(`${COLOR_SCHEME.primary("5.")} ${COLOR_SCHEME.accent("Exit")}`);

    // Solicita ao usuário uma escolha e lida com a resposta
    rl.question(COLOR_SCHEME.info("Enter your choice: "), handleChoice);
}

// Processa a escolha do usuário e executa a ação correspondente
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
            viewAddressHistory();
            break;
        case "5":
            exitApplication();
            break;
        default:
            console.log(COLOR_SCHEME.error("Invalid choice. Please try again."));
            displayMenu();
    }
}

// Adiciona uma nova transação, solicitando endereço do destinatário e valor ao usuário
async function addTransaction() {
    try {
        const senderWallet = new Wallet();
        let recipientAddress;

        // Solicita um endereço válido do destinatário
        while (true) {
            recipientAddress = await new Promise((resolve) =>
                rl.question(COLOR_SCHEME.primary("Enter the recipient's address (0x...): "), resolve)
            );
            if (typeof recipientAddress === 'string' && recipientAddress.startsWith('0x')) {
                break;
            } else {
                console.log(COLOR_SCHEME.error("Invalid recipient address. Please enter a valid address."));
            }
        }

        let amount;

        // Solicita um valor válido para transação
        while (true) {
            amount = await new Promise((resolve) =>
                rl.question(COLOR_SCHEME.primary("Enter the amount to send: "), resolve)
            );
            if (!isNaN(amount) && parseFloat(amount) > 0) {
                amount = parseFloat(amount);
                break;
            } else {
                console.log(COLOR_SCHEME.error("Invalid amount. Please enter a valid number greater than 0."));
            }
        }

        // Cria e assina a transação, depois a adiciona à lista de transações
        const transaction = new Transaction(senderWallet, recipientAddress, amount);
        transaction.signTransaction();
        transactionList.addTransaction(transaction);
        console.log(COLOR_SCHEME.success("Transaction added successfully!\n"));

    } catch (error) {
        console.error(COLOR_SCHEME.error("Error adding transaction:", error));
    }

    // Retorna ao menu principal
    displayMenu();
}

// Realiza a mineração de um bloco com as transações pendentes
async function mineBlock() {
    const transactions = transactionList.getTransactions();

    // Verifica se há transações para minerar
    if (transactions.length === 0) {
        console.log(COLOR_SCHEME.error("\nNo transactions to mine. Please add some transactions first.\n"));
        displayMenu();
        return;
    }

    console.log(COLOR_SCHEME.warning("Mining...\n"));

    try {
        // Executa a mineração do bloco e limpa a lista de transações pendentes
        await blockchain.mine(transactions);
        console.log(COLOR_SCHEME.success("Mining complete!\n"));
        transactionList.clearTransactions();
    } catch (error) {
        console.error(COLOR_SCHEME.error("Mining error:", error));
    } finally {
        // Retorna ao menu principal
        displayMenu();
    }
}

// Exibe o conteúdo da blockchain no console
function viewBlockchain() {
    console.log(COLOR_SCHEME.secondary("\nViewing Blockchain...\n"));
    blockchain.getBlockchain().forEach((block) => console.log(JSON.stringify(block, null, 2)));
    displayMenu();
}

// Exibe o histórico de transações de um endereço especificado
async function viewAddressHistory() {
    const address = await new Promise((resolve) =>
        rl.question(COLOR_SCHEME.primary("Enter the address (0x...): "), resolve)
    );

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
    displayMenu();
}

// Encerra a aplicação, fechando a interface de leitura
function exitApplication() {
    console.log(COLOR_SCHEME.secondary("\nExiting Aurelia Network...\n"));
    rl.close();
}

// Inicia a aplicação com uma mensagem de boas-vindas e exibe o menu
console.log(COLOR_SCHEME.primary("\nWelcome to the Aurelia Network!\n"));
displayMenu();