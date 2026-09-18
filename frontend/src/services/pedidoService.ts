import { api } from './api';
import { PedidoResumo, PedidoDetalhe, CreatePedidoInput, PedidoFiltro } from '@/types';

export const pedidoService = {
  async getAll(filtro?: PedidoFiltro): Promise<PedidoResumo[]> {
    return api.get<PedidoResumo[]>('/pedidos', filtro as Record<string, string | number | undefined | null>);
  },

  async getById(id: number): Promise<PedidoDetalhe> {
    return api.get<PedidoDetalhe>(`/pedidos/${id}`);
  },

  async create(data: CreatePedidoInput): Promise<PedidoDetalhe> {
    return api.post<PedidoDetalhe>('/pedidos', data);
  },
};

