import { expect } from 'chai';
import P2PNetwork from '../src/P2PNetwork.js';
import Blockchain from '../src/Blockchain.js';
import { Transaction } from '../src/Transaction.js';
import { Wallet } from '../src/Wallet.js';
import { Block } from '../src/Block.js';
import { mineForTest } from '../src/Blockchain.js';

describe('P2PNetwork', () => {
    let blockchain;
    let p2pNetwork;

    // Inicializa uma nova blockchain e rede P2P antes de cada teste.
    beforeEach(() => {
        blockchain = new Blockchain();
        blockchain.difficulty = 1;
        p2pNetwork = new P2PNetwork(blockchain);
    });

    it('deve adicionar um nó à lista de nós', () => {
        const node = new P2PNetwork(new Blockchain());
        p2pNetwork.connectToPeer(node);
        
        // Verifica se o nó foi adicionado corretamente.
        expect(p2pNetwork.nodes.length).to.equal(1);
        expect(p2pNetwork.nodes[0]).to.equal(node);
    });

    it('deve transmitir uma transação para todos os nós', async () => {
        const node1 = new Blockchain();
        const node2 = new Blockchain();
        const node3 = new Blockchain();
        node1.id = 'node1';
        node2.id = 'node2';
        node3.id = 'node3';
        node1.difficulty = 1;
        node2.difficulty = 1;
        node3.difficulty = 1;
        const p2pNode1 = new P2PNetwork(node1);
        const p2pNode2 = new P2PNetwork(node2);
        const p2pNode3 = new P2PNetwork(node3);

        p2pNode1.connectToPeer(p2pNode2);
        p2pNode2.connectToPeer(p2pNode3);
        p2pNode1.connectToPeer(p2pNode3);
        p2pNode2.connectToPeer(p2pNode1);
        p2pNode2.connectToPeer(p2pNode3);
        p2pNode3.connectToPeer(p2pNode1);
        p2pNode3.connectToPeer(p2pNode2);

        const wallet = new Wallet();

        node1.initializeBalances({ [wallet.getAddress()]: 100 });
        node2.initializeBalances({ [wallet.getAddress()]: 100 });
        node3.initializeBalances({ [wallet.getAddress()]: 100 });

        const transaction = new Transaction(wallet, '0xRecipient', 10, 1);
        await transaction.signTransaction();

        await p2pNode1.broadcastTransaction(transaction);
        await new Promise(resolve => setTimeout(resolve, 1000));

        expect(p2pNode1.transactionPool.length).to.equal(1);
        expect(p2pNode2.transactionPool.length).to.equal(1);
        expect(p2pNode3.transactionPool.length).to.equal(1);
    });

    it('deve lidar com o recebimento de uma transação válida', async () => {
        const wallet = new Wallet();
        blockchain.initializeBalances({ [wallet.getAddress()]: 100 });

        const transaction = new Transaction(wallet, '0xRecipient', 10, 1);
        await transaction.signTransaction();

        await p2pNetwork.onTransactionReceived(transaction, p2pNetwork);
        await new Promise(resolve => setTimeout(resolve, 500));

        expect(p2pNetwork.transactionPool.length).to.equal(1);
    });

    it('não deve adicionar uma transação inválida ao pool', async () => {
        const wallet = new Wallet();
        const transaction = new Transaction(wallet, '0xRecipient', 10, 1);
        await p2pNetwork.onTransactionReceived(transaction, p2pNetwork);
        expect(p2pNetwork.transactionPool.length).to.equal(0);
    });

    it('deve minerar um bloco quando o pool de transações estiver cheio', async () => {
        const senderWallet = new Wallet();
        blockchain.initializeBalances({ [senderWallet.getAddress()]: 500 });
        
        // Cria transações, assina e adiciona ao pool.
        const transaction1 = new Transaction(senderWallet, '0xRecipient', 5, 0.5);
        const transaction2 = new Transaction(senderWallet, '0xRecipient', 5, 0.5);
        await transaction1.signTransaction();
        await transaction2.signTransaction();

        await p2pNetwork.onTransactionReceived(transaction1, p2pNetwork);
        await p2pNetwork.onTransactionReceived(transaction2, p2pNetwork);

        blockchain.p2pNetwork.transactionPool.push(...p2pNetwork.transactionPool);

        expect(blockchain.p2pNetwork.transactionPool.length).to.equal(2);

        process.env.TEST_MODE = 'true';
        await mineForTest(blockchain);
        process.env.TEST_MODE = 'false';
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verifica se o pool foi esvaziado e se o bloco foi adicionado.
        expect(blockchain.p2pNetwork.transactionPool.length).to.equal(0);
        expect(blockchain.chain.length).to.equal(2);
    });

    it('deve lidar com o recebimento de um bloco válido', async () => {
        // Cria uma blockchain e um nó P2P separados.
        const anotherBlockchain = new Blockchain();
        anotherBlockchain.difficulty = 1;
        anotherBlockchain.mine = anotherBlockchain.mineForTest;
        const wallet = new Wallet();
        anotherBlockchain.initializeBalances({ [wallet.getAddress()]: 500 });
        const validTransaction = new Transaction(wallet, '0xRecipient', 10, 1);
        await validTransaction.signTransaction();
        anotherBlockchain.p2pNetwork.transactionPool.push(validTransaction);
        process.env.TEST_MODE = 'true';
        const block = await mineForTest(anotherBlockchain);
        process.env.TEST_MODE = 'false';

        // Simula o recebimento do bloco válido na rede P2P original.
        await p2pNetwork.onBlockReceived(block);

        // Verifica se o bloco foi adicionado à cadeia da rede original.
        expect(p2pNetwork.blockchain.chain.length).to.equal(2);
        expect(p2pNetwork.blockchain.latestBlock.hash).to.equal(block.hash);
    });

    it('não deve adicionar um bloco inválido', () => {
        const block = new Block(10, 'prevhash', Date.now(), [], 0, 'merkleRoot');
        p2pNetwork.onBlockReceived(block);
        expect(p2pNetwork.blockchain.chain.length).to.equal(1);
    });

    it('deve propagar blocos entre os nós', async function() {
        this.timeout(5000);

        //Cria três nós e os conecta.
        const node1 = new Blockchain();
        const node2 = new Blockchain();
        const node3 = new Blockchain();
        node1.id = 'node1';
        node2.id = 'node2';
        node3.id = 'node3';
        node1.difficulty = 1;
        node2.difficulty = 1;
        node3.difficulty = 1;
        const p2pNode1 = new P2PNetwork(node1);
        const p2pNode2 = new P2PNetwork(node2);
        const p2pNode3 = new P2PNetwork(node3);

        p2pNode1.connectToPeer(p2pNode2);
        p2pNode2.connectToPeer(p2pNode3);
        p2pNode1.connectToPeer(p2pNode3);

        // Configura a função de solicitação da blockchain.
        p2pNode2.requestBlockchain = async () => node2.latestBlock;
        p2pNode3.requestBlockchain = async () => node3.latestBlock;

        // Cria uma carteira e inicializa os saldos nos nós.
        const wallet = new Wallet();
        node1.initializeBalances({ [wallet.getAddress()]: 500 });
        node2.initializeBalances({ [wallet.getAddress()]: 500 });
        node3.initializeBalances({ [wallet.getAddress()]: 500 });

        // Cria uma transação e adiciona ao pool do nó 1.
        const transaction = new Transaction(wallet, '0xRecipient', 10, 1);
        await transaction.signTransaction();
        node1.p2pNetwork.transactionPool.push(transaction);

        process.env.TEST_MODE = 'true';
        const block = await mineForTest(node1);
        block.id = "block1";
        process.env.TEST_MODE = 'false';
        p2pNode1.broadcastBlock(block);

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verifica se os nós 2 e 3 receberam e adicionaram o bloco.
        expect(node2.chain.length).to.equal(2);
        expect(node3.chain.length).to.equal(2);
        expect(node2.latestBlock.hash).to.equal(block.hash);
        expect(node3.latestBlock.hash).to.equal(block.hash);
    });

    it('deve atualizar os saldos corretamente após a mineração de um bloco', async () => {
        // Cria duas carteiras e inicializa os saldos.
        const wallet1 = new Wallet();
        const wallet2 = new Wallet();
        blockchain.initializeBalances({
            [wallet1.getAddress()]: 100,
            [wallet2.getAddress()]: 50,
        });

        // Cria uma transação, assina e adiciona ao pool da rede.
        const transaction = new Transaction(wallet1, wallet2.getAddress(), 20, 5);
        await transaction.signTransaction();
        await p2pNetwork.onTransactionReceived(transaction, p2pNetwork);
        blockchain.p2pNetwork.transactionPool.push(...p2pNetwork.transactionPool);

        process.env.TEST_MODE = 'true';
        await mineForTest(blockchain);
        process.env.TEST_MODE = 'false';

        // Verifica se os saldos foram atualizados corretamente.
        expect(blockchain.getBalance(wallet1.getAddress())).to.equal(75);
        expect(blockchain.getBalance(wallet2.getAddress())).to.equal(70);
        expect(blockchain.getBalance(blockchain.miningRewardWallet.getAddress())).to.equal(1055);
    });

    it('deve rejeitar transações com saldo insuficiente', async () => {
        // Cria duas carteiras e inicializa os saldos com valores insuficientes.
        const wallet1 = new Wallet();
        const wallet2 = new Wallet();
        blockchain.initializeBalances({
            [wallet1.getAddress()]: 10,
            [wallet2.getAddress()]: 0,
        });

        // Cria uma transação com valor superior ao saldo disponível.
        const transaction = new Transaction(wallet1, wallet2.getAddress(), 20, 1);
        await transaction.signTransaction();
        await p2pNetwork.onTransactionReceived(transaction, p2pNetwork);

        // Verifica se a transação foi rejeitada e não foi adicionada ao pool.
        expect(blockchain.isValidTransaction(transaction)).to.be.false;
        expect(p2pNetwork.transactionPool.length).to.equal(0);
    });
});