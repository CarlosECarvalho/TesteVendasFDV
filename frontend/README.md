# Frontend - Sistema de Gestão de Vendas (Next.js 16)

Módulo frontend da aplicação, desenvolvido com **Next.js 16 (App Router)**, **React 19**, **TypeScript** e **Tailwind CSS v4**.

---

## 🛠️ Tecnologias e Recursos

- **Next.js 16** com **App Router** (`src/app/` com rotas para cada tela)
- **React 19** com hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, `useContext`)
- **Tailwind CSS v4** com design responsivo
- **Tema Claro / Escuro (Dark Mode)** via `ThemeProvider` e persistência local
- **Biblioteca de Ícones**: `lucide-react`
- **Componentes UI Reutilizáveis**: `Button`, `Input`, `Card`, `Badge`, `Modal`, `ConfirmDialog`, `Toast`
- **Máscaras e Formatações**: CNPJ, Moeda BRL e Datas

---

## 🚀 Execução em Modo de Desenvolvimento

### 1. Instalar Dependências
```bash
npm install
```

### 2. Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```

Acesse em [http://localhost:3000](http://localhost:3000).

> **Observação**: Certifique-se de que a API backend está em execução na porta `5000` (ou configure a variável de ambiente `NEXT_PUBLIC_API_URL` caso utilize outra porta).

---

## 📦 Scripts Disponíveis

- `npm run dev`: Inicia o servidor local de desenvolvimento com hot-reload.
- `npm run build`: Compila a aplicação para produção (gera os arquivos estáticos e o build standalone).
- `npm run start`: Inicia o servidor Next.js em modo de produção.
- `npm run lint`: Executa a verificação estática do ESLint.

---

## 📂 Telas Implementadas

1. **Dashboard Inicial (`/`)**: Listagem dos pedidos, métricas e busca rápida com modal para início de venda.
2. **Novo Pedido (`/pedidos/novo`)**: Catálogo interativo de produtos com validação de estoque, carrinho e recálculo dinâmico do total. Permite carga do cenário com `?cenario=fgv`.
3. **Detalhamento do Pedido (`/pedidos/[id]`)**: Exibição completa dos dados da venda e impressão de comprovante.
4. **Catálogo de Produtos (`/produtos`)**: Cadastro de novos produtos e acompanhamento de estoque.
5. **Cadastro de Clientes (`/clientes`)**: Cadastro com máscara de CNPJ e listagem.

---

Para a documentação completa da solução fullstack e instruções do Docker Compose, consulte o [README.md principal da raiz do projeto](../README.md).

