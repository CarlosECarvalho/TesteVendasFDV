'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { produtoService } from '@/services/produtoService';
import { Produto } from '@/types';
import { formatCurrency } from '@/utils/masks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { Package, PlusCircle, CheckCircle2 } from 'lucide-react';

export default function ProdutosPage() {
  const toast = useToast();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [estoque, setEstoque] = useState('');
  const [erros, setErros] = useState<{ nome?: string; preco?: string; estoque?: string }>({});

  const carregarProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await produtoService.getAll();
      setProdutos(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao buscar catálogo de produtos.';
      toast.error(msg, 'Erro');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      try {
        const data = await produtoService.getAll();
        if (!ignore) {
          setProdutos(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Erro ao buscar catálogo de produtos.';
          toast.error(msg, 'Erro');
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

  const validarFormulario = () => {
    const novosErros: { nome?: string; preco?: string; estoque?: string } = {};

    if (!nome.trim()) {
      novosErros.nome = 'O nome do produto é obrigatório.';
    } else if (nome.trim().length < 2) {
      novosErros.nome = 'O nome deve ter pelo menos 2 caracteres.';
    }

    const precoNum = parseFloat(preco.replace(',', '.'));
    if (!preco || isNaN(precoNum) || precoNum <= 0) {
      novosErros.preco = 'Informe um preço válido maior que zero.';
    }

    const estoqueNum = parseInt(estoque, 10);
    if (estoque === '' || isNaN(estoqueNum) || estoqueNum < 0) {
      novosErros.estoque = 'Informe uma quantidade em estoque válida (zero ou mais).';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setSubmitting(true);
    try {
      const precoNum = parseFloat(preco.replace(',', '.'));
      const estoqueNum = parseInt(estoque, 10);

      const novoProduto = await produtoService.create({
        nome: nome.trim(),
        preco: precoNum,
        estoque: estoqueNum,
      });

      toast.success(`Produto "${novoProduto.nome}" cadastrado com sucesso!`, 'Sucesso');

      // Limpar formulário
      setNome('');
      setPreco('');
      setEstoque('');
      setErros({});

      // Atualizar lista
      await carregarProdutos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar produto.';
      toast.error(msg, 'Erro de Cadastro');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Cadastro & Controle de Produtos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Cadastre novos produtos no catálogo e monitore as quantidades em estoque disponíveis para venda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulário de Cadastro (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="bg-slate-50/70 dark:bg-slate-800/70 py-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-base">Novo Produto</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nome do Produto *"
                  placeholder="Ex: Teclado Mecânico RGB, Monitor 27..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  error={erros.nome}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Preço Unitário (R$) *"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    error={erros.preco}
                  />

                  <Input
                    label="Estoque Inicial *"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={estoque}
                    onChange={(e) => setEstoque(e.target.value)}
                    error={erros.estoque}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-2"
                  isLoading={submitting}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Cadastrar Produto
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Listagem de Produtos Cadastrados (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="bg-slate-50/70 dark:bg-slate-800/70 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-base">Catálogo Cadastrado</CardTitle>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {produtos.length} produto(s)
              </span>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">Cód.</th>
                    <th scope="col" className="px-6 py-3.5">Nome</th>
                    <th scope="col" className="px-6 py-3.5 text-right">Preço</th>
                    <th scope="col" className="px-6 py-3.5 text-center">Estoque</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Carregando produtos...
                      </td>
                    </tr>
                  ) : produtos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-400 dark:text-slate-500">
                        Nenhum produto cadastrado até o momento.
                      </td>
                    </tr>
                  ) : (
                    produtos.map((produto) => {
                      const esgotado = produto.estoque <= 0;
                      return (
                        <tr key={produto.codProduto} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                          <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                            #{produto.codProduto}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                            {produto.nome}
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {formatCurrency(produto.preco)}
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            {esgotado ? (
                              <Badge variant="danger" size="sm">0 un (Esgotado)</Badge>
                            ) : produto.estoque <= 3 ? (
                              <Badge variant="warning" size="sm">{produto.estoque} un (Baixo)</Badge>
                            ) : (
                              <Badge variant="success" size="sm">{produto.estoque} un</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

