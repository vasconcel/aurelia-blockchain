import readline from "readline";
import { COLOR_SCHEME } from '../index.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

export function questionAsync(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

export function displayMenu() {
    console.log(COLOR_SCHEME.secondary("\nChoose an action:"));
    console.log(`${COLOR_SCHEME.primary("1.")} ${COLOR_SCHEME.light("Add transaction")}`);
    console.log(`${COLOR_SCHEME.primary("2.")} ${COLOR_SCHEME.light("View blockchain")}`);
    console.log(`${COLOR_SCHEME.primary("3.")} ${COLOR_SCHEME.light("View address history")}`);
    console.log(`${COLOR_SCHEME.primary("4.")} ${COLOR_SCHEME.accent("Exit")}`);

    rl.question(COLOR_SCHEME.info("Enter your choice: "), handleChoice);
}

export function handleChoice(choice) {
    switch (choice) {
        case "1":
            addTransaction();
            break;
        case "2":
            viewBlockchain();
            break;
        case "3":
            viewAddressHistory();
            break;
        case "4":
            exitApplication();
            break;
        default:
            console.log(COLOR_SCHEME.error("Invalid choice. Please try again."));
            displayMenu();
    }
}

export async function askForValidInput(prompt, validationFn) {
    let input;
    while (true) {
        input = await questionAsync(COLOR_SCHEME.primary(prompt));
        if (validationFn(input)) {
            return input;
        } else {
            console.log(COLOR_SCHEME.error("Invalid input. Please try again."));
        }
    }
}