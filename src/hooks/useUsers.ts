import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiConfig';

export interface User {
  id: string;
  nome: string;
  email: string;
}

export type UserUpdate = Partial<User>;

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

export const useUsers = () => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await authenticatedFetch(`${getApiUrl()}/api/usuarios`);
      return await res.json();
    },
    keepPreviousData: true,
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UserUpdate }) => {
      const res = await authenticatedFetch(`${getApiUrl()}/api/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar usuário: ${error.message}`);
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await authenticatedFetch(`${getApiUrl()}/api/usuarios/${id}`, {
        method: 'DELETE',
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário deletado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao deletar usuário: ${error.message}`);
    },
  });

  return { users, isLoading, error, updateUser, deleteUser };
}; 