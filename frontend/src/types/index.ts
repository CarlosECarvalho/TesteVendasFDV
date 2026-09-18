export interface Cliente {
  codCliente: number;
  cnpj: string;
  nome: string;
  email: string;
  dataCadastro: string;
}

export interface CreateClienteInput {
  cnpj: string;
  nome: string;
  email: string;
}

export interface Produto {
  codProduto: number;
  nome: string;
  preco: number;
  estoque: number;
}

export interface CreateProdutoInput {
  nome: string;
  preco: number;
  estoque: number;
}

export interface ItemPedidoDetalhe {
  codPedido: number;
  codProduto: number;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface PedidoDetalhe {
  codPedido: number;
  dataPedido: string;
  valorTotal: number;
  cliente: Cliente;
  itens: ItemPedidoDetalhe[];
}

export interface PedidoResumo {
  codPedido: number;
  dataPedido: string;
  valorTotal: number;
  codCliente: number;
  nomeCliente: string;
  cnpjCliente: string;
  totalItens: number;
}

export interface CreatePedidoItemInput {
  codProduto: number;
  quantidade: number;
  precoUnitario?: number;
}

export interface CreatePedidoInput {
  codCliente: number;
  itens: CreatePedidoItemInput[];
}

export interface PedidoFiltro {
  dataInicio?: string;
  dataFim?: string;
  cliente?: string;
}

export interface ApiErrorResponse {
  status: number;
  title: string;
  detail: string;
  timestamp?: string;
}

