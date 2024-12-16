// ui.js
// (Removida a criação da instância do readline daqui)
import { COLOR_SCHEME, addTransaction, viewBlockchain, viewAddressHistory, exitApplication } from '../index.js';

export function questionAsync(rl, prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

export function displayMenu(rl) {
    console.log(COLOR_SCHEME.secondary("\nChoose an action:"));
    console.log(`${COLOR_SCHEME.primary("1.")} ${COLOR_SCHEME.light("Add transaction")}`);
    console.log(`${COLOR_SCHEME.primary("2.")} ${COLOR_SCHEME.light("View blockchain")}`);
    console.log(`${COLOR_SCHEME.primary("3.")} ${COLOR_SCHEME.light("View address history")}`);
    console.log(`${COLOR_SCHEME.primary("4.")} ${COLOR_SCHEME.accent("Exit")}`);

    rl.question(COLOR_SCHEME.info("Enter your choice: "), (choice) => handleChoice(rl, choice));
}

export function handleChoice(rl, choice) {
    switch (choice) {
        case "1":
            addTransaction(rl);
            break;
        case "2":
            viewBlockchain();
            break;
        case "3":
            viewAddressHistory(rl);
            break;
        case "4":
            exitApplication();
            break;
        default:
            console.log(COLOR_SCHEME.error("Invalid choice. Please try again."));
            displayMenu(rl);
    }
}