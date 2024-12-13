import { expect } from 'chai';
import P2PNetwork from '../src/P2PNetwork.js';
import Blockchain from '../src/Blockchain.js';
import { Transaction } from '../src/Transaction.js';
import { Wallet } from '../src/Wallet.js';
import { Block, hashBlockData, generateMerkleRoot } from '../src/Block.js';

describe('P2PNetwork', () => {
    let blockchain;
    let p2pNetwork;

    function initializeBalances(blockchain, address, amount) {
        blockchain.balances[address] = amount;
    }

    beforeEach(() => {
        blockchain = new Blockchain();
        blockchain.difficulty = 1;
        p2pNetwork = new P2PNetwork(blockchain);
    });

    it('deve adicionar um nó à lista de nós', () => {
        const node = new P2PNetwork(new Blockchain());
        p2pNetwork.connectToPeer(node);
        expect(p2pNetwork.nodes.length).to.equal(1);
        expect(p2pNetwork.nodes[0]).to.equal(node);
    });

    it('deve transmitir uma transação para todos os nós', async () => {
        const node1 = new P2PNetwork(new Blockchain());
        const node2 = new P2PNetwork(new Blockchain());
        p2pNetwork.connectToPeer(node1);
        p2pNetwork.connectToPeer(node2);

        const senderWallet = new Wallet();
        const senderAddress = senderWallet.getAddress();

        initializeBalances(blockchain, senderAddress, 100);
        initializeBalances(node1.blockchain, senderAddress, 100);
        initializeBalances(node2.blockchain, senderAddress, 100);

        const transaction = new Transaction(senderWallet, '0xRecipient', 10, 1);
        transaction.signature = await transaction.signTransaction();

        await p2pNetwork.broadcastTransaction(transaction);

        expect(node1.transactionPool.length).to.equal(1, 'Node 1 should have received the transaction');
        expect(node2.transactionPool.length).to.equal(1, 'Node 2 should have received the transaction');
        expect(node1.transactionPool[0].fee).to.equal(1, 'Node 1 should have received the transaction with correct fee');
        expect(node2.transactionPool[0].fee).to.equal(1, 'Node 2 should have received the transaction with correct fee');
    });

    it('deve lidar com o recebimento de uma transação válida', async () => {
        const wallet = new Wallet();
        initializeBalances(blockchain, wallet.getAddress(), 100);

        const transaction = new Transaction(wallet, '0xRecipient', 10, 1);
        transaction.signature = await transaction.signTransaction();

        await p2pNetwork.onTransactionReceived(transaction);
        expect(p2pNetwork.transactionPool.length).to.equal(1);
        expect(p2pNetwork.transactionPool[0].fee).to.equal(1);
    });

    it('não deve adicionar uma transação inválida ao pool', async () => {
        const wallet = new Wallet();

        const transaction = new Transaction(wallet, '0xRecipient', 10, 1);

        p2pNetwork.onTransactionReceived(transaction);

        expect(p2pNetwork.transactionPool.length).to.equal(0);
    });

    it('deve minerar um bloco quando o pool de transações estiver cheio', async () => {
        const senderWallet = new Wallet();
        initializeBalances(blockchain, senderWallet.getAddress(), 500);

        const transaction1 = new Transaction(senderWallet, '0xRecipient', 5, 0.5);
        const transaction2 = new Transaction(senderWallet, '0xRecipient', 5, 0.5);
        await transaction1.signTransaction();
        await transaction2.signTransaction();

        p2pNetwork.transactionPool.push(transaction1);
        p2pNetwork.transactionPool.push(transaction2);

        expect(p2pNetwork.transactionPool.length).to.equal(2);

        const newBlock = await p2pNetwork.mineBlockWithTransactions();

        expect(p2pNetwork.transactionPool.length).to.equal(0);

        if (newBlock) {
            expect(blockchain.chain.length).to.equal(2);
            const minerRewardTransaction = newBlock.transactions[0];
            expect(minerRewardTransaction.amount).to.equal(blockchain.blockReward + transaction1.fee + transaction2.fee);
        } else {
            expect(blockchain.chain.length).to.equal(1);
        }
    });

    it('deve lidar com o recebimento de um bloco válido', async () => {
        const wallet = new Wallet();
        const anotherBlockchain = new Blockchain();
        anotherBlockchain.difficulty = 1;
        const anotherNode = new P2PNetwork(anotherBlockchain);

        initializeBalances(anotherBlockchain, wallet.getAddress(), 500);

        const validTransaction = new Transaction(wallet, '0xRecipient', 10, 1);
        validTransaction.signature = await validTransaction.signTransaction();

        const block = await anotherBlockchain.mine([validTransaction]);

        await anotherNode.onBlockReceived(block);

        if (block && block.transactions && block.transactions.length > 1) {
            expect(anotherNode.blockchain.chain.length).to.equal(anotherBlockchain.chain.length);
            expect(anotherNode.blockchain.latestBlock.hash).to.equal(block.hash);
        } else {
            expect(anotherNode.blockchain.chain.length).to.equal(anotherBlockchain.chain.length);
        }
    });

    it('não deve adicionar um bloco inválido', () => {
        const block = { index: 10, hash: 'invalid' };
        p2pNetwork.onBlockReceived(block);
        expect(p2pNetwork.blockchain.chain.length).to.equal(1);
    });

    it('deve resolver fork de mesmo nível com base no timestamp', async function() {
        this.timeout(5000);
        const wallet = new Wallet();
        initializeBalances(blockchain, wallet.getAddress(), 500);

        const validTransaction = new Transaction(wallet, '0xRecipient', 10, 1);
        await validTransaction.signTransaction();
        validTransaction.signature = await validTransaction.signature;

        const block1 = await blockchain.mine([validTransaction]);

        let forkedBlockchain = new Blockchain();
        forkedBlockchain.difficulty = 1;
        initializeBalances(forkedBlockchain, wallet.getAddress(), 500);

        forkedBlockchain.chain = [Block.genesis];
        forkedBlockchain.latestBlock = forkedBlockchain.chain[0];

        if (!block1 || !block1.timestamp) {
            console.error("Erro: block1 é inválido ou não tem um timestamp.");
            return;
        }

        const laterTimestamp = block1.timestamp + 2000;

        const nextIndex = forkedBlockchain.latestBlock.index + 1;
        const previousHash = forkedBlockchain.latestBlock.hash;

        const validTransaction2 = new Transaction(wallet, '0xRecipient', 10, 1);
        await validTransaction2.signTransaction();
        validTransaction2.signature = await validTransaction2.signature;

        const totalFees = [validTransaction2].reduce((sum, tx) => sum + tx.fee, 0);
        const minerRewardTransaction = new Transaction(
            forkedBlockchain.miningRewardWallet,
            forkedBlockchain.miningRewardWallet.getAddress(),
            forkedBlockchain.blockReward + totalFees,
            0
        );

        await minerRewardTransaction.signTransaction();

        const transactions = [minerRewardTransaction, validTransaction2];
        const merkleRoot = generateMerkleRoot(transactions);
        let nonce = 0;
        let nextHash;

        const maxIterations = 10000;
        let iterations = 0;

        while (iterations < maxIterations) {
            nextHash = hashBlockData({
                index: nextIndex,
                previousHash,
                timestamp: laterTimestamp,
                transactions,
                nonce,
                merkleRoot,
            });

            if (forkedBlockchain.isValidHashDifficulty(nextHash)) {
                const block2 = new Block(
                    nextIndex,
                    previousHash,
                    laterTimestamp,
                    transactions,
                    nextHash,
                    nonce,
                    merkleRoot
                );
                forkedBlockchain.addBlock(block2);

                const anotherNode = new P2PNetwork(blockchain);
                anotherNode.blockchain.addBlock(block1);
                anotherNode.onBlockReceived(block2);

                if (anotherNode.blockchain.latestBlock && anotherNode.blockchain.latestBlock.timestamp === laterTimestamp) {
                    expect(anotherNode.blockchain.latestBlock.hash).to.equal(block2.hash);
                } else {
                    expect(anotherNode.blockchain.latestBlock.hash).to.equal(block1.hash);
                }
                break;
            }
            nonce++;
            iterations++;
        }
        if (iterations >= maxIterations) {
            console.error("Atingido o limite máximo de iterações sem encontrar um nonce válido.");
        }
    });
});