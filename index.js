// Importações.
const Blockchain = require("./Blockchain.js");
const Transaction = require("./Transaction.js");

// Instanciando uma nova blockchain.
const myBlockchain = new Blockchain();

// Criando algumas transações.
const transaction1 = new Transaction("Asterion", "Teseu", 50);
const transaction2 = new Transaction("Midas", "Dédalo", 25);
const transaction3 = new Transaction("Édipo", "Antígona", 10);

// Exibindo transações.
console.log("Transaction 1:", transaction1.displayTransaction());
console.log("Transaction 2:", transaction1.displayTransaction());
console.log("Transaction 3:", transaction1.displayTransaction());

// Minerando blocos com as transações.
console.log("Mining block 1...");
myBlockchain.mine([transaction1]);

console.log("Mining block 2...");
myBlockchain.mine([transaction2]);

console.log("Mining block 3...");
myBlockchain.mine([transaction3]);

// Exibindo a blockchain.
console.log("Blockchain atual:", JSON.stringify(myBlockchain.getBlockchain(), null, 2));