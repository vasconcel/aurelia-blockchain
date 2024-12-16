# Relatório

## Introdução

O presente relatório tem como objetivo apresentar de forma detalhada as implementações realizadas no projeto Aurelia Network, uma simulação de rede blockchain desenvolvida como atividade final do estágio em AWS Blockchain e Real Digital. O projeto visa simular os principais aspectos de uma blockchain, incluindo a propagação de blocos e transações em uma rede P2P simulada, a resolução de conflitos (forks), o controle de saldos de endereços, a aplicação de taxas de transação e a distribuição de recompensas para os mineradores.

## Metodologia

O desenvolvimento da Aurelia Network foi baseado em uma abordagem iterativa e incremental, com foco na construção de uma base sólida para cada funcionalidade. A linguagem de programação JavaScript foi utilizada, em conjunto com as bibliotecas `ethers` (para criptografia e manipulação de carteiras), `crypto-js` (para funções de hash) e ferramentas de teste como `Mocha` e `Chai`.

A colaboração com o modelo de linguagem Gemini foi um componente chave na metodologia adotada. O modelo foi utilizado como uma ferramenta de suporte técnico, auxiliando na concepção de algoritmos, na identificação de erros, na otimização de código e na validação das implementações. Essa colaboração permitiu um desenvolvimento mais ágil e eficiente, acelerando o processo de aprendizado e a resolução de problemas complexos.

## Implementações e Resultados

As implementações realizadas no projeto Aurelia Network são descritas a seguir, agrupadas por funcionalidade:

### 1. Simulação de Rede P2P (P2PNetwork.js)

A simulação da rede P2P é o alicerce do projeto, responsável por emular a comunicação entre os nós. A classe `P2PNetwork` foi desenvolvida para gerenciar essa comunicação, com métodos que simulam a conexão entre nós (`connectToPeer`), a transmissão de transações (`broadcastTransaction`), a transmissão de blocos (`broadcastBlock`) e o recebimento de transações e blocos (`onTransactionReceived` e `onBlockReceived`). A comunicação é simulada através de uma lista de nós (`nodes`) e chamadas diretas de métodos entre esses nós. As transações recebidas são validadas e, se forem consideradas válidas, são adicionadas a um pool de transações (`transactionPool`). Quando esse pool atinge um tamanho pré-determinado (neste caso, duas transações), o nó inicia o processo de mineração, reunindo as transações do pool em um novo bloco.

### 2. Resolução de Forks (P2PNetwork.js)

Na Aurelia Network, a lógica de resolução de forks é acionada quando um nó recebe um novo bloco (`onBlockReceived`). O nó verifica se o bloco recebido é válido, comparando seu índice com o índice do bloco mais recente na sua própria cadeia. Se o bloco recebido for válido e tiver um índice maior, ele é adicionado à cadeia. Em caso de forks de mesmo nível (blocos com o mesmo índice), a prioridade é dada ao bloco recebido primeiro, considerando o timestamp, e em caso de empate, o hash do bloco. A função `requestMissingBlocks` é um placeholder para uma funcionalidade futura de sincronização com a rede, solicitando blocos ausentes.

### 3. Controle de Saldos e Transações Válidas (Blockchain.js)

O controle de saldos é implementado através de um mapa (`balances`) na classe `Blockchain`, que armazena o saldo atual de cada endereço. A função `updateBalances` atualiza os saldos após a mineração de cada bloco, debitando os valores das transações dos remetentes e creditando-os aos destinatários. A função `isValidTransaction` verifica se o remetente possui saldo suficiente para cobrir o valor da transação e a taxa associada, garantindo que apenas transações válidas sejam incluídas na blockchain.

### 4. Taxas de Transação e Recompensas (Blockchain.js)

Cada transação na Aurelia Network inclui uma taxa (`fee`), que serve como um incentivo para os mineradores. A recompensa por bloco (`blockReward`) é fixa e reduzida pela metade a cada `halvingInterval` blocos, simulando o mecanismo de halving do Bitcoin. Ao minerar um bloco, o minerador recebe a soma das taxas de todas as transações incluídas no bloco, além da recompensa fixa. Isso é implementado através de uma transação especial adicionada ao bloco, onde o remetente é a carteira de recompensas de mineração (`miningRewardWallet`) e o destinatário é o endereço do minerador.

### 5. Testes Unitários (P2PNetwork.test.js)

Para garantir a robustez e a confiabilidade das implementações, foram desenvolvidos testes unitários utilizando as bibliotecas `Mocha` e `Chai`. Os testes cobrem as principais funcionalidades do projeto, incluindo a conexão entre nós, a transmissão e o recebimento de transações e blocos, a mineração e a resolução de forks. A execução bem-sucedida dos testes, que podem ser verificados pelo comando `npm test` no terminal, indica que a rede está funcionando conforme o esperado e os requisitos do projeto foram atendidos.

## Desafios e Soluções

Durante o desenvolvimento da Aurelia Network, alguns desafios técnicos foram encontrados:

*   **Assinatura de Transações:** Dificuldades iniciais no uso da biblioteca `ethers` para assinar transações foram superadas através da compreensão do fluxo de promises e do tratamento adequado dos tipos de dados.
*   **Ambiente de Testes:** A necessidade de simular um ambiente de navegador para os testes foi resolvida com a utilização das ferramentas `browserify` e `@peculiar/webcrypto`.
*   **Lógica de Mineração e Validação:** A lógica de mineração e validação de blocos foi refatorada e otimizada com o auxílio do modelo Gemini, resultando em um código mais limpo e eficiente.
*   **Duplicação de Inputs no CLI:** A duplicação de inputs no CLI foi corrigida centralizando a criação da instância do `readline` em `index.js` e passando-a como parâmetro para as funções em `ui.js`.

## Próximos Passos

O projeto Aurelia Network, em seu estado atual, fornece uma simulação funcional dos principais aspectos de uma blockchain. No entanto, existem diversas oportunidades de expansão e aprimoramento. Dentre elas, destacam-se:

*   **Interface Gráfica (Frontend):** O desenvolvimento de uma interface gráfica amigável, utilizando tecnologias web como React ou Vue.js, tornaria a interação com a Aurelia Network mais intuitiva e acessível para os usuários. Isso permitiria a visualização da blockchain em tempo real, a criação e o envio de transações de forma simplificada, além do acompanhamento do saldo das carteiras.
*   **CLI Robusto:** Aprimorar a interface de linha de comando (CLI) atual para suportar uma gama maior de comandos e opções. Isso poderia incluir comandos para gerenciar carteiras, interagir com contratos inteligentes (caso sejam implementados) e obter informações detalhadas sobre a rede e suas transações. Um framework como o Commander.js ou o Yargs poderia ser usado para facilitar o desenvolvimento de um CLI mais robusto.
*   **Implementação de Contratos Inteligentes:** Adicionar a funcionalidade de contratos inteligentes à Aurelia Network, permitindo a criação e execução de código autoexecutável na blockchain. Isso abriria um leque de possibilidades para a criação de aplicações descentralizadas (dApps) na plataforma.
*   **Mecanismo de Consenso Avançado:** Explorar e implementar mecanismos de consenso mais complexos e eficientes, como Proof-of-Stake (PoS) ou Delegated Proof-of-Stake (DPoS), como alternativa ao Proof-of-Work (PoW) atualmente simulado.
*   **Aprimoramento da Simulação P2P:** Tornar a simulação da rede P2P mais realista, introduzindo elementos como latência de rede, nós maliciosos e falhas de comunicação.
*   **Integração com o Real Digital:** Explorar a integração da Aurelia Network com o Real Digital, a moeda digital do Banco Central do Brasil, criando uma ponte entre a simulação e o ecossistema financeiro real.

## Conclusão

O projeto Aurelia Network tem como objetivo simular os principais componentes de uma blockchain em um ambiente controlado. As implementações de propagação de blocos e transações, resolução de forks, controle de saldos, taxas de transação e recompensas de mineração foram realizadas com sucesso.

A colaboração com o modelo de linguagem Gemini foi um fator crucial para o sucesso do projeto. O modelo forneceu suporte técnico, acelerando o desenvolvimento e contribuindo para a qualidade das implementações.

Em resumo, a Aurelia Network representa uma simulação funcional de uma blockchain, construída com base nos requisitos do projeto de estágio em AWS Blockchain e Real Digital. O projeto serve como uma base para a compreensão prática dos mecanismos de uma blockchain e abre caminho para futuras expansões e aprimoramentos.
