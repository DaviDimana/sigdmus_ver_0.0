import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePerformances, usePerformance } from '@/hooks/usePerformances';
import { toast } from 'sonner';
import PerformanceForm from '@/components/PerformanceForm';
import { getUploadConfig } from '@/utils/apiConfig';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const NovaPerformance = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const id = query.get('id');
  const { createPerformance, updatePerformance } = usePerformances();
  const { performance, isLoading } = usePerformance(id || '');
  const canEditOrDelete = true;

  const isEdit = Boolean(id);
  const [sharedProgramUrl, setSharedProgramUrl] = useState<string | undefined>(undefined);
  const [sharedProgramFileName, setSharedProgramFileName] = useState<string | undefined>(undefined);

  const { uploadUrl } = getUploadConfig();

  useEffect(() => {
    if (isEdit && performance && !performance?.programa_arquivo_url) {
      // Buscar outra performance do mesmo grupo que tenha programa
      (async () => {
        const { data: groupPerformances, error } = await fetch(`${getApiUrl()}/api/performances?local=${performance.local}&data=${performance.data}&horario=${performance.horario}`);
        if (!error && groupPerformances) {
          const found = groupPerformances.find((p: any) => p.programa_arquivo_url && p.programa_arquivo_url.trim() !== '');
          if (found && found.programa_arquivo_url) {
            setSharedProgramUrl(found.programa_arquivo_url);
            // Extrair nome do arquivo
            const fileName = found.programa_arquivo_url.split('/').pop();
            setSharedProgramFileName(fileName || 'programa.pdf');
          }
        }
      })();
    } else if (isEdit && performance?.programa_arquivo_url) {
      setSharedProgramUrl(performance.programa_arquivo_url);
      const fileName = performance.programa_arquivo_url.split('/').pop();
      setSharedProgramFileName(fileName || 'programa.pdf');
    }
  }, [isEdit, performance]);

  const uploadProgramFile = async (file, performanceId) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro no upload');
    }

    const { url } = await res.json();
    return url; // já retorna a URL pública
  };

  const deleteProgramFile = async (filePath: string, local: string, dataStr: string, horario: string): Promise<boolean> => {
    try {
      // Chama o endpoint do backend para deletar o arquivo do VPS
      const apiUrl = getUploadConfig().uploadsPath.replace('/uploads', ''); // obtém a base da API
      const res = await fetch(`${apiUrl}/api/upload?file=${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao deletar arquivo');
      }

      // Limpar o campo programa_arquivo_url de todas as performances com mesmo local, data e horário
      const { error: updateError } = await fetch(`${getApiUrl()}/api/performances?local=${local}&data=${dataStr}&horario=${horario}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ programa_arquivo_url: null }),
      });
      if (updateError) {
        console.error('Erro ao limpar programa_arquivo_url das performances relacionadas:', updateError);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Erro ao deletar arquivo do programa:', error);
      return false;
    }
  };

  const updateRelatedPerformances = async (data: any, programUrl: string, isReusing: boolean = false) => {
    try {
      console.log('Atualizando performances relacionadas com programa:', programUrl);
      console.log('Dados para busca:', data);
      
      // Validar dados obrigatórios
      if (!data.data || !data.local || !data.horario) {
        console.error('Dados obrigatórios não fornecidos para busca de performances relacionadas');
        return;
      }
      
      // Buscar todas as performances com mesmo local, data e horário
      const { data: relatedPerformances, error: relatedError } = await fetch(`${getApiUrl()}/api/performances?data=${data.data}&local=${data.local}&horario=${data.horario}`);
      
      if (relatedError) {
        console.error('Erro ao buscar performances relacionadas:', relatedError);
        throw new Error('Erro ao buscar performances relacionadas');
      }
      
      if (!relatedPerformances || relatedPerformances.length === 0) {
        console.log('Nenhuma performance relacionada encontrada');
        return;
      }
      
      console.log('Performances relacionadas encontradas:', relatedPerformances);
      console.log('Total de performances relacionadas:', relatedPerformances.length);
      
      // Atualizar todas as performances relacionadas com o programa
      const performanceIds = relatedPerformances.map((p: any) => p.id);
      console.log('IDs das performances para atualizar:', performanceIds);
      
      const { error: updateError } = await fetch(`${getApiUrl()}/api/performances?id=${performanceIds.join(',')}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ programa_arquivo_url: programUrl }),
      });
      
      if (updateError) {
        console.error('Erro ao atualizar performances relacionadas:', updateError);
        throw new Error('Erro ao atualizar performances relacionadas');
      }
      
      console.log('Performances relacionadas atualizadas com sucesso');
      console.log('Programa vinculado a', relatedPerformances.length, 'performance(s)');
      
      // Mostrar mensagem de sucesso
      if (isReusing) {
        toast.success('Programa do concerto reutilizado com sucesso!');
        toast.info(`O programa foi vinculado a ${relatedPerformances.length} performance(s) com mesmo local, data e horário.`);
      } else {
        toast.success('Programa do concerto salvo com sucesso!');
        if (relatedPerformances.length > 1) {
          toast.info(`O programa foi vinculado a ${relatedPerformances.length} performance(s) com mesmo local, data e horário.`);
        }
      }
      
    } catch (error) {
      console.error('Erro ao atualizar performances relacionadas:', error);
      if (isReusing) {
        toast.error('Performance salva, mas erro ao vincular programa existente');
      } else {
        toast.error('Performance salva, mas erro ao vincular programa');
      }
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const { programFile, removeExistingFile, ...performanceData } = data;
      let perfId = id;
      let programaUrl: string | null = null;
      
      console.log('Dados da performance:', performanceData);
      console.log('Arquivo de programa:', programFile);
      console.log('Remover arquivo existente:', removeExistingFile);
      console.log('Modo de edição:', isEdit);
      
      // Validar dados obrigatórios
      if (!performanceData.data || !performanceData.local || !performanceData.horario) {
        toast.error('Data, local e horário são obrigatórios');
        return;
      }
      
      // Se está editando e o usuário quer remover o arquivo existente
      if (isEdit && removeExistingFile && id) {
        console.log('Removendo arquivo existente da performance:', id);
        const deleted = await deleteProgramFile(performanceData.programa_arquivo_nome, performanceData.local, performanceData.data, performanceData.horario);
        if (deleted) {
          console.log('Arquivo existente removido com sucesso');
          performanceData.programa_arquivo_url = null;
        } else {
          console.log('Erro ao remover arquivo existente, mas continuando...');
        }
      }
      
      // 1. Buscar se já existe performance com mesma data, local e horário
      // Se estiver editando, excluir a performance atual da busca
      let query = fetch(`${getApiUrl()}/api/performances?data=${performanceData.data}&local=${performanceData.local}&horario=${performanceData.horario}`);
      
      if (isEdit && id) {
        query = fetch(`${getApiUrl()}/api/performances?data=${performanceData.data}&local=${performanceData.local}&horario=${performanceData.horario}&id=${id}`);
        console.log('Excluindo performance atual da busca:', id);
      }
      
      console.log('Query de busca:', {
        data: performanceData.data,
        local: performanceData.local,
        horario: performanceData.horario,
        isEdit,
        id
      });
      
      const { data: existingPerformances, error: searchError } = await query;
      
      if (searchError) {
        console.error('Erro ao buscar performances duplicadas:', searchError);
      } else {
        console.log('Performances existentes encontradas:', existingPerformances);
        console.log('Total de performances encontradas:', existingPerformances?.length || 0);
      }
      
      // Se já existe e tem programa, reutilizar
      if (existingPerformances && existingPerformances.length > 0) {
        console.log('Verificando performances com programa...');
        existingPerformances.forEach((p: any, index: number) => {
          console.log(`Performance ${index}:`, p);
        });
        
        const found = existingPerformances.find((p: any) => p.programa_arquivo_url && p.programa_arquivo_url.trim() !== '');
        if (found && found.programa_arquivo_url) {
          programaUrl = found.programa_arquivo_url;
          console.log('Programa encontrado para reutilização:', programaUrl);
        } else {
          console.log('Nenhuma performance com programa encontrada');
        }
      } else {
        console.log('Nenhuma performance existente encontrada');
      }
      
      // Salvar ou atualizar a performance
      if (isEdit && id) {
        console.log('Atualizando performance existente:', id);
        console.log('Dados para atualização:', performanceData);
        await updatePerformance.mutateAsync({ id, updates: performanceData });
        perfId = id;
        toast.success('Performance atualizada com sucesso!');
      } else {
        console.log('Criando nova performance');
        console.log('Dados para criação:', performanceData);
        const created = await createPerformance.mutateAsync(performanceData);
        perfId = created.id;
        toast.success('Performance cadastrada com sucesso!');
      }
      
      console.log('Performance ID:', perfId);
      
      // 2. Se já existe programa, atualizar TODAS as performances relacionadas
      if (programaUrl && perfId) {
        console.log('Reutilizando programa existente:', programaUrl);
        await updateRelatedPerformances(performanceData, programaUrl, true);
      } else if (programFile && perfId) {
        // 3. Se não existe, fazer upload normalmente
        console.log('Fazendo upload de novo programa');
        const programUrl = await uploadProgramFile(programFile, perfId);
        
        if (programUrl) {
          console.log('Programa enviado com sucesso:', programUrl);
          await updateRelatedPerformances(performanceData, programUrl, false);
        } else {
          toast.error('Performance salva, mas erro no upload do programa');
        }
      } else {
        console.log('Nenhum programa para processar');
        if (isEdit) {
          if (removeExistingFile) {
            console.log('Performance editada com arquivo removido');
            toast.info('Performance atualizada e arquivo removido com sucesso!');
          } else {
          console.log('Performance editada sem alteração de programa');
          }
        } else {
          console.log('Nova performance sem programa');
        }
      }
      
      navigate('/performances');
    } catch (error) {
      console.error('Erro ao salvar performance:', error);
      toast.error('Erro ao salvar performance. Tente novamente.');
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
          onClick={() => navigate('/performances')}
          className="flex items-center space-x-2 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{isEdit ? 'Editar Performance' : 'Nova Performance'}</h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? 'Atualize as informações da performance' : 'Cadastre uma nova performance no sistema'}
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Informações da Performance</CardTitle>
          <CardDescription>
            Preencha todos os campos obrigatórios para {isEdit ? 'atualizar' : 'cadastrar'} a performance. Você também pode fazer upload do programa do concerto.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {isEdit && isLoading ? (
            <div>Carregando...</div>
          ) : (
          <PerformanceForm
            onSubmit={handleSubmit}
            onCancel={() => navigate('/performances')}
            isSubmitting={createPerformance.isPending || updatePerformance.isPending}
            initialData={{
              ...performance,
              programa_arquivo_url: sharedProgramUrl || performance?.programa_arquivo_url,
              programa_arquivo_nome: sharedProgramFileName,
            }}
            isEdit={isEdit}
          />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NovaPerformance;
