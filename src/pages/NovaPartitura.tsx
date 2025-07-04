import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Hourglass } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePartituras, usePartitura } from '@/hooks/usePartituras';
import { toast } from 'sonner';
import PartituraForm from '@/components/PartituraForm';
import { identifyInstrument } from '@/utils/instrumentIdentifier';
import { useArquivos } from '@/hooks/useArquivos';
import { useAuth } from '@/hooks/useAuth';
import { getApiUrl } from '@/utils/apiConfig';

function useQuery() {
  return new URLSearchParams(useLocation().search);
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

const NovaPartitura = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const id = query.get('id');
  const { createPartitura, updatePartitura } = usePartituras();
  const { partitura, isLoading } = usePartitura(id || '');
  const { deleteArquivo, uploadArquivo } = useArquivos();
  const { profile } = useAuth();
  const canEditOrDelete = true;

  const isEdit = Boolean(id);
  const [isSaving, setIsSaving] = React.useState(false);

  async function uploadPdfFiles(pdfFiles: File[], partituraId: string) {
    const fileInfos: { url: string; fileName: string; instrument: string | null }[] = [];
    
    for (const file of pdfFiles) {
      try {
        // Upload via API REST
        const formData = new FormData();
        formData.append('file', file);
        formData.append('metadata', JSON.stringify({
          categoria: 'partitura',
          obra: partituraId,
          partitura_id: partituraId,
        }));

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
          const error = await res.json();
          throw new Error(error.message || 'Erro no upload');
        }

        const data = await res.json();
        const instrument = identifyInstrument(file.name);
        fileInfos.push({
          url: data.url,
          fileName: file.name,
          instrument: instrument,
        });
      } catch (error: any) {
        toast.error(`Erro ao enviar ${file.name}: ${error.message}`);
        continue;
      }
    }
    return fileInfos;
  }

  const handleSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      const { pdfFiles, oldFiles, removedFiles, ...partituraData } = data;
      let partituraId = id;
      let finalPdfUrls = [];
      
      // 1. Remover arquivos antigos marcados para remoção
      let remainingOldFiles = oldFiles ? oldFiles.filter((f: any) => !removedFiles.includes(f.fileName)) : [];
      if (isEdit && removedFiles && removedFiles.length > 0 && oldFiles) {
        for (const file of oldFiles) {
          if (removedFiles.includes(file.fileName)) {
            // Remove do storage se possível (ignora erro)
            try {
              await deleteArquivo.mutateAsync({ id: file.id, arquivo_url: file.url, nome: file.fileName });
            } catch (e) {
              // Apenas loga, não bloqueia o fluxo
              console.error('Erro ao remover arquivo antigo:', e);
            }
          }
        }
      }
      
      // 2. Upload de novos arquivos
      let newFileInfos = [];
      if (pdfFiles && pdfFiles.length > 0) {
        for (const file of pdfFiles) {
          try {
            // Upload via hook (adapte os metadados conforme necessário)
            const uploaded = await uploadArquivo.mutateAsync({
              file,
              metadata: {
                categoria: 'partitura',
                obra: partituraData.titulo,
                partitura_id: partituraId,
              },
            });
            newFileInfos.push({
              url: uploaded.arquivo_url,
              fileName: uploaded.nome,
              instrument: identifyInstrument(uploaded.nome),
              id: uploaded.id,
            });
          } catch (e) {
            toast.error('Erro ao enviar arquivo: ' + file.name);
          }
        }
      }
      
      // 3. Montar array final de pdf_urls
      finalPdfUrls = [...remainingOldFiles, ...newFileInfos];
      
      // 4. Atualizar partitura (campos + pdf_urls)
      if (isEdit && id) {
        const { error: updateError } = await updatePartitura.mutateAsync({ id, updates: { ...partituraData, pdf_urls: finalPdfUrls } });
        if (updateError) {
          toast.error('Erro ao atualizar partitura: ' + updateError.message);
          setIsSaving(false);
          return;
        }
        toast.success('Partitura atualizada com sucesso!');
      } else {
        const created = await createPartitura.mutateAsync({ ...partituraData, pdf_urls: finalPdfUrls });
        partituraId = created.id;
        toast.success('Partitura cadastrada com sucesso!');
      }
      setIsSaving(false);
      navigate('/partituras');
    } catch (error) {
      setIsSaving(false);
      console.error('Erro ao salvar partitura:', error);
      toast.error('Erro ao salvar partitura. Tente novamente.');
    }
  };

  if (!profile) {
    return <div className="flex items-center justify-center h-64">Carregando perfil do usuário...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/partituras')}
          className="flex items-center space-x-2 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Editar Partitura' : 'Nova Partitura'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? 'Atualize as informações da partitura' : 'Cadastre uma nova partitura no sistema'}
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Informações da Partitura</CardTitle>
          <CardDescription>
            Preencha todos os campos obrigatórios para {isEdit ? 'atualizar' : 'cadastrar'} a partitura
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isEdit && isLoading ? (
            <div>Carregando...</div>
          ) : (
          <PartituraForm
              partitura={isEdit ? partitura : undefined}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/partituras')}
              isSubmitting={isSaving || createPartitura.isPending || updatePartitura.isPending}
          />
          )}
        </CardContent>
      </Card>
      {/* Overlay de loading */}
      {isSaving && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
          <Hourglass className="animate-spin h-12 w-12 text-blue-500 mb-4" />
          <span className="text-white text-lg font-semibold drop-shadow-lg">Atualizando partitura e arquivos. Por favor, aguarde...</span>
        </div>
      )}
    </div>
  );
};

export default NovaPartitura;
