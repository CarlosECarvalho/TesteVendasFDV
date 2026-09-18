import { api } from './api';
import { Cliente, CreateClienteInput } from '@/types';
import { unmaskDigits } from '@/utils/masks';

export const clienteService = {
  async getAll(): Promise<Cliente[]> {
    return api.get<Cliente[]>('/clientes');
  },

  async getById(id: number): Promise<Cliente> {
    return api.get<Cliente>(`/clientes/${id}`);
  },

  async getByCnpj(cnpj: string): Promise<Cliente> {
    // Normaliza enviando apenas os dígitos para evitar problemas com barras (/) no path da URL
    const cnpjNumerico = unmaskDigits(cnpj);
    return api.get<Cliente>(`/clientes/cnpj/${cnpjNumerico}`);
  },

  async create(data: CreateClienteInput): Promise<Cliente> {
    return api.post<Cliente>('/clientes', data);
  },
};

