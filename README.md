# Aurelia Blockchain

## Objetivo

Este projeto é uma implementação didática e **simulada** de uma blockchain básica, denominada Aurelia Network, criada como parte de uma atividade do programa de bolsas em **AWS Blockchain** e **Real Digital** pelo Compass UOL. O objetivo principal é demonstrar os conceitos fundamentais de uma blockchain básica de forma acessível e prática, incluindo a mineração de blocos com um sistema Proof-of-Work (PoW) simplificado, a gestão de transações, a resolução de conflitos (forks) e a verificação da integridade da cadeia.

## Funcionalidades

*   **Criação do Bloco Gênesis:** A cadeia inicia com um bloco gênesis pré-definido.
*   **Adição de Transações:** Permite adicionar novas transações à memória (transaction pool), antes da mineração do próximo bloco.
*   **Mineração de Blocos:** Implementa um algoritmo Proof-of-Work (PoW) simplificado para adicionar novos blocos à cadeia. A dificuldade de mineração é configurável.
*   **Simulação de Rede P2P:** Simula uma rede P2P onde nós (instâncias da classe `Blockchain`) podem se conectar, transmitir transações e blocos, e resolver conflitos de cadeia (forks). A comunicação é simulada através da classe `P2PNetwork`, sem uso de WebSockets.
*   **Resolução de Forks:** Implementa um mecanismo básico de resolução de forks, priorizando a cadeia mais longa e, em caso de empate, a que possui o bloco com timestamp mais antigo.
*   **Controle de Saldos:** Mantém o controle de saldos de endereços (no mapa `balances` da classe `Blockchain`), atualizando-os após cada bloco minerado.
*   **Taxas de Transação:** Inclui taxas de transação como incentivo para os mineradores.
*   **Recompensa ao Minerador:** O minerador que resolve o PoW recebe uma recompensa em tokens (recompensa fixa + taxas de transação). A recompensa fixa sofre *halving* (redução pela metade) a cada `halvingInterval` blocos.
*   **Validação da Cadeia:** Verifica a integridade da blockchain, assegurando que nenhum bloco tenha sido adulterado. Inclui verificação de hashes (bloco anterior, hash atual calculado, hash da dificuldade), Merkle Root e assinaturas das transações.
*   **Histórico de Endereços:** Permite consultar o histórico de transações de um endereço específico (armazenado no mapa `transactionIndex` da classe `Blockchain`).
*   **Merkle Tree:** Utiliza uma Merkle Tree para calcular o `merkleRoot` e melhorar a eficiência na validação de blocos com muitas transações.
*   **Interface de Linha de Comando (CLI):** Uma interface amigável baseada em texto para interação com a blockchain.

## Tecnologias Utilizadas

*   **Node.js:** Ambiente de execução JavaScript.
*   **JavaScript:** Linguagem de programação principal.
*   **ethers.js:** Biblioteca para interação com carteiras e assinaturas digitais.
*   **crypto-js:** Biblioteca para funções criptográficas (SHA256).
*   **Mocha e Chai:** Frameworks para testes unitários.
*   **async-mutex:** Biblioteca para controle de concorrência na mineração.

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

    *   **1. Add transaction:** Adiciona uma nova transação ao pool de transações.
    *   **2. Mine:** Inicia a mineração de um novo bloco, incluindo as transações pendentes e a transação de recompensa.
    *   **3. View blockchain:** Exibe a blockchain atual.
    *   **4. View address history:** Mostra o histórico de transações de um endereço.
    *   **5. Exit:** Encerra a aplicação.

5. **Interagindo com a CLI:**

   Siga as instruções da CLI. Por exemplo, para adicionar uma transação, escolha a opção "1", insira o endereço do destinatário, o valor a ser transferido e a taxa de transação. Para minerar um bloco, escolha a opção "2".

6. **Execute os Testes:**

    ```bash
    npm test
    ```

    Os testes validam o funcionamento da blockchain em diversos cenários. A função `mineForTest` é utilizada internamente nos testes para simular a mineração com parâmetros controlados.

## Licença

Este repositório está licenciado sob a [MIT License](https://choosealicense.com/licenses/mit/).
