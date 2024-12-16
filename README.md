# Aurelia Network

## Objetivo

Este projeto é uma implementação didática de uma blockchain básica, denominada Aurelia Network, criada como parte de uma atividade do programa de bolsas em **AWS Blockchain** e **Real Digital** pelo Compass UOL. O objetivo principal é demonstrar os conceitos fundamentais de uma blockchain de forma acessível e prática, incluindo a mineração de blocos com um sistema Proof-of-Work simplificado, a gestão de transações, a resolução de conflitos (forks) e a verificação da integridade da cadeia.

## Funcionalidades

*   **Criação do Bloco Gênesis:** A cadeia inicia com um bloco gênesis pré-definido.
*   **Adição de Transações:** Permite adicionar novas transações à memória (transaction pool), antes da mineração do próximo bloco.
*   **Mineração de Blocos:** Implementa um algoritmo Proof-of-Work (PoW) simplificado para adicionar novos blocos à cadeia. A dificuldade de mineração é configurável.
*   **Simulação de Rede P2P:** Simula uma rede P2P onde nós podem se conectar, transmitir transações e blocos, e resolver conflitos de cadeia (forks).
*   **Resolução de Forks:** Implementa um mecanismo básico de resolução de forks, priorizando a cadeia mais longa.
*   **Controle de Saldos:** Mantém o controle de saldos de endereços, atualizando-os após cada bloco minerado.
*   **Taxas de Transação:** Inclui taxas de transação como incentivo para os mineradores.
*   **Recompensa ao Minerador:** O minerador que resolve o PoW recebe uma recompensa em tokens. A recompensa sofre *halving* (redução pela metade) a cada intervalo definido de blocos.
*   **Validação da Cadeia:** Verifica a integridade da blockchain, assegurando que nenhum bloco tenha sido adulterado. Inclui verificação de hashes e assinaturas digitais.
*   **Histórico de Endereços:** Permite consultar o histórico de transações de um endereço específico.
*   **Merkle Tree:** Utiliza uma Merkle Tree para calcular o `merkleRoot` e melhorar a eficiência na validação de blocos com muitas transações.
*   **Interface de Linha de Comando (CLI):** Uma interface amigável baseada em texto para interação com a blockchain.

## Tecnologias Utilizadas

*   **Node.js:** Ambiente de execução JavaScript.
*   **JavaScript:** Linguagem de programação principal.
*   **ethers.js:** Biblioteca para interação com carteiras e assinaturas digitais.
*   **crypto-js:** Biblioteca para funções criptográficas.
*   **Mocha e Chai:** Frameworks para testes unitários.

## Como Executar

1. **Pré-requisitos:** Certifique-se de ter o Node.js e o npm (Node Package Manager) instalados em seu sistema.

2. **Clone o Repositório:**

    ```bash
    git clone https://github.com/vasconcel/aurelia-network.git
    ```

3. **Instale as Dependências:**

    ```bash
    cd aurelia-network
    npm install
    ```

4. **Execute a Aplicação:**

    ```bash
    node index.js
    ```

    A CLI guiará você pelas opções disponíveis:

    *   **Adicionar transação:** Adiciona uma nova transação ao pool de transações.
    *   **Ver blockchain:** Exibe a blockchain atual.
    *   **Ver histórico do endereço:** Mostra o histórico de transações de um endereço.
    *   **Sair:** Encerra a aplicação.

5. **Execute os Testes:**
   ```bash
    npm test
