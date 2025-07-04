import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiUrl } from '@/utils/apiConfig';

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

export const useSolicitacoesDownload = () => {
  const queryClient = useQueryClient();

  const { data: solicitacoes = [], isLoading, error } = useQuery({
    queryKey: ['solicitacoes_download'],
    queryFn: async () => {
      const res = await authenticatedFetch(`${getApiUrl()}/api/solicitacoes-download`);
      const data = await res.json();
      return data || [];
    },
    keepPreviousData: true,
  });

  return { solicitacoes, isLoading, error };
}; 