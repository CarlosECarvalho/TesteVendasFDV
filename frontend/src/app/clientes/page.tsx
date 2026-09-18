'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { clienteService } from '@/services/clienteService';
import { Cliente } from '@/types';
import { maskCnpj, unmaskDigits, formatDate } from '@/utils/masks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Users, UserPlus, ShoppingBag, CheckCircle2 } from 'lucide-react';

export default function ClientesPage() {
  const toast = useToast();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Campos do formulário
  const [cnpj, setCnpj] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [erros, setErros] = useState<{ cnpj?: string; nome?: string; email?: string }>({});

  const carregarClientes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clienteService.getAll();
      setClientes(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar lista de clientes.';
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
        const data = await clienteService.getAll();
        if (!ignore) {
          setClientes(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Erro ao carregar lista de clientes.';
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

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(maskCnpj(e.target.value));
    if (erros.cnpj) setErros((prev) => ({ ...prev, cnpj: undefined }));
  };

  const validarFormulario = () => {
    const novosErros: { cnpj?: string; nome?: string; email?: string } = {};

    const digitsCnpj = unmaskDigits(cnpj);
    if (!digitsCnpj) {
      novosErros.cnpj = 'O CNPJ é obrigatório.';
    } else if (digitsCnpj.length !== 14) {
      novosErros.cnpj = 'O CNPJ deve conter exatamente 14 dígitos numéricos.';
    }

    if (!nome.trim()) {
      novosErros.nome = 'O nome/razão social é obrigatório.';
    } else if (nome.trim().length < 2) {
      novosErros.nome = 'O nome deve conter ao menos 2 caracteres.';
    }

    if (!email.trim()) {
      novosErros.email = 'O e-mail é obrigatório.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      novosErros.email = 'Informe um e-mail com formato válido.';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setSubmitting(true);
    try {
      const novoCliente = await clienteService.create({
        cnpj: cnpj.trim(),
        nome: nome.trim(),
        email: email.trim(),
      });

      toast.success(`Cliente "${novoCliente.nome}" cadastrado com sucesso!`, 'Cliente Salvo');

      // Limpar formulário
      setCnpj('');
      setNome('');
      setEmail('');
      setErros({});

      // Atualizar tabela
      await carregarClientes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar cliente.';
      toast.error(msg, 'Falha no Cadastro');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Cadastro & Gestão de Clientes
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Cadastre novos clientes com validação de unicidade de CNPJ e consulte o histórico da base.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        {/* Formulário de Cadastro (5 cols) */}
        <div className="lg:col-span-5 min-w-0">
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="bg-slate-50/70 dark:bg-slate-800/70 py-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-base">Novo Cliente</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="CNPJ (com máscara automática) *"
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={handleCnpjChange}
                  maxLength={18}
                  error={erros.cnpj}
                  helperText="O CNPJ deve ser único no sistema."
                />

                <Input
                  label="Razão Social / Nome Completo *"
                  placeholder="Ex: João da Silva, Supermercado Central..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  error={erros.nome}
                />

                <Input
                  label="E-mail de Contato *"
                  type="email"
                  placeholder="cliente@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={erros.email}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full mt-2"
                  isLoading={submitting}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Cadastrar Cliente
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Clientes Cadastrados (7 cols) */}
        <div className="lg:col-span-7 min-w-0">
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="bg-slate-50/70 dark:bg-slate-800/70 py-3.5 px-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-base">Clientes Cadastrados</CardTitle>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {clientes.length} cliente(s)
              </span>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th scope="col" className="px-3 sm:px-4 py-3">Cód.</th>
                    <th scope="col" className="px-3 sm:px-4 py-3">Nome / Razão</th>
                    <th scope="col" className="px-3 sm:px-4 py-3">CNPJ</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 hidden sm:table-cell">Cadastro</th>
                    <th scope="col" className="px-3 sm:px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Carregando clientes...
                      </td>
                    </tr>
                  ) : clientes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500">
                        Nenhum cliente cadastrado no momento.
                      </td>
                    </tr>
                  ) : (
                    clientes.map((cliente) => (
                      <tr key={cliente.codCliente} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                        <td className="px-3 sm:px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                          #{cliente.codCliente}
                        </td>
                        <td className="px-3 sm:px-4 py-3 max-w-[140px] sm:max-w-[200px]">
                          <p className="font-semibold text-slate-900 dark:text-white truncate" title={cliente.nome}>
                            {cliente.nome}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-400 truncate" title={cliente.email}>
                            {cliente.email}
                          </p>
                        </td>
                        <td className="px-3 sm:px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {maskCnpj(cliente.cnpj)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap hidden sm:table-cell">
                          {formatDate(cliente.dataCadastro)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-center whitespace-nowrap">
                          <Link href={`/pedidos/novo?clienteId=${cliente.codCliente}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-2.5 py-1 text-xs"
                              leftIcon={<ShoppingBag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                            >
                              <span className="hidden md:inline">Novo </span>Pedido
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
        </div>
      </div>
    </div>
  );
}

