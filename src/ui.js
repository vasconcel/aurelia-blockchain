import { COLOR_SCHEME, addTransaction, viewBlockchain, viewAddressHistory, exitApplication, mine } from '../index.js';

export function questionAsync(rl, prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

export function displayMenu(rl, blockchain) {
    console.log(COLOR_SCHEME.secondary("\nChoose an action:"));
    console.log(`${COLOR_SCHEME.primary("1.")} ${COLOR_SCHEME.light("Add transaction")}`);
    console.log(`${COLOR_SCHEME.primary("2.")} ${COLOR_SCHEME.light("Mine")}`);
    console.log(`${COLOR_SCHEME.primary("3.")} ${COLOR_SCHEME.light("View blockchain")}`);
    console.log(`${COLOR_SCHEME.primary("4.")} ${COLOR_SCHEME.light("View address history")}`);
    console.log(`${COLOR_SCHEME.primary("5.")} ${COLOR_SCHEME.accent("Exit")}`);

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
            exitApplication();
            break;
        default:
            console.log(COLOR_SCHEME.error("Invalid choice. Please try again."));
            displayMenu(rl, blockchain);
    }
}