'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { clienteService } from '@/services/clienteService';
import { produtoService } from '@/services/produtoService';
import { pedidoService } from '@/services/pedidoService';
import { Cliente, Produto, CreatePedidoItemInput } from '@/types';
import { formatCurrency, maskCnpj } from '@/utils/masks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  User,
  Search,
  Package,
  ShoppingCart,
  Sparkles
} from 'lucide-react';

interface CartItem extends CreatePedidoItemInput {
  nome: string;
  estoqueMaximo: number;
  precoUnitario: number;
}

function NovoPedidoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const clienteIdParam = searchParams.get('clienteId');
  const cenarioParam = searchParams.get('cenario');

  // Estados principais
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantidadesSelecionadas, setQuantidadesSelecionadas] = useState<Record<number, number>>({});
  const [filtroProduto, setFiltroProduto] = useState('');

  // Estados de controle
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estados dos diálogos de confirmação (ações críticas)
  const [isConfirmFinalizarOpen, setIsConfirmFinalizarOpen] = useState(false);
  const [itemParaRemover, setItemParaRemover] = useState<CartItem | null>(null);

  // Carregar dados iniciais (produtos e clientes)
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [produtosData, clientesData] = await Promise.all([
          produtoService.getAll(),
          clienteService.getAll(),
        ]);
        setProdutos(produtosData);
        setClientes(clientesData);

        // Se veio o parâmetro do cenário de teste FGV (?cenario=fgv)
        if (cenarioParam === 'fgv') {
          const joao = clientesData.find((c) => c.cnpj.replace(/\D/g, '') === '12345678000190' || c.nome.toLowerCase().includes('joão da silva'));
          if (joao) {
            setSelectedCliente(joao);
          } else if (clienteIdParam) {
            const cli = clientesData.find((c) => c.codCliente === Number(clienteIdParam));
            if (cli) setSelectedCliente(cli);
          }

          const monitor = produtosData.find((p) => p.nome.toLowerCase().includes('monitor'));
          if (monitor) {
            setCart([
              {
                codProduto: monitor.codProduto,
                nome: monitor.nome,
                quantidade: 2,
                precoUnitario: monitor.preco,
                estoqueMaximo: monitor.estoque,
              },
            ]);
            setQuantidadesSelecionadas({
              [monitor.codProduto]: 2,
            });
          }

          toast.info(
            'Cenário do teste carregado automaticamente: João da Silva selecionado e 2 Monitores incluídos no pedido!',
            'Cenário FGV Ativado'
          );
        } else if (clienteIdParam) {
          const cli = clientesData.find((c) => c.codCliente === Number(clienteIdParam));
          if (cli) setSelectedCliente(cli);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao carregar dados do catálogo.';
        toast.error(msg, 'Erro de Carregamento');
      } finally {
        setLoading(false);
      }
    }

    loadData();
    
  }, [clienteIdParam, cenarioParam, toast]);

  // Produtos filtrados por busca
  const produtosFiltrados = useMemo(() => {
    if (!filtroProduto.trim()) return produtos;
    const term = filtroProduto.toLowerCase();
    return produtos.filter((p) => p.nome.toLowerCase().includes(term));
  }, [produtos, filtroProduto]);

  // Cálculo dinâmico e em tempo real do Valor Total do Pedido
  const valorTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0);
  }, [cart]);

  const totalItensNoCarrinho = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantidade, 0);
  }, [cart]);

  // Handler para atualizar a quantidade pré-selecionada no catálogo
  const setQtdCatalogo = (codProduto: number, val: number) => {
    setQuantidadesSelecionadas((prev) => ({
      ...prev,
      [codProduto]: Math.max(1, val),
    }));
  };

  // Handler para pré-carregar o cenário de teste oficial do Edital FGV
  const handleCarregarCenarioTeste = () => {
    // 1. Localizar João da Silva
    const joao = clientes.find((c) => c.cnpj.replace(/\D/g, '') === '12345678000190' || c.nome.toLowerCase().includes('joão da silva'));
    if (joao) {
      setSelectedCliente(joao);
    }

    // 2. Localizar Monitor (5 em estoque)
    const monitor = produtos.find((p) => p.nome.toLowerCase().includes('monitor'));

    if (monitor) {
      setCart([
        {
          codProduto: monitor.codProduto,
          nome: monitor.nome,
          quantidade: 2,
          precoUnitario: monitor.preco,
          estoqueMaximo: monitor.estoque,
        },
      ]);
      setQuantidadesSelecionadas((prev) => ({
        ...prev,
        [monitor.codProduto]: 2,
      }));
    }

    toast.info(
      'Cenário do teste carregado: Cliente João da Silva selecionado e 2 Monitores adicionados. Observe que o Teclado possui estoque 0.',
      'Cenário FGV Carregado'
    );
  };

  // Adicionar produto ao pedido com validação rigorosa de estoque
  const handleAdicionarProduto = (produto: Produto) => {
    const qtdDesejada = quantidadesSelecionadas[produto.codProduto] || 1;

    // Regra do Teste: Para que um produto seja incluído no pedido, é necessário que a quantidade solicitada esteja disponível em estoque.
    if (produto.estoque <= 0) {
      toast.error(
        `O produto "${produto.nome}" está esgotado (Estoque: 0). Não é possível adicioná-lo ao pedido.`,
        'Estoque Indisponível'
      );
      return;
    }

    const itemJaNoCarrinho = cart.find((i) => i.codProduto === produto.codProduto);
    const qtdAtualNoCarrinho = itemJaNoCarrinho ? itemJaNoCarrinho.quantidade : 0;
    const novaQtdTotal = qtdAtualNoCarrinho + qtdDesejada;

    if (novaQtdTotal > produto.estoque) {
      toast.warning(
        `Estoque insuficiente para "${produto.nome}". Quantidade solicitada: ${novaQtdTotal}, Estoque disponível: ${produto.estoque}.`,
        'Limite de Estoque Atingido'
      );
      return;
    }

    if (itemJaNoCarrinho) {
      setCart((prev) =>
        prev.map((item) =>
          item.codProduto === produto.codProduto
            ? { ...item, quantidade: novaQtdTotal }
            : item
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          codProduto: produto.codProduto,
          nome: produto.nome,
          quantidade: qtdDesejada,
          precoUnitario: produto.preco,
          estoqueMaximo: produto.estoque,
        },
      ]);
    }

    toast.success(
      `${qtdDesejada}x "${produto.nome}" adicionado(s) ao pedido!`,
      'Item Adicionado'
    );
  };

  // Alterar quantidade de item no pedido
  const handleAlterarQuantidadeItem = (codProduto: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.codProduto !== codProduto) return item;

        const novaQtd = item.quantidade + delta;
        if (novaQtd <= 0) return item;

        if (novaQtd > item.estoqueMaximo) {
          toast.warning(
            `A quantidade máxima disponível em estoque para "${item.nome}" é de ${item.estoqueMaximo} unidade(s).`,
            'Estoque Máximo'
          );
          return item;
        }

        return { ...item, quantidade: novaQtd };
      })
    );
  };

  // Alterar preço unitário do item (requisito: recalcular valor total dinamicamente se houver alteração de preço unitário)
  const handleAlterarPrecoUnitario = (codProduto: number, novoPreco: number) => {
    if (isNaN(novoPreco) || novoPreco < 0) return;
    setCart((prev) =>
      prev.map((item) =>
        item.codProduto === codProduto
          ? { ...item, precoUnitario: novoPreco }
          : item
      )
    );
  };

  // Remover item do pedido (com confirmação)
  const confirmarRemocaoItem = () => {
    if (!itemParaRemover) return;
    setCart((prev) => prev.filter((i) => i.codProduto !== itemParaRemover.codProduto));
    toast.info(`"${itemParaRemover.nome}" foi removido do pedido.`, 'Item Removido');
    setItemParaRemover(null);
  };

  // Finalizar Pedido
  const handleFinalizarPedido = async () => {
    if (!selectedCliente) {
      toast.error('Selecione um cliente para prosseguir com a venda.', 'Cliente Não Selecionado');
      return;
    }

    if (cart.length === 0) {
      toast.error('Adicione pelo menos um produto ao pedido antes de finalizar.', 'Pedido Vazio');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        codCliente: selectedCliente.codCliente,
        itens: cart.map((i) => ({
          codProduto: i.codProduto,
          quantidade: i.quantidade,
          precoUnitario: i.precoUnitario,
        })),
      };

      const pedidoCriado = await pedidoService.create(payload);
      toast.success(
        `Pedido #${String(pedidoCriado.codPedido).padStart(4, '0')} finalizado com sucesso!`,
        'Operação Concluída'
      );
      setIsConfirmFinalizarOpen(false);
      router.push(`/pedidos/${pedidoCriado.codPedido}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao finalizar o pedido.';
      toast.error(msg, 'Falha na Operação');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Carregando catálogo e dados do cliente...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Tela com Botão Voltar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Nova Venda / Pedido</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Selecione produtos, ajuste quantidades e acompanhe o total em tempo real.</p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleCarregarCenarioTeste}
          leftIcon={<Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          className="border-blue-300 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-800 dark:text-blue-300 shadow-xs"
        >
          Carregar Cenário do Teste FGV
        </Button>
      </div>

      {/* Card de Identificação do Cliente */}
      <Card className="border-blue-200 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-slate-900 dark:to-slate-900/90">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-400 uppercase tracking-wider">Cliente Selecionado</p>
                {selectedCliente ? (
                  <div className="mt-0.5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedCliente.nome}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 mt-1">
                      <span>CNPJ: <strong className="font-mono text-slate-800 dark:text-slate-200">{maskCnpj(selectedCliente.cnpj)}</strong></span>
                      <span>E-mail: <strong className="text-slate-800 dark:text-slate-200">{selectedCliente.email}</strong></span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">Nenhum cliente selecionado.</p>
                )}
              </div>
            </div>

            {/* Seletor rápido de cliente caso queira alterar */}
            <div className="w-full sm:w-72">
              <label htmlFor="select-cliente" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Trocar Cliente
              </label>
              <select
                id="select-cliente"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedCliente?.codCliente || ''}
                onChange={(e) => {
                  const cli = clientes.find((c) => c.codCliente === Number(e.target.value));
                  if (cli) setSelectedCliente(cli);
                }}
              >
                <option value="">Selecione um cliente...</option>
                {clientes.map((c) => (
                  <option key={c.codCliente} value={c.codCliente}>
                    {c.nome} ({maskCnpj(c.cnpj)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Principal: Catálogo à esquerda | Carrinho/Resumo à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna 1: Vitrine de Produtos (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Catálogo de Produtos
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Apenas produtos com estoque disponível podem ser incluídos no pedido.
                </p>
              </div>
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Buscar produto por nome..."
                  value={filtroProduto}
                  onChange={(e) => setFiltroProduto(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[580px] overflow-y-auto">
                {produtosFiltrados.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <p className="font-medium">Nenhum produto encontrado</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Tente pesquisar por outro termo.</p>
                  </div>
                ) : (
                  produtosFiltrados.map((produto) => {
                    const esgotado = produto.estoque <= 0;
                    const itemNoCarrinho = cart.find((i) => i.codProduto === produto.codProduto);
                    const qtdJaAdicionada = itemNoCarrinho?.quantidade || 0;
                    const estoqueRestante = produto.estoque - qtdJaAdicionada;
                    const qtdInput = quantidadesSelecionadas[produto.codProduto] || 1;

                    return (
                      <div
                        key={produto.codProduto}
                        className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                          esgotado ? 'bg-slate-50/60 dark:bg-slate-950/40 opacity-75' : 'hover:bg-blue-50/20 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {/* Detalhes do Produto */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{produto.nome}</h4>
                            {esgotado ? (
                              <Badge variant="danger" size="sm">Sem Estoque (0)</Badge>
                            ) : estoqueRestante <= 2 ? (
                              <Badge variant="warning" size="sm">Últimas {estoqueRestante} un</Badge>
                            ) : (
                              <Badge variant="success" size="sm">{estoqueRestante} em estoque</Badge>
                            )}
                          </div>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-base font-bold text-slate-900 dark:text-white">
                              {formatCurrency(produto.preco)}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">unitário</span>
                          </div>
                        </div>

                        {/* Controles de Quantidade e Adição */}
                        <div className="flex items-center gap-3 shrink-0">
                          {!esgotado && (
                            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors cursor-pointer"
                                onClick={() => setQtdCatalogo(produto.codProduto, qtdInput - 1)}
                                disabled={qtdInput <= 1}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                min={1}
                                max={estoqueRestante}
                                value={qtdInput}
                                onChange={(e) => setQtdCatalogo(produto.codProduto, parseInt(e.target.value) || 1)}
                                className="w-12 text-center text-xs font-semibold py-1.5 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-white"
                              />
                              <button
                                type="button"
                                className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 transition-colors cursor-pointer"
                                onClick={() => setQtdCatalogo(produto.codProduto, qtdInput + 1)}
                                disabled={qtdInput >= estoqueRestante}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <Button
                            variant={esgotado ? 'outline' : 'primary'}
                            size="sm"
                            disabled={esgotado || estoqueRestante <= 0}
                            leftIcon={esgotado ? <AlertTriangle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            onClick={() => handleAdicionarProduto(produto)}
                          >
                            {esgotado ? 'Indisponível' : 'Adicionar'}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2: Itens do Pedido & Resumo Financeiro Atualizado Dinamicamente (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="sticky top-20 shadow-md border-slate-300 dark:border-slate-800">
            <CardHeader className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between py-3.5">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Itens do Pedido
                <Badge variant="info" size="sm">{cart.length}</Badge>
              </CardTitle>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {totalItensNoCarrinho} item(ns)
              </span>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-slate-400 dark:text-slate-500">
                  <ShoppingBag className="w-10 h-10 mx-auto stroke-1 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Nenhum item adicionado ao pedido</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                    Escolha produtos do catálogo ao lado com estoque disponível para compor a venda.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.codProduto}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5 transition-all"
                    >
                      {/* Nome do Produto e Botão Remover */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug">{item.nome}</h5>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            Cód: #{item.codProduto} | Máx Estoque: {item.estoqueMaximo}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setItemParaRemover(item)}
                          className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-md transition-colors cursor-pointer"
                          title="Remover produto do pedido"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Controles de Quantidade, Preço Unitário e Subtotal */}
                      <div className="grid grid-cols-12 gap-2 items-center pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        {/* Quantidade */}
                        <div className="col-span-5">
                          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                            Quantidade
                          </label>
                          <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900">
                            <button
                              type="button"
                              className="px-2 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                              onClick={() => handleAlterarQuantidadeItem(item.codProduto, -1)}
                              disabled={item.quantidade <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="flex-1 text-center font-bold text-xs text-slate-900 dark:text-white">
                              {item.quantidade}
                            </span>
                            <button
                              type="button"
                              className="px-2 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                              onClick={() => handleAlterarQuantidadeItem(item.codProduto, 1)}
                              disabled={item.quantidade >= item.estoqueMaximo}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Preço Unitário (Editável) */}
                        <div className="col-span-4">
                          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                            Preço Unit. (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={item.precoUnitario}
                            onChange={(e) => handleAlterarPrecoUnitario(item.codProduto, parseFloat(e.target.value) || 0)}
                            className="w-full text-right px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        {/* Subtotal */}
                        <div className="col-span-3 text-right">
                          <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                            Subtotal
                          </label>
                          <span className="font-bold text-xs text-slate-900 dark:text-white block">
                            {formatCurrency(item.quantidade * item.precoUnitario)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quadro do Valor Total do Pedido (Sempre Visível e Dinâmico) */}
              <div className="pt-4 border-t-2 border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Quantidade Total de Itens:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{totalItensNoCarrinho} un</span>
                </div>

                <div className="p-4 bg-slate-900 dark:bg-slate-950 border border-slate-800 text-white rounded-xl flex items-center justify-between shadow-inner">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                      Valor Total do Pedido
                    </span>
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      {formatCurrency(valorTotal)}
                    </span>
                  </div>
                  <div className="text-right">
                    <Badge variant="success" size="sm">Cálculo Automático</Badge>
                  </div>
                </div>

                {/* Botão de Finalização com Confirmação */}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 focus:ring-emerald-500"
                  disabled={cart.length === 0 || !selectedCliente}
                  leftIcon={<CheckCircle2 className="w-5 h-5" />}
                  onClick={() => setIsConfirmFinalizarOpen(true)}
                >
                  Finalizar e Emitir Pedido
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogo Crítico 1: Confirmação de Finalização do Pedido */}
      <ConfirmDialog
        isOpen={isConfirmFinalizarOpen}
        onClose={() => setIsConfirmFinalizarOpen(false)}
        onConfirm={handleFinalizarPedido}
        title="Confirmar Emissão do Pedido"
        message={`Deseja concluir a venda para "${selectedCliente?.nome}" com ${totalItensNoCarrinho} item(ns) no valor total de ${formatCurrency(valorTotal)}? O estoque dos produtos será atualizado automaticamente.`}
        confirmText="Confirmar e Finalizar"
        cancelText="Voltar e Revisar"
        variant="success"
        isLoading={submitting}
      />

      {/* Diálogo Crítico 2: Confirmação de Remoção de Item */}
      <ConfirmDialog
        isOpen={itemParaRemover !== null}
        onClose={() => setItemParaRemover(null)}
        onConfirm={confirmarRemocaoItem}
        title="Remover Item do Pedido"
        message={`Tem certeza que deseja remover o produto "${itemParaRemover?.nome}" do pedido atual?`}
        confirmText="Remover Item"
        cancelText="Manter Item"
        variant="danger"
      />
    </div>
  );
}

export default function NovoPedidoPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Carregando tela de pedido...</p>
      </div>
    }>
      <NovoPedidoContent />
    </Suspense>
  );
}

