import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiUrl } from '@/utils/apiConfig';

// Defina o tipo Partitura manualmente ou importe de outro lugar
export type Partitura = {
  id: string;
  setor: string;
  titulo: string;
  compositor: string;
  instrumentacao: string;
  tonalidade?: string;
  genero?: string;
  edicao?: string;
  ano_edicao?: string;
  digitalizado: boolean;
  numero_armario?: string;
  numero_prateleira?: string;
  numero_pasta?: string;
  created_at: string;
  updated_at: string;
  instituicao?: string;
  observacoes?: string;
  pdf_urls?: any[];
};

export type PartituraInsert = Omit<Partitura, 'id' | 'created_at' | 'updated_at'>;
export type PartituraUpdate = Partial<PartituraInsert>;

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

export const usePartituras = () => {
  const queryClient = useQueryClient();

  // Listar partituras
  const { data: partituras = [], isLoading, error } = useQuery({
    queryKey: ['partituras'],
    queryFn: async () => {
      const res = await authenticatedFetch(`${getApiUrl()}/api/partituras`);
      return await res.json();
    },
    keepPreviousData: true,
  });

  // Criar partitura
  const createPartitura = useMutation({
    mutationFn: async (partitura: PartituraInsert) => {
      const res = await authenticatedFetch(`${getApiUrl()}/api/partituras`, {
        method: 'POST',
        body: JSON.stringify(partitura),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partituras'] });
      toast.success('Partitura criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar partitura: ${error.message}`);
    },
  });

  // Atualizar partitura
  const updatePartitura = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PartituraUpdate }) => {
      const res = await authenticatedFetch(`${getApiUrl()}/api/partituras/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partituras'] });
      toast.success('Partitura atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar partitura: ${error.message}`);
    },
  });

  // Deletar partitura
  const deletePartitura = useMutation({
    mutationFn: async (id: string) => {
      const res = await authenticatedFetch(`${getApiUrl()}/api/partituras/${id}`, {
        method: 'DELETE',
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partituras'] });
      toast.success('Partitura deletada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao deletar partitura: ${error.message}`);
    },
  });

  // Atualizar instrumento de arquivo (pdf_urls)
  const updateFileInstrument = useMutation({
    mutationFn: async ({ partituraId, fileName, instrument }: { partituraId: string; fileName: string; instrument: string }) => {
      // Buscar partitura
      const res = await authenticatedFetch(`${getApiUrl()}/api/partituras/${partituraId}`);
      const partitura = await res.json();
      
      // Atualizar pdf_urls
      const updatedPdfUrls = (partitura.pdf_urls || []).map((fileInfo: any) =>
        fileInfo.fileName === fileName ? { ...fileInfo, instrument } : fileInfo
      );
      
      // Atualizar partitura
      const resUpdate = await authenticatedFetch(`${getApiUrl()}/api/partituras/${partituraId}`, {
        method: 'PUT',
        body: JSON.stringify({ pdf_urls: updatedPdfUrls }),
      });
      return await resUpdate.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['partitura', variables.partituraId] });
      queryClient.invalidateQueries({ queryKey: ['partituras'] });
      toast.success('Instrumento do arquivo atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar instrumento: ${error.message}`);
    },
  });

  return {
    partituras,
    isLoading,
    error,
    createPartitura,
    updatePartitura,
    deletePartitura,
    updateFileInstrument,
  };
};

export const usePartitura = (id: string) => {
  const { data: partitura, isLoading, error } = useQuery({
    queryKey: ['partitura', id],
    queryFn: async () => {
      const res = await authenticatedFetch(`${getApiUrl()}/api/partituras/${id}`);
      return await res.json();
    },
    enabled: !!id,
  });

  return { partitura, isLoading, error };
};
