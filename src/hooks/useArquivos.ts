import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiConfig';

export interface Arquivo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  arquivo_url: string;
  usuario_upload: string;
  restricao_download: boolean;
  downloads: number;
  categoria?: string;
  obra?: string;
  partitura_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SolicitacaoDownload {
  id: string;
  arquivo_id: string;
  usuario_solicitante: string;
  usuario_responsavel: string;
  mensagem: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  created_at: string;
}

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

export const useArquivos = () => {
  const queryClient = useQueryClient();

  const { data: arquivos = [], isLoading, error } = useQuery({
    queryKey: ['arquivos'],
    queryFn: async () => {
      console.log('Fetching arquivos...');
      const res = await authenticatedFetch(`${getApiUrl()}/api/arquivos`);
      const data = await res.json();
      console.log('Arquivos fetched:', data);
      return data as Arquivo[];
    },
    keepPreviousData: true,
  });

  const uploadArquivo = useMutation({
    mutationFn: async ({ file, metadata }: { file: File; metadata: any }) => {
      // Upload do arquivo para a API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));

      const token = getToken();
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const res = await fetch(`${getApiUrl()}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro no upload');
      }

      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arquivos'] });
      toast.success('Arquivo enviado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao enviar arquivo: ${error.message}`);
    },
  });

  const solicitarAutorizacao = useMutation({
    mutationFn: async ({ arquivo, mensagem }: { arquivo: Arquivo; mensagem?: string }) => {
      console.log('Solicitando autorização para arquivo:', arquivo.id);
      
      const res = await authenticatedFetch(`${getApiUrl()}/api/solicitacoes-download`, {
        method: 'POST',
        body: JSON.stringify({
          arquivo_id: arquivo.id,
          mensagem: mensagem || `Solicitação de download para: ${arquivo.nome}`,
        }),
      });
      
      const data = await res.json();
      console.log('Download request created:', data);
      return data;
    },
    onSuccess: () => {
      toast.success('Solicitação de autorização enviada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao solicitar autorização: ${error.message}`);
    },
  });

  const downloadArquivo = useMutation({
    mutationFn: async (arquivo: Arquivo) => {
      console.log('Downloading arquivo:', arquivo.nome);
      
      // Verificar se o arquivo tem restrição de download
      if (arquivo.restricao_download) {
        // Verificar se existe autorização aprovada
        const res = await authenticatedFetch(`${getApiUrl()}/api/solicitacoes-download/verificar/${arquivo.id}`);
        const autorizacao = await res.json();
        
        if (!autorizacao || autorizacao.status !== 'aprovada') {
          throw new Error('AUTHORIZATION_REQUIRED');
        }
      }
      
      // Incrementar contador de downloads
      await authenticatedFetch(`${getApiUrl()}/api/arquivos/${arquivo.id}/download`, {
        method: 'POST',
      });
      
      // Fazer download do arquivo
      if (arquivo.arquivo_url) {
        const link = document.createElement('a');
        link.href = arquivo.arquivo_url;
        link.download = arquivo.nome;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      console.log('Arquivo downloaded:', arquivo.nome);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arquivos'] });
      toast.success('Arquivo baixado com sucesso!');
    },
    onError: (error: any) => {
      if (error.message === 'AUTHORIZATION_REQUIRED') {
        toast.error('Autorização necessária para baixar este arquivo');
      } else {
        toast.error(`Erro ao baixar arquivo: ${error.message}`);
      }
    },
  });

  const deleteArquivo = useMutation({
    mutationFn: async (arquivo: Arquivo) => {
      console.log('Deleting arquivo:', arquivo.id);
      
      const res = await authenticatedFetch(`${getApiUrl()}/api/arquivos/${arquivo.id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      console.log('Arquivo deleted:', arquivo.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arquivos'] });
      toast.success('Arquivo deletado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao deletar arquivo: ${error.message}`);
    },
  });

  return {
    arquivos,
    isLoading,
    error,
    uploadArquivo,
    downloadArquivo,
    deleteArquivo,
    solicitarAutorizacao,
  };
};
