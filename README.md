# Sistema de Gestão de Vendas - Teste Técnico FGV

Projeto desenvolvido como solução para o **Teste Técnico de Desenvolvedor Fullstack da FGV Conhecimento**, atendendo integralmente a todos os requisitos técnicos, arquiteturais e de regras de negócio especificados na documentação.

---

## 🎯 Contexto da Aplicação e Cenário de Avaliação

Uma loja realiza vendas de produtos por meio de um sistema interno:
- **Cenário**: O cliente **João da Silva** deseja realizar uma compra de **2 monitores** e **1 teclado USB**.
- **Estoque inicial**: A loja possui **5 monitores** e **0 teclados USB**.
- **Regra de Estoque**: Para que um produto seja incluído no pedido, é obrigatório que a quantidade solicitada esteja disponível em estoque.
- **Flexibilidade**: O vendedor pode adicionar quantos produtos desejar, desde que estejam disponíveis.
- **Cálculo Dinâmico**: O sistema recalcula automaticamente o valor total do pedido em tempo real sempre que um item for incluído, removido ou quando houver alteração na quantidade ou no preço unitário.
- **Tratamento de Exceções & Ações Críticas**: Mensagens informativas claras para o usuário, confirmações em ações críticas (ex: confirmação antes de concluir a venda ou remover itens) e confirmação de sucesso/falha de cada operação.

---

## 🏛️ Arquitetura da Solução

### Backend: ASP.NET Core & Dapper
- **Framework**: ASP.NET Core (.NET 8 ou superior).
- **Padrão Arquitetural**: Arquitetura em Camadas bem definidas:
  - `Controllers/`: Endpoints RESTful com verbos HTTP semânticos (`GET`, `POST`), códigos de status adequados (`200`, `201`, `400`, `404`, `409`, `500`) e validação de DTOs via DataAnnotations.
  - `Services/`: Camada de regras de negócio, validação rigorosa de disponibilidade de estoque, validação de duplicidade de CNPJ e cálculo de totais.
  - `Repositories/`: Camada de persistência utilizando **Dapper**, com queries SQL parametrizadas e **transações atômicas ACID** (`SqlTransaction`) para inserção do pedido, itens e atualização do estoque simultaneamente.
  - `Models/`: Entidades de domínio mapeadas diretamente das tabelas do SQL Server.
  - `DTOs/`: Objetos de transferência de dados desacoplados para entrada e saída.
  - `Infrastructure/`: 
    - `DbConnectionFactory`: Fábrica de conexões SQL Server.
    - `DatabaseInitializer`: Inicializador automático que cria o banco `VendasDB`, as 4 tabelas com suas constraints e a carga inicial de dados (Seed).
    - `ExceptionMiddleware`: Middleware global de captura de exceções no padrão RFC 7807 (ProblemDetails).
- **Documentação Interativa**: Swagger / OpenAPI integrado em `/swagger`.

### Frontend: Next.js (App Router) & Tailwind CSS
- **Framework**: Next.js (com **App Router**, onde cada tela é uma rota única).
- **Estilização**: Tailwind CSS com layout responsivo, moderno e de alto contraste.
- **Gerenciamento de Estado**: Hooks nativos do React (`useState`, `useEffect`, `useCallback`, `useMemo`, `useContext`) garantindo reatividade instantânea na interface.
- **Componentes Reutilizáveis**:
  - `Button`: Variações (primary, secondary, outline, danger, success), tamanhos e suporte a loading state.
  - `Input`: Com rótulo, mensagens de erro, ícones e acessibilidade.
  - `Modal`: Janelas modais com backdrop blur, navegação por teclado (ESC) e transições.
  - `ConfirmDialog`: Modal especializado para confirmações em ações críticas.
  - `ToastProvider / useToast`: Notificações flutuantes animadas (sucesso, erro, alerta e informativo).
  - `Badge`, `Card`, `Navbar`.
- **Camada de Network Reutilizável**: Módulo centralizado `api.ts` com tipagem TypeScript e captura de erros da API.
- **Máscaras de Formatação**:
  - CNPJ: `00.000.000/0000-00`
  - Moeda: Real Brasileiro (`R$ 1.200,00`)
  - Datas: `dd/MM/yyyy às HH:mm`

---

## 🗄️ Modelagem do Banco de Dados (SQL Server)

Tabelas modeladas estritamente de acordo com o diagrama da documentação:

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

- **Chaves Primárias**: `PK_Cliente`, `PK_Produto`, `PK_Pedido`, e chave primária composta `PK_ItensPedido (CodPedido, CodProduto)`.
- **Chaves Estrangeiras**: `FK_Pedido_Cliente`, `FK_ItensPedido_Pedido`, `FK_ItensPedido_Produto`.
- **Restrição de Unicidade**: `UQ_Cliente_CNPJ` garantindo que o campo `CNPJ` da tabela `Cliente` seja único.

---

## 🖥️ As 5 Telas Principais do Sistema

| # | Rota | Tela | Funcionalidades |
|---|------|------|-----------------|
| 1 | `/` | **Tela Inicial** | Listagem de todos os pedidos criados; Filtros combinados por data inicial/final e nome/CNPJ do cliente; Métricas de faturamento e itens; Modal de criação com busca por CNPJ de cliente pré-cadastrado. |
| 2 | `/pedidos/novo` | **Tela de Pedido** | Identificação do cliente; Catálogo completo de produtos com status de estoque em tempo real; Validação impeditiva de inclusão caso sem estoque; Carrinho com alteração de quantidade e preço unitário; **Valor total visível e recalculado instantaneamente**; Diálogo de confirmação para finalização. |
| 3 | `/pedidos/[id]` | **Detalhamento do Pedido** | Exibição de todos os dados do pedido (código, data, dados cadastrais do cliente, itens com quantidades, valores unitários e subtotais, valor total final); Opção de impressão do comprovante. |
| 4 | `/produtos` | **Cadastro de Produtos** | Formulário para inclusão de novos produtos (Nome, Preço e Estoque inicial); Grid com catálogo atual e alertas de estoque baixo ou esgotado. |
| 5 | `/clientes` | **Cadastro de Clientes** | Formulário com máscara de CNPJ (`00.000.000/0000-00`), Nome e E-mail; Validação contra CNPJs duplicados; Listagem dos clientes cadastrados e atalho para iniciar pedido. |

---

## 🚀 Como Executar a Aplicação

### Pré-requisitos
- [.NET 8 ou .NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js (LTS v20+ ou v24+)](https://nodejs.org/) e npm
- [SQL Server](https://www.microsoft.com/sql-server) (pode ser o **SQL Server Express LocalDB** nativo do Windows ou **Docker**)

---

### Opção A: Execução Local com SQL Server LocalDB (Padrão Windows)

O projeto está configurado para utilizar a instância `(localdb)\mssqllocaldb` do Windows. Ao iniciar a API, o banco de dados `VendasDB`, suas tabelas e o seed inicial com o cenário de teste são **criados automaticamente**.

#### 1. Iniciar o Backend (API)
```bash
# Navegar até a pasta da API
cd backend/src/VendasApi

# Restaurar dependências e executar
dotnet run
```
- A API estará disponível em: `http://localhost:5000`
- Documentação Swagger: `http://localhost:5000/swagger`

#### 2. Iniciar o Frontend (Next.js)
Abra outro terminal:
```bash
# Navegar até a pasta do frontend
cd frontend

# Instalar as dependências (se ainda não tiver feito)
npm install

# Iniciar em modo de desenvolvimento
npm run dev
```
- A aplicação estará acessível em: `http://localhost:3000`

---

### Opção B: Execução com Docker Compose (SQL Server Containerizado)

Caso prefira executar o SQL Server em container Docker:

```bash
# Na raiz do projeto, suba o container do SQL Server 2022
docker compose up -d
```

Em seguida, execute a API apontando para a string `DockerConnection` (ou altere no `appsettings.json`):
```bash
cd backend/src/VendasApi
dotnet run --launch-profile http
```

---

## 🧪 Roteiro de Validação do Cenário do Teste

Para validar os requisitos propostos na documentação:

1. Acesse `http://localhost:3000`.
2. Na **Tela Inicial**, clique em **"Novo Pedido"**.
3. No modal que se abrir:
   - Clique em **"Usar João da Silva"** (preenche o CNPJ `12.345.678/0001-90`) e clique em **"Buscar"**.
   - O sistema confirma os dados do cliente e libera o botão **"Avançar para o Pedido"**.
4. Na **Tela de Pedido (`/pedidos/novo`)**:
   - Observe o catálogo de produtos:
     - **Monitor LED 27" Full HD**: Estoque: 5 | Preço: R$ 1.200,00
     - **Teclado USB Mecânico**: Estoque: 0 (Badge vermelho "Sem Estoque")
   - **Tentativa de adicionar o Teclado USB**:
     - O botão está desabilitado e marcado como "Indisponível". Caso forçado, o sistema exibe notificação de erro informando que o produto está esgotado.
   - **Adição dos 2 Monitores**:
     - Selecione quantidade **2** no Monitor e clique em **"Adicionar"**.
     - O item é incluído no carrinho e o **Valor Total do Pedido é recalculado imediatamente para R$ 2.400,00**.
   - **Alteração de Valores**:
     - Altere o preço unitário ou a quantidade no carrinho e observe o valor total sendo recalculado em tempo real.
   - **Finalização**:
     - Clique em **"Finalizar e Emitir Pedido"**.
     - Um diálogo crítico solicita confirmação da venda.
     - Ao confirmar, o pedido é salvo com sucesso e você é redirecionado para a **Tela de Detalhamento (`/pedidos/1`)**.
   - **Validação do Estoque**:
     - Ao retornar à tela de novo pedido ou na tela de Produtos, o estoque do Monitor foi reduzido automaticamente para **3 unidades**.

---

## 📋 Checklist de Conformidade com o Edital FGV

| Requisito | Status | Implementação |
|---|:---:|---|
| **ASP.NET Core 8 ou superior** | ✅ Concluído | Desenvolvido com ASP.NET Core (.NET 10 / .NET 8) |
| **Padrão RESTful** | ✅ Concluído | Rotas `/api/pedidos`, `/api/clientes`, `/api/produtos` com verbos e status HTTP semânticos |
| **Arquitetura em Camadas** | ✅ Concluído | Pastas organizadas: `Controllers`, `Services`, `Repositories`, `Models`, `DTOs` |
| **Banco SQL Server + Dapper** | ✅ Concluído | Dapper com queries tipadas, mapeamento limpo e transações atômicas |
| **Modelagem com PKs, FKs e CNPJ Único** | ✅ Concluído | Chaves primárias e estrangeiras criadas; Constraint `UQ_Cliente_CNPJ` aplicada |
| **Next.js com App Router** | ✅ Concluído | Next.js utilizando a estrutura `src/app` com rotas únicas para cada tela |
| **5 Telas Principais** | ✅ Concluído | Tela Inicial (`/`), Pedido (`/pedidos/novo`), Detalhe (`/pedidos/[id]`), Produtos (`/produtos`), Clientes (`/clientes`) |
| **Gerenciamento de Estado por Hooks** | ✅ Concluído | Reatividade via `useState`, `useEffect`, `useCallback`, `useMemo`, `useContext` |
| **Componentes Reutilizáveis** | ✅ Concluído | `Button`, `Input`, `Modal`, `Card`, `Badge`, `ConfirmDialog`, `Toast` |
| **Tailwind CSS** | ✅ Concluído | Estilização completa, moderna, limpa e responsiva |
| **Camada de Network Reutilizável** | ✅ Concluído | Módulo `api.ts` com interceptor de erros RFC 7807 |
| **Máscaras de Formatação** | ✅ Concluído | Módulo `masks.ts` aplicando máscara de CNPJ, moeda R$ e datas |
| **Tratamento de Erros e Confirmações Críticas** | ✅ Concluído | Sistema de Toast com mensagens informativas e Modais de Confirmação para ações críticas |

---

## 👨‍💻 Autor
Desenvolvido com excelência técnica para o Teste FGV Conhecimento.

