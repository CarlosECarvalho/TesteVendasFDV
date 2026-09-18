'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { pedidoService } from '@/services/pedidoService';
import { PedidoResumo, PedidoFiltro } from '@/types';
import { formatCurrency, formatDateTime, maskCnpj } from '@/utils/masks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { ModalNovoPedido } from '@/components/ModalNovoPedido';
import { useToast } from '@/components/ui/Toast';
import { 
  Plus, 
  Search, 
  RotateCcw, 
  ShoppingBag, 
  Calendar, 
  User, 
  Eye, 
  DollarSign, 
  FileText,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const toast = useToast();
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados dos Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [clienteFiltro, setClienteFiltro] = useState('');

  const carregarPedidos = useCallback(async (filtro?: PedidoFiltro) => {
    setLoading(true);
    try {
      const data = await pedidoService.getAll(filtro);
      setPedidos(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar lista de pedidos.';
      toast.error(msg, 'Erro de Conexão');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      try {
        const data = await pedidoService.getAll();
        if (!ignore) {
          setPedidos(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar lista de pedidos.';
          toast.error(msg, 'Erro de Conexão');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      ignore = true;
    };
  }, [toast]);

  const handleAplicarFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    const filtro: PedidoFiltro = {};
    if (dataInicio) filtro.dataInicio = dataInicio;
    if (dataFim) filtro.dataFim = dataFim;
    if (clienteFiltro.trim()) filtro.cliente = clienteFiltro.trim();

    carregarPedidos(filtro);
  };

  const handleLimparFiltros = () => {
    setDataInicio('');
    setDataFim('');
    setClienteFiltro('');
    carregarPedidos();
  };

  const valorTotalVendas = pedidos.reduce((acc, p) => acc + (p.valorTotal || 0), 0);
  const totalItensVendidos = pedidos.reduce((acc, p) => acc + (p.totalItens || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Pedidos de Venda
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consulte o histórico de pedidos, filtre por cliente e data ou inicie uma nova venda.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/pedidos/novo?cenario=fgv">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              leftIcon={<Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
              className="border-blue-300 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-800 dark:text-blue-300 shadow-xs"
            >
              Cenário do Teste FGV
            </Button>
          </Link>
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Plus className="w-5 h-5" />}
            onClick={() => setIsModalOpen(true)}
            className="shadow-md"
          >
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total de Pedidos</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{pedidos.length}</h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Faturamento Total</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(valorTotalVendas)}</h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-600">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Itens Comercializados</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalItensVendidos}</h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleAplicarFiltros} className="flex flex-col lg:flex-row items-end gap-3.5">
            <div className="w-full lg:w-48">
              <Input
                label="Data Inicial"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                leftIcon={<Calendar className="w-4 h-4" />}
              />
            </div>

            <div className="w-full lg:w-48">
              <Input
                label="Data Final"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                leftIcon={<Calendar className="w-4 h-4" />}
              />
            </div>

            <div className="w-full lg:flex-1">
              <Input
                label="Filtrar por Cliente"
                placeholder="Digite o nome ou CNPJ do cliente..."
                value={clienteFiltro}
                onChange={(e) => setClienteFiltro(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
              />
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
              <Button
                type="submit"
                variant="secondary"
                leftIcon={<Search className="w-4 h-4" />}
                className="flex-1 lg:flex-initial"
              >
                Filtrar
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleLimparFiltros}
                title="Limpar filtros"
                className="flex-1 lg:flex-initial"
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tabela de Pedidos */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-3.5"># Pedido</th>
                <th scope="col" className="px-6 py-3.5">Data & Hora</th>
                <th scope="col" className="px-6 py-3.5">Cliente</th>
                <th scope="col" className="px-6 py-3.5">CNPJ</th>
                <th scope="col" className="px-6 py-3.5 text-center">Itens</th>
                <th scope="col" className="px-6 py-3.5 text-right">Valor Total</th>
                <th scope="col" className="px-6 py-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Carregando pedidos...</span>
                    </div>
                  </td>
                </tr>
              ) : pedidos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Nenhum pedido encontrado</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Tente ajustar os filtros ou clique em &quot;Novo Pedido&quot; para iniciar uma venda.
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => setIsModalOpen(true)}
                      >
                        Criar Primeiro Pedido
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                pedidos.map((pedido) => (
                  <tr key={pedido.codPedido} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      #{String(pedido.codPedido).padStart(4, '0')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDateTime(pedido.dataPedido)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                      {pedido.nomeCliente}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {maskCnpj(pedido.cnpjCliente)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {pedido.totalItens} un
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatCurrency(pedido.valorTotal)}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <Link href={`/pedidos/${pedido.codPedido}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Ver Detalhes
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Criação de Pedido com CNPJ */}
      <ModalNovoPedido
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

