import { api } from './api';
import { Produto, CreateProdutoInput } from '@/types';

export const produtoService = {
  async getAll(): Promise<Produto[]> {
    return api.get<Produto[]>('/produtos');
  },

  async getById(id: number): Promise<Produto> {
    return api.get<Produto>(`/produtos/${id}`);
  },

  async create(data: CreateProdutoInput): Promise<Produto> {
    return api.post<Produto>('/produtos', data);
  },
};

