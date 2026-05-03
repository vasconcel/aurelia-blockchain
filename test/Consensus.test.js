import { expect } from 'chai';
import { Consensus } from '../src/Consensus.js';
import { Ledger } from '../src/Ledger.js';
import { Block } from '../src/Block.js';
import { Transaction } from '../src/Transaction.js';
import { Wallet } from '../src/Wallet.js';

describe('Consensus (Red Team Tests)', () => {
    let ledger;
    let wallet;
    let senderWallet;

    beforeEach(() => {
        senderWallet = new Wallet();
        ledger = new Ledger({
            [senderWallet.getAddress()]: 100
        });
        ledger.setNonce(senderWallet.getAddress(), 0);
    });

    describe('Transaction Validation', () => {
        it('deve rejeitar transação onde amount + fee excede o saldo do sender', async () => {
            const tx = new Transaction(senderWallet, '0xRecipient', 50, 60, 1);
            await tx.signTransaction();
            
            const isValid = Consensus.validateTransaction(tx, ledger);
            expect(isValid).to.be.false;
        });

        it('deve rejeitar transação com nonce fora de ordem (saltos)', async () => {
            ledger.setNonce(senderWallet.getAddress(), 0);
            
            const tx = new Transaction(senderWallet, '0xRecipient', 10, 1, 3);
            await tx.signTransaction();
            
            const isValid = Consensus.validateTransaction(tx, ledger);
            expect(isValid).to.be.false;
        });

        it('deve rechazar transação senderWallet indefinido', () => {
            const fakeTx = {
                senderWallet: undefined,
                recipient: '0xRecipient',
                amount: 10,
                fee: 1,
                nonce: 1
            };
            
            const isValid = Consensus.validateTransaction(fakeTx, ledger);
            expect(isValid).to.be.false;
        });

        it('deve aceitar transação com nonce sequencial correto', async () => {
            const tx = new Transaction(senderWallet, '0xRecipient', 10, 1, 1);
            await tx.signTransaction();
            
            const isValid = Consensus.validateTransaction(tx, ledger);
            expect(isValid).to.be.true;
        });
    });

    describe('Block Validation', () => {
        it('deve rechazar bloco se Merkle Root foi adulterado mas hash parece válido', async () => {
            const wallet1 = new Wallet();
            const tx = new Transaction(wallet1, '0xRecipient', 10, 1, 1);
            await tx.signTransaction();
            
            const previousBlock = Block.getGenesis();
            const block = new Block(
                1,
                previousBlock.hash,
                Date.now(),
                [tx],
                0,
                'tampered_merkle_root_not_real_hash',
                1
            );
            
            const options = { difficulty: 1, maxTimestampDiff: 15 * 60 * 1000 };
            const isValid = Consensus.validateBlock(block, previousBlock, options);
            expect(isValid).to.be.false;
        });

        it('deve rechazar bloco com índice inválido', () => {
            const previousBlock = Block.getGenesis();
            const block = new Block(
                5,
                previousBlock.hash,
                Date.now(),
                [],
                0,
                null,
                1
            );
            
            const options = { difficulty: 1, maxTimestampDiff: 15 * 60 * 1000 };
            const isValid = Consensus.validateBlock(block, previousBlock, options);
            expect(isValid).to.be.false;
        });

        it('deve rechazar bloco com previousHash incorreto', () => {
            const previousBlock = Block.getGenesis();
            const block = new Block(
                previousBlock.index + 1,
                'invalid_previous_hash',
                Date.now(),
                [],
                0,
                null,
                1
            );
            
            const options = { difficulty: 1, maxTimestampDiff: 15 * 60 * 1000 };
            const isValid = Consensus.validateBlock(block, previousBlock, options);
            expect(isValid).to.be.false;
        });

        it('deve rechazar bloco com hash que não atende a dificuldade', () => {
            const previousBlock = Block.getGenesis();
            const block = new Block(
                1,
                previousBlock.hash,
                Date.now(),
                [],
                0,
                null,
                4
            );
            
            const options = { difficulty: 4, maxTimestampDiff: 15 * 60 * 1000 };
            const isValid = Consensus.validateBlock(block, previousBlock, options);
            expect(isValid).to.be.false;
        });
    });

    describe('Hash Difficulty Validation', () => {
        it('deve rechazar hash que não atende dificuldade mínima', () => {
            const invalidHash = 'ffff123456789012345678901234567890123456789012345678901234567890';
            const result = Consensus.validateHashDifficulty(invalidHash, 4);
            expect(result).to.be.false;
        });

        it('deve aceptar hash que atender dificuldade mínima', () => {
            const validHash = '0000123456789012345678901234567890123456789012345678901234567890';
            const result = Consensus.validateHashDifficulty(validHash, 4);
            expect(result).to.be.true;
        });

        it('deve rechazar hash indefinido', () => {
            const result = Consensus.validateHashDifficulty(undefined, 4);
            expect(result).to.be.false;
        });
    });

    describe('Ledger Simulation', () => {
        it('deve atualizar saldo simulado corretamente durante validação', async () => {
            const tx = new Transaction(senderWallet, '0xRecipient', 30, 5, 1);
            await tx.signTransaction();
            
            const simulatedLedger = new Ledger({});
            simulatedLedger.setState(ledger.getState());
            
            const isValid = Consensus.validateTransaction(tx, ledger, { simulatedLedger });
            expect(isValid).to.be.true;
            expect(simulatedLedger.getBalance(senderWallet.getAddress())).to.equal(65);
        });
    });
});