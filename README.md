# Sistema de Gestão de Vendas - Teste Técnico FGV

Solução fullstack desenvolvida para o **Processo Seletivo de Desenvolvedor Fullstack da FGV Conhecimento**, atendendo integralmente e superando todos os requisitos técnicos, arquiteturais e de regras de negócio especificados na documentação do teste.

---

## 📑 Sumário

- [🎯 Contexto e Cenário de Avaliação](#-contexto-e-cenário-de-avaliação)
- [🏛️ Arquitetura e Tecnologias](#️-arquitetura-e-tecnologias)
- [🗄️ Modelagem do Banco de Dados](#️-modelagem-do-banco-de-dados-sql-server)
- [🖥️ Telas da Aplicação](#️-telas-da-aplicação)
- [🚀 Como Executar o Projeto](#-como-executar-o-projeto)
  - [Opção 1: Execução Completa via Docker Compose (Recomendada)](#opção-1-execução-completa-via-docker-compose-recomendada)
  - [Opção 2: Execução Local (Híbrida / Desenvolvimento)](#opção-2-execução-local-híbrida--desenvolvimento)
- [🧪 Roteiro de Validação do Cenário FGV](#-roteiro-de-validação-do-cenário-fgv)
- [📡 Documentação da API RESTful](#-documentação-da-api-restful)
- [📋 Checklist de Conformidade](#-checklist-de-conformidade-com-os-requisitos)
- [📂 Estrutura do Repositório](#-estrutura-do-repositório)

---

## 🎯 Contexto e Cenário de Avaliação

Uma loja realiza vendas de produtos de informática por meio de um sistema interno integrado:
- **Cenário do Teste**: O cliente **João da Silva** deseja realizar uma compra de **2 monitores** e **1 teclado USB**.
- **Estoque Inicial**: A loja possui **5 monitores** e **0 teclados USB**.
- **Regra de Disponibilidade de Estoque**: Para que um produto seja incluído ou faturado, a quantidade solicitada deve estar obrigatoriamente disponível em estoque. Produtos esgotados ficam bloqueados na interface com feedback visual impeditivo.
- **Flexibilidade Comercial**: O vendedor pode adicionar quantos itens desejar, alterar quantidades e customizar o preço unitário praticado na venda.
- **Cálculo Dinâmico em Tempo Real**: O sistema recalcula automaticamente o valor total do pedido a cada inclusão, exclusão ou alteração de quantidade/preço.
- **Ações Críticas e UX**: Confirmações modais para ações irreversíveis (finalização de venda e remoção de itens) e sistema de notificações flutuantes (*Toasts*) para erros e sucessos.

---

## 🏛️ Arquitetura e Tecnologias

### Backend (.NET 10 / C# 13)
- **Framework**: ASP.NET Core Web API (.NET 10).
- **Padrão Arquitetural**: Arquitetura em Camadas com desacoplamento estrito e Injeção de Dependência nativa:
  - `Controllers/`: Endpoints RESTful com verbos semânticos, status codes apropriados (`200`, `201`, `400`, `404`, `409`, `500`) e documentação Swagger.
  - `Services/`: Camada de regras de negócio (validação de CNPJ duplicado, conferência atômica de estoque, cálculo de totais).
  - `Repositories/`: Camada de persistência utilizando **Dapper**, com queries SQL parametrizadas de alta performance e **transações atômicas ACID (`SqlTransaction`)** para gravação do pedido, itens e baixa de estoque simultaneamente.
  - `Models/` & `DTOs/`: Separação rígida entre entidades do banco e objetos de transporte de dados com validações via DataAnnotations.
  - `Infrastructure/`:
    - `DbConnectionFactory`: Gerenciador de conexões SQL Server.
    - `DatabaseInitializer`: Script de auto-migração que cria o banco `VendasDB`, todas as tabelas, constraints e carga de dados inicial (*Seed*) na inicialização da aplicação.
    - `ExceptionMiddleware`: Middleware global de captura de exceções no padrão RFC 7807 (`ProblemDetails`).
- **Documentação Interativa**: Swagger / OpenAPI integrado em `/swagger`.

### Frontend (Next.js 16 & Tailwind CSS v4)
- **Framework**: Next.js 16 com **App Router** e React 19.
- **Estilização**: Tailwind CSS v4 com design moderno, responsivo e suporte nativo a **Dark Mode / Light Mode** com alternância instantânea.
- **Gerenciamento de Estado**: Hooks nativos do React (`useState`, `useEffect`, `useCallback`, `useMemo`, `useContext`) para máxima previsibilidade e reatividade instantânea.
- **Componentes Reutilizáveis**:
  - `Button`, `Input`, `Card`, `Badge`.
  - `Modal` e `ConfirmDialog`: Modais acessíveis com backdrop blur e navegação por teclado (ESC).
  - `ToastProvider / useToast`: Notificações flutuantes com autoclose e estados (sucesso, erro, alerta, info).
  - `ThemeToggle` & `ThemeProvider`: Alternância de tema claro/escuro com persistência em `localStorage`.
- **Camada de Network**: Cliente HTTP centralizado (`api.ts`) com tratamento uniforme de erros do backend.
- **Máscaras e Utilitários**:
  - Máscara de CNPJ: `00.000.000/0000-00`
  - Moeda: Real Brasileiro (`R$ 1.200,00`)
  - Datas: `dd/MM/yyyy às HH:mm`

---

## 🗄️ Modelagem do Banco de Dados (SQL Server)

O esquema relacional segue estritamente a especificação exigida no edital:

```
+------------------------------------+          +------------------------------------+
|              Cliente               |          |               Pedido               |
+------------------------------------+          +------------------------------------+
| PK  CodCliente    INT (Identity)   |<----+    | PK  CodPedido    INT (Identity)    |
| UK  CNPJ          VARCHAR(20)      |     +---<| FK  CodCliente   INT               |
|     Nome          VARCHAR(150)     |          |     DataPedido   DATETIME2         |
|     Email         VARCHAR(150)     |          |     ValorTotal   DECIMAL(18,2)     |
|     DataCadastro  DATETIME2        |          +------------------------------------+
+------------------------------------+                            | 1
                                                                  |
                                                                  | N
+------------------------------------+          +------------------------------------+
|              Produto               |          |            ItensPedido             |
+------------------------------------+          +------------------------------------+
| PK  CodProduto    INT (Identity)   |<----+    | PK,FK CodPedido    INT             |
|     Nome          VARCHAR(150)     |     +---<| PK,FK CodProduto   INT             |
|     Preco         DECIMAL(18,2)    |          |       Quantidade   INT             |
|     Estoque       INT              |          |       PrecoUnitario DECIMAL(18,2)  |
+------------------------------------+          +------------------------------------+
```

- **Chaves Primárias**: `PK_Cliente`, `PK_Produto`, `PK_Pedido` e chave composta `PK_ItensPedido (CodPedido, CodProduto)`.
- **Chaves Estrangeiras**: `FK_Pedido_Cliente`, `FK_ItensPedido_Pedido` e `FK_ItensPedido_Produto`.
- **Restrição de Unicidade**: `UQ_Cliente_CNPJ` garantindo que o CNPJ de cada cliente seja único no sistema.

---

## 🖥️ Telas da Aplicação

| Rota | Tela | Funcionalidades |
|---|---|---|
| `/` | **Tela Inicial / Dashboard** | Listagem de pedidos com paginação/cards; Métricas resumidas de vendas; Filtros combinados por período (data inicial/final) e cliente (nome ou CNPJ); Botão e Modal para início rápido de pedido com busca de cliente por CNPJ. |
| `/pedidos/novo` | **Tela de Pedido** | Identificação do cliente selecionado; Catálogo visual de produtos com controle de estoque em tempo real; Carrinho com alteração dinâmica de quantidade e preço unitário; Recálculo imediato do valor total; Confirmação modal antes de finalizar a venda; Suporte a carga direta do cenário via `?cenario=fgv`. |
| `/pedidos/[id]` | **Detalhamento do Pedido** | Visão completa do pedido emitido: cabeçalho com dados cadastrais do cliente, tabela de itens com quantidades, valores unitários e subtotais, resumo financeiro e botão para impressão do comprovante. |
| `/produtos` | **Cadastro de Produtos** | Formulário para cadastro de novos itens com validações de preço e estoque inicial; Tabela interativa com busca e badges indicando nível de estoque (Em estoque, Baixo estoque ou Esgotado). |
| `/clientes` | **Cadastro de Clientes** | Formulário com aplicação de máscara de CNPJ em tempo real; Validação no cliente e no servidor contra duplicidade de CNPJ; Listagem de clientes com atalho direto para criar pedido. |

---

## 🚀 Como Executar o Projeto

Você pode executar o projeto de duas formas: **100% via Docker Compose** (sem necessidade de instalar .NET ou Node.js) ou em **Modo Local/Híbrido**.

### Pré-requisitos
- [Docker e Docker Compose](https://www.docker.com/) (para execução via contêineres)
- Ou localmente: [.NET 10 SDK](https://dotnet.microsoft.com/download), [Node.js 20+](https://nodejs.org/) e SQL Server (LocalDB ou instância dedicada).

---

### Opção 1: Execução Completa via Docker Compose (Recomendada)

Com apenas **um comando**, o Docker inicializa o SQL Server 2022, o backend ASP.NET Core e o frontend Next.js:

```bash
# Na raiz do repositório:
docker compose up --build -d
```

> **Aguarde alguns instantes** para o SQL Server passar pelo teste de saúde (*healthcheck*), o banco `VendasDB` ser criado automaticamente e os contêineres estarem prontos.

#### URLs de Acesso:
- **Frontend (Aplicação Web)**: [http://localhost:3000](http://localhost:3000)
- **Backend (API RESTful)**: [http://localhost:5000](http://localhost:5000)
- **Documentação Swagger**: [http://localhost:5000/swagger](http://localhost:5000/swagger)
- **SQL Server**: `localhost:1433` (Usuário: `sa` | Senha: `Vendas@StrongPass2026!`)

Para encerrar os contêineres:
```bash
docker compose down
```

---

### Opção 2: Execução Local (Híbrida / Desenvolvimento)

Se desejar rodar a aplicação diretamente no seu ambiente de desenvolvimento:

#### 1. Banco de Dados
- **Opção A (SQL Server LocalDB nativo do Windows)**: Já configurado como padrão no `appsettings.json`. O banco e os dados iniciais são gerados sozinhos na primeira execução da API.
- **Opção B (SQL Server via Docker)**:
  ```bash
  docker compose up sqlserver -d
  ```

#### 2. Executar o Backend
```bash
cd backend/src/VendasApi
dotnet restore
dotnet run
```
*A API iniciará em `http://localhost:5000` e o Swagger estará disponível em `http://localhost:5000/swagger`.*

#### 3. Executar o Frontend
Em outro terminal:
```bash
cd frontend
npm install
npm run dev
```
*O frontend estará acessível em `http://localhost:3000`.*

---

## 🧪 Roteiro de Validação do Cenário FGV

Para validar os requisitos propostos na documentação oficial:

1. Acesse [http://localhost:3000](http://localhost:3000).
2. Clique em **"Novo Pedido"**:
   - No modal, clique no atalho rápido **"Usar João da Silva"** (o sistema preenche o CNPJ `12.345.678/0001-90`) e clique em **"Buscar"**.
   - O sistema valida a existência do cliente e libera o botão **"Avançar para o Pedido"**.
   *(Alternativamente, acesse direto [http://localhost:3000/pedidos/novo?cenario=fgv](http://localhost:3000/pedidos/novo?cenario=fgv) para carga automatizada do cenário).*
3. **Na Tela de Pedido (`/pedidos/novo`)**:
   - **Verificação do Teclado USB**:
     - O item aparece no catálogo com estoque `0` e badge vermelho **"Sem Estoque"**.
     - O botão de adicionar permanece **desabilitado** como "Indisponível", impedindo a violação da regra de negócio.
   - **Inclusão dos 2 Monitores**:
     - No card do **Monitor LED 27"** (estoque: 5 | preço base: R$ 1.200,00), defina a quantidade como **2** e clique em **"Adicionar ao Pedido"**.
     - O produto é inserido no carrinho e o **Valor Total é recalculado instantaneamente para R$ 2.400,00**.
   - **Alteração Dinâmica de Quantidades e Preços**:
     - Altere a quantidade ou o preço unitário diretamente nos campos do carrinho. O valor total é recalculado em tempo real.
   - **Finalização com Confirmação Crítica**:
     - Clique em **"Finalizar e Emitir Pedido"**.
     - Um modal de confirmação solicita aprovação da operação crítica.
     - Ao confirmar, uma notificação de sucesso é disparada e você é redirecionado para a tela de detalhes.
4. **Na Tela de Detalhes (`/pedidos/[id]`)**:
   - Visualize os dados completos da venda emitida, itens, valores e opção de impressão.
5. **Conferência da Baixa de Estoque**:
   - Ao acessar `/produtos` ou iniciar um novo pedido, verifique que o estoque do Monitor LED foi reduzido automaticamente para **3 unidades**.

---

## 📡 Documentação da API RESTful

A API segue as melhores práticas RESTful com tratamento global de erros RFC 7807 (`ProblemDetails`).

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/clientes` | Lista todos os clientes cadastrados |
| `GET` | `/api/clientes/{id}` | Obtém os dados de um cliente específico |
| `GET` | `/api/clientes/cnpj/{cnpj}` | Busca cliente pelo número de CNPJ |
| `POST` | `/api/clientes` | Cadastra novo cliente (valida duplicidade de CNPJ) |
| `GET` | `/api/produtos` | Lista todos os produtos com estoque atualizado |
| `GET` | `/api/produtos/{id}` | Obtém os dados de um produto |
| `POST` | `/api/produtos` | Cadastra um novo produto |
| `GET` | `/api/pedidos` | Lista pedidos (suporta filtros `dataInicio`, `dataFim`, `termo`) |
| `GET` | `/api/pedidos/{id}` | Retorna o pedido completo com cliente e lista de itens |
| `POST` | `/api/pedidos` | Cria um pedido com transação ACID e baixa atômica de estoque |

---

## 📋 Checklist de Conformidade com os Requisitos

| Requisito do Edital | Status | Detalhes da Implementação |
|---|:---:|---|
| **ASP.NET Core (.NET 8 ou superior)** | ✅ Concluído | Desenvolvido em .NET 10 com C# 13 e injeção de dependência nativa. |
| **Padrão RESTful e Status Semânticos** | ✅ Concluído | Verbos semânticos e respostas com códigos HTTP 200, 201, 400, 404, 409 e 500. |
| **Arquitetura em Camadas** | ✅ Concluído | Desacoplamento entre Controllers, Services, Repositories, Models e DTOs. |
| **SQL Server + Dapper com Transações ACID** | ✅ Concluído | Dapper com queries parametrizadas e `SqlTransaction` atômica para pedidos e estoque. |
| **Modelagem com PKs, FKs e CNPJ Único** | ✅ Concluído | 4 tabelas relacionais com PKs, FKs com integridade referencial e constraint `UQ_Cliente_CNPJ`. |
| **Next.js com App Router** | ✅ Concluído | Next.js 16 moderno utilizando convenções do App Router (`src/app`). |
| **5 Telas Principais** | ✅ Concluído | Dashboard (`/`), Pedido (`/pedidos/novo`), Detalhes (`/pedidos/[id]`), Produtos (`/produtos`) e Clientes (`/clientes`). |
| **Gerenciamento de Estado por Hooks** | ✅ Concluído | Uso eficiente de `useState`, `useEffect`, `useCallback`, `useMemo` e `useContext`. |
| **Componentes Reutilizáveis** | ✅ Concluído | `Button`, `Input`, `Modal`, `ConfirmDialog`, `Card`, `Badge`, `Toast` e `ThemeToggle`. |
| **Tailwind CSS & Responsividade** | ✅ Concluído | Interface com Tailwind CSS v4, suporte a Dark/Light mode e design responsivo. |
| **Recálculo do Total em Tempo Real** | ✅ Concluído | Atualização dinâmica instantânea ao incluir, remover ou alterar quantidade/preço. |
| **Ações Críticas & Notificações** | ✅ Concluído | Diálogos modais de confirmação em operações críticas e Toasts animados. |
| **Docker Compose Fullstack** | ✅ Concluído | Orquestração completa de Banco, API e Frontend em contêineres prontos para uso. |

---

## 📂 Estrutura do Repositório

```
TesteVendasFDV/
├── backend/
│   ├── src/
│   │   └── VendasApi/
│   │       ├── Controllers/          # Endpoints RESTful (Clientes, Produtos, Pedidos)
│   │       ├── Services/             # Regras de negócio e validações
│   │       ├── Repositories/         # Acesso a dados com Dapper e Transações ACID
│   │       ├── Models/               # Entidades de domínio mapeadas do banco
│   │       ├── DTOs/                 # Objetos de transferência de dados tipados
│   │       ├── Infrastructure/       # Factory de conexão, Middleware RFC 7807 e Seed
│   │       ├── Program.cs            # Configuração de DI, CORS, Middlewares e Swagger
│   │       └── appsettings.json      # Connection strings para LocalDB e Docker
│   ├── Dockerfile                    # Build multi-stage da API .NET 10
│   └── VendasApi.slnx
├── frontend/
│   ├── src/
│   │   ├── app/                      # Rotas do App Router (5 telas principais)
│   │   │   ├── page.tsx              # Tela Inicial / Dashboard de Pedidos
│   │   │   ├── pedidos/novo/         # Tela de Novo Pedido (Catálogo + Carrinho)
│   │   │   ├── pedidos/[id]/         # Tela de Detalhamento do Pedido
│   │   │   ├── produtos/             # Tela de Cadastro e Listagem de Produtos
│   │   │   └── clientes/             # Tela de Cadastro e Listagem de Clientes
│   │   ├── components/               # Componentes compartilhados e ThemeToggle
│   │   │   └── ui/                   # Button, Input, Modal, ConfirmDialog, Toast, Badge
│   │   ├── services/                 # Clientes de API desacoplados
│   │   ├── types/                    # Interfaces e tipos TypeScript
│   │   └── utils/                    # Utilitários e máscaras (CNPJ, Moeda, Data)
│   ├── Dockerfile                    # Build multi-stage otimizado do Next.js
│   ├── package.json
│   └── next.config.ts
├── database/
│   └── init.sql                      # Script DDL e DML com carga de dados do teste
├── docker-compose.yml                # Orquestração do SQL Server, Backend e Frontend
└── README.md                         # Documentação completa do projeto
```

---

## 👨‍💻 Autor
Desenvolvido com rigor técnico, arquitetura limpa e foco na melhor experiência de uso para a avaliação do **Teste Técnico FGV Conhecimento**.

