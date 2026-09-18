'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { pedidoService } from '@/services/pedidoService';
import { PedidoDetalhe } from '@/types';
import { formatCurrency, formatDateTime, maskCnpj } from '@/utils/masks';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import {
  ArrowLeft,
  Calendar,
  User,
  ShoppingBag,
  Printer,
  Plus
} from 'lucide-react';

export default function PedidoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const id = Number(params.id);

  const [pedido, setPedido] = useState<PedidoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarPedido() {
      if (!id || isNaN(id)) {
        toast.error('Código de pedido inválido.', 'Erro');
        router.push('/');
        return;
      }

      setLoading(true);
      try {
        const data = await pedidoService.getById(id);
        setPedido(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao buscar detalhes do pedido.';
        toast.error(msg, 'Pedido Não Encontrado');
        router.push('/');
      } finally {
        setLoading(false);
      }
    }

    carregarPedido();
  }, [id, router, toast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Carregando detalhes do pedido #{id}...</p>
      </div>
    );
  }

  if (!pedido) {
    return null;
  }

  const totalUnidades = pedido.itens.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Barra Superior de Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Voltar aos Pedidos
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Pedido #{String(pedido.codPedido).padStart(4, '0')}
              </h1>
              <Badge variant="success">Finalizado com Sucesso</Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              Emitido em {formatDateTime(pedido.dataPedido)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            Imprimir Comprovante
          </Button>
          <Link href="/pedidos/novo">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Novo Pedido
            </Button>
          </Link>
        </div>
      </div>

      {/* Card dos Dados do Cliente */}
      <Card>
        <CardHeader className="bg-slate-50/70 dark:bg-slate-800/70 py-3.5 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-sm">Dados do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Razão Social / Nome</p>
              <p className="font-bold text-slate-900 dark:text-white mt-1">{pedido.cliente.nome}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">CNPJ</p>
              <p className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-1">{maskCnpj(pedido.cliente.cnpj)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">E-mail</p>
              <p className="text-slate-800 dark:text-slate-200 mt-1">{pedido.cliente.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Cliente Desde</p>
              <p className="text-slate-800 dark:text-slate-200 mt-1">{formatDateTime(pedido.cliente.dataCadastro)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela dos Itens do Pedido */}
      <Card>
        <CardHeader className="bg-slate-50/70 dark:bg-slate-800/70 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-sm">Produtos e Itens Incluídos</CardTitle>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {pedido.itens.length} produto(s) distinto(s)
          </span>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-6 py-3.5">Cód.</th>
                <th scope="col" className="px-6 py-3.5">Produto</th>
                <th scope="col" className="px-6 py-3.5 text-right">Preço Unitário</th>
                <th scope="col" className="px-6 py-3.5 text-center">Quantidade</th>
                <th scope="col" className="px-6 py-3.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {pedido.itens.map((item) => (
                <tr key={item.codProduto} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                    #{item.codProduto}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                    {item.nomeProduto}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {formatCurrency(item.precoUnitario)}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {item.quantidade} un
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Resumo Financeiro Final */}
      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-4">
        <Card className="sm:w-80 bg-slate-900 dark:bg-slate-950 text-white shadow-lg border-slate-800">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total de Unidades:</span>
              <span className="font-semibold text-white">{totalUnidades} un</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Condição:</span>
              <span className="font-semibold text-emerald-400">À Vista / Concluído</span>
            </div>
            <div className="pt-3 border-t border-slate-700 flex items-baseline justify-between">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Valor Total
              </span>
              <span className="text-2xl font-black text-emerald-400">
                {formatCurrency(pedido.valorTotal)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

