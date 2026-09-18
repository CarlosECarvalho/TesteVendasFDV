'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { clienteService } from '@/services/clienteService';
import { Cliente } from '@/types';
import { maskCnpj, unmaskDigits } from '@/utils/masks';
import { useToast } from './ui/Toast';
import { Search, UserCheck, ArrowRight, UserPlus, AlertCircle, Sparkles } from 'lucide-react';

interface ModalNovoPedidoProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalNovoPedido: React.FC<ModalNovoPedidoProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const toast = useToast();

  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(maskCnpj(e.target.value));
    setClienteEncontrado(null);
    setErroBusca(null);
  };

  const buscarCliente = async (cnpjParaBuscar?: string) => {
    const doc = cnpjParaBuscar || cnpj;
    const digits = unmaskDigits(doc);

    if (digits.length < 14) {
      setErroBusca('Por favor, informe um CNPJ válido com 14 dígitos.');
      return;
    }

    setLoading(true);
    setErroBusca(null);
    try {
      const cliente = await clienteService.getByCnpj(doc);
      setClienteEncontrado(cliente);
      toast.success(`Cliente ${cliente.nome} localizado!`, 'Cliente Encontrado');
    } catch (err: unknown) {
      setClienteEncontrado(null);
      const msg = err instanceof Error ? err.message : 'Cliente não encontrado com o CNPJ informado.';
      setErroBusca(msg);
      toast.error(msg, 'Busca de Cliente');
    } finally {
      setLoading(false);
    }
  };

  const handlePreencherJoaoSilva = () => {
    const cnpjJoao = '12.345.678/0001-90';
    setCnpj(cnpjJoao);
    buscarCliente(cnpjJoao);
  };

  const handleAplicarCenarioCompleto = async () => {
    const cnpjJoao = '12.345.678/0001-90';
    setCnpj(cnpjJoao);
    setLoading(true);
    try {
      const cliente = await clienteService.getByCnpj(cnpjJoao);
      onClose();
      router.push(`/pedidos/novo?clienteId=${cliente.codCliente}&cenario=fgv`);
    } catch {
      // Caso não encontre por CNPJ diretamente, navega passando a flag de cenário
      onClose();
      router.push(`/pedidos/novo?cenario=fgv`);
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarPedido = () => {
    if (!clienteEncontrado) return;
    onClose();
    router.push(`/pedidos/novo?clienteId=${clienteEncontrado.codCliente}`);
  };

  const handleIrParaCadastro = () => {
    onClose();
    router.push('/clientes');
  };

  const handleClose = () => {
    setCnpj('');
    setClienteEncontrado(null);
    setErroBusca(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Iniciar Novo Pedido"
      description="Informe o CNPJ do cliente pré-cadastrado para prosseguir com a venda."
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleIniciarPedido}
            disabled={!clienteEncontrado}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Avançar para o Pedido
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Campo de Busca por CNPJ */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="CNPJ do Cliente"
              placeholder="00.000.000/0000-00"
              value={cnpj}
              onChange={handleCnpjChange}
              maxLength={18}
              leftIcon={<Search className="w-4 h-4" />}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  buscarCliente();
                }
              }}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => buscarCliente()}
            isLoading={loading}
          >
            Buscar
          </Button>
        </div>

        {/* Sugestão de Teste Rápido */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-800 dark:text-slate-100">Cenário do Teste FGV: </span>
            João da Silva (2 monitores e 1 teclado)
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePreencherJoaoSilva}
              className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 underline cursor-pointer"
            >
              Apenas CNPJ
            </button>
            <button
              type="button"
              onClick={handleAplicarCenarioCompleto}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Montar Pedido com Itens
            </button>
          </div>
        </div>

        {/* Cliente Encontrado */}
        {clienteEncontrado && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm mb-2">
              <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Cliente Confirmado</span>
            </div>
            <div className="text-sm space-y-1 text-emerald-950 dark:text-emerald-100">
              <p><span className="font-medium text-emerald-800 dark:text-emerald-400">Nome:</span> {clienteEncontrado.nome}</p>
              <p><span className="font-medium text-emerald-800 dark:text-emerald-400">CNPJ:</span> {maskCnpj(clienteEncontrado.cnpj)}</p>
              <p><span className="font-medium text-emerald-800 dark:text-emerald-400">E-mail:</span> {clienteEncontrado.email}</p>
            </div>
          </div>
        )}

        {/* Erro de Busca */}
        {erroBusca && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl animate-in fade-in duration-200 flex flex-col gap-3">
            <div className="flex items-start gap-2.5 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{erroBusca}</p>
                <p className="text-xs text-red-600/90 dark:text-red-400/90 mt-0.5">Deseja cadastrar este novo cliente agora?</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start text-red-700 dark:text-red-300 border-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/60"
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={handleIrParaCadastro}
            >
              Ir para Cadastro de Clientes
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

