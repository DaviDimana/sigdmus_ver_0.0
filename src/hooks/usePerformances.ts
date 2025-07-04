import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiConfig';

export type Performance = {
  id: string;
  titulo: string;
  data: string;
  local: string;
  descricao?: string;
  obra_id?: string;
  participantes?: any[];
  pdf_urls?: any[];
  created_at: string;
  updated_at: string;
};

export type PerformanceInsert = Omit<Performance, 'id' | 'created_at' | 'updated_at'>;
export type PerformanceUpdate = Partial<PerformanceInsert>;

// Função para obter o token do localStorage
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Função para fazer requisições autenticadas
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token inválido, fazer logout
      localStorage.removeItem('auth_token');
      throw new Error('Sessão expirada');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro na requisição');
  }

  return response;
};

export const usePerformances = () => {
  const queryClient = useQueryClient();

  // Listar performances
  const { data: performances = [], isLoading, error } = useQuery({
    queryKey: ['performances'],
    queryFn: async () => {
      const res = await authenticatedFetch(`${getApiUrl()}/api/performances`);
      return await res.json();
    },
    keepPreviousData: true,
  });

  // Criar performance
  const createPerformance = useMutation({
    mutationFn: async (performance: PerformanceInsert) => {
      const res = await authenticatedFetch(`${getApiUrl()}/api/performances`, {
        method: 'POST',
        body: JSON.stringify(performance),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performances'] });
      toast.success('Performance criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar performance: ${error.message}`);
    },
  });

  // Atualizar performance
  const updatePerformance = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PerformanceUpdate }) => {
      const res = await authenticatedFetch(`${getApiUrl()}/api/performances/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performances'] });
      toast.success('Performance atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar performance: ${error.message}`);
    },
  });

  // Deletar performance
  const deletePerformance = useMutation({
    mutationFn: async (id: string) => {
      const res = await authenticatedFetch(`${getApiUrl()}/api/performances/${id}`, {
        method: 'DELETE',
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performances'] });
      toast.success('Performance deletada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao deletar performance: ${error.message}`);
    },
  });

  return {
    performances,
    isLoading,
    error,
    createPerformance,
    updatePerformance,
    deletePerformance,
  };
};

export const usePerformance = (id: string) => {
  const { data: performance, isLoading, error } = useQuery({
    queryKey: ['performance', id],
    queryFn: async () => {
      const res = await authenticatedFetch(`${getApiUrl()}/api/performances/${id}`);
      return await res.json();
    },
    enabled: !!id,
  });

  return { performance, isLoading, error };
};
