import { expect } from 'chai';
import P2PNetwork from '../src/P2PNetwork.js';
import Blockchain from '../src/Blockchain.js';
import { Transaction } from '../src/Transaction.js';
import { Wallet } from '../src/Wallet.js';
import { Block } from '../src/Block.js';

describe('P2PNetwork', () => {
    let blockchain;
    let p2pNetwork;

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
        node1.nonces = { [wallet.getAddress()]: 0 };
        node2.nonces = { [wallet.getAddress()]: 0 };
        node3.nonces = { [wallet.getAddress()]: 0 };
        node1.initializeBalances({ [wallet.getAddress()]: 100 });
        node2.initializeBalances({ [wallet.getAddress()]: 100 });
        node3.initializeBalances({ [wallet.getAddress()]: 100 });

        const transaction = new Transaction(wallet, '0xRecipient', 10, 1, 1);
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
        blockchain.nonces = { [wallet.getAddress()]: 0 };

        const transaction = new Transaction(wallet, '0xRecipient', 10, 1, 1);
        await transaction.signTransaction();

        await p2pNetwork.onTransactionReceived(transaction, p2pNetwork);
        await new Promise(resolve => setTimeout(resolve, 500));

        expect(p2pNetwork.transactionPool.length).to.equal(1);
    });

    it('não deve adicionar uma transação inválida ao pool', async () => {
        const wallet = new Wallet();
        const transaction = new Transaction(wallet, '0xRecipient', 10, 1, 1);
        await p2pNetwork.onTransactionReceived(transaction, p2pNetwork);
        expect(p2pNetwork.transactionPool.length).to.equal(0);
    });

    it('deve minerar um bloco quando o pool de transações estiver cheio', async () => {
        const senderWallet = new Wallet();
        blockchain.nonces = { [senderWallet.getAddress()]: 0 };
        blockchain.initializeBalances({ [senderWallet.getAddress()]: 500 });
        
        const transaction1 = new Transaction(senderWallet, '0xRecipient', 5, 0.5, 1);
        await transaction1.signTransaction();

        await p2pNetwork.onTransactionReceived(transaction1, p2pNetwork);
        blockchain.p2pNetwork.transactionPool.push(...p2pNetwork.transactionPool);

        expect(blockchain.p2pNetwork.transactionPool.length).to.equal(1);

        const block = await blockchain.mine({ isTestMode: true });

        expect(blockchain.p2pNetwork.transactionPool.length).to.equal(0);
        expect(blockchain.chain.length).to.equal(2);
    });

    it('deve lidar com o recebimento de um bloco válido', async () => {
        const senderWallet = new Wallet();
        
        blockchain.difficulty = 1;
        blockchain.initializeBalances({ [senderWallet.getAddress()]: 500 });
        blockchain.ledger.nonces[senderWallet.getAddress()] = 0;
        
        const validTransaction = new Transaction(senderWallet, '0xRecipient', 10, 1, 1);
        await validTransaction.signTransaction();
        p2pNetwork.onTransactionReceived(validTransaction, p2pNetwork);
        
        const block = await blockchain.mine({ isTestMode: true });

        expect(block).to.not.be.undefined;
        expect(blockchain.chain.length).to.equal(2);
        expect(blockchain.latestBlock.hash).to.equal(block.hash);
    });

    it('não deve adicionar um bloco inválido', () => {
        const block = new Block(10, 'prevhash', Date.now(), [], 0, 'merkleRoot');
        p2pNetwork.onBlockReceived(block);
        expect(p2pNetwork.blockchain.chain.length).to.equal(1);
    });

    it('deve propagar blocos entre os nós', async function() {
        this.timeout(10000);
        
        const senderWallet = new Wallet();
        
        const p2pNode1 = new P2PNetwork(blockchain);
        const node2 = new P2PNetwork(new Blockchain());
        
        node2.blockchain.difficulty = 1;
        
        blockchain.difficulty = 1;
        blockchain.initializeBalances({ [senderWallet.getAddress()]: 100 });
        blockchain.ledger.setNonce(senderWallet.getAddress(), 0);
        
        const miningRewardAddress = blockchain.miningRewardWallet.getAddress();
        node2.blockchain.initializeBalances({ 
            [miningRewardAddress]: 500 
        });
        
        p2pNode1.connectToPeer(node2);
        
        node2.blockchain.ledger.setState(JSON.parse(JSON.stringify(blockchain.ledger.getState())));
        
        const tx = new Transaction(senderWallet, '0xRecipient', 10, 1, 1);
        await tx.signTransaction();
        
        await p2pNode1.onTransactionReceived(tx, p2pNode1);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const block = await blockchain.mine({ isTestMode: true });
        expect(block).to.not.be.undefined;
        
        p2pNode1.broadcastBlock(block);
        
        const startTime = Date.now();
        const timeout = 5000;
        
        while (node2.blockchain.chain.length < 2) {
            if (Date.now() - startTime > timeout) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        expect(node2.blockchain.chain.length).to.equal(2);
    });

    it('deve atualizar os saldos corretamente após a mineração de um bloco', async () => {
        const wallet1 = new Wallet();
        const wallet2 = new Wallet();
        blockchain.initializeBalances({
            [wallet1.getAddress()]: 100,
            [wallet2.getAddress()]: 50,
        });

        const transaction = new Transaction(wallet1, wallet2.getAddress(), 20, 5, 1);
        await transaction.signTransaction();
        await p2pNetwork.onTransactionReceived(transaction, p2pNetwork);
        blockchain.p2pNetwork.transactionPool.push(...p2pNetwork.transactionPool);

        await blockchain.mine({ isTestMode: true });

        expect(blockchain.getBalance(wallet1.getAddress())).to.equal(75);
        expect(blockchain.getBalance(wallet2.getAddress())).to.equal(70);
        expect(blockchain.getBalance(blockchain.miningRewardWallet.getAddress())).to.equal(1055);
    });

    it('deve rejeitar transações com saldo insuficiente', async () => {
        const wallet1 = new Wallet();
        const wallet2 = new Wallet();
        blockchain.nonces = { [wallet1.getAddress()]: 0 };
        blockchain.initializeBalances({
            [wallet1.getAddress()]: 10,
            [wallet2.getAddress()]: 0,
        });

        const transaction = new Transaction(wallet1, wallet2.getAddress(), 20, 1, 1);
        await transaction.signTransaction();
        await p2pNetwork.onTransactionReceived(transaction, p2pNetwork);

        expect(blockchain.isValidTransaction(transaction)).to.be.false;
        expect(p2pNetwork.transactionPool.length).to.equal(0);
    });
});