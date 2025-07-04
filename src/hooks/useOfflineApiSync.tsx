import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { getApiUrl } from '@/utils/apiConfig';

interface OfflineOperation {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

interface SyncStatus {
  isSyncing: boolean;
  pendingOperations: number;
  lastSync: Date | null;
  syncErrors: string[];
}

export const useOfflineApiSync = () => {
  const [offlineOperations, setOfflineOperations] = useState<OfflineOperation[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingOperations: 0,
    lastSync: null,
    syncErrors: [],
  });
  const { toast } = useToast();

  // Carregar operações offline do localStorage
  useEffect(() => {
    const savedOperations = localStorage.getItem('sigdmus-offline-api');
    if (savedOperations) {
      try {
        const parsed = JSON.parse(savedOperations);
        setOfflineOperations(parsed);
        setSyncStatus(prev => ({ ...prev, pendingOperations: parsed.length }));
      } catch (error) {
        console.error('Erro ao carregar operações offline:', error);
      }
    }
  }, []);

  // Salvar operações offline
  const saveOfflineOperation = useCallback((operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>) => {
    const newOperation: OfflineOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    const updatedOperations = [...offlineOperations, newOperation];
    setOfflineOperations(updatedOperations);
    setSyncStatus(prev => ({ ...prev, pendingOperations: updatedOperations.length }));
    localStorage.setItem('sigdmus-offline-api', JSON.stringify(updatedOperations));
    toast({
      title: 'Operação salva offline',
      description: 'Será sincronizada quando você estiver online.',
    });
  }, [offlineOperations, toast]);

  // Sincronizar operações offline com a API local
  const syncOfflineOperations = useCallback(async () => {
    if (offlineOperations.length === 0) return;
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));
    const successfulOperations: string[] = [];
    const failedOperations: OfflineOperation[] = [];

    for (const operation of offlineOperations) {
      try {
        await processApiOperation(operation);
        successfulOperations.push(operation.id);
      } catch (error) {
        console.error(`Erro ao sincronizar operação ${operation.id}:`, error);
        failedOperations.push({
          ...operation,
          retryCount: operation.retryCount + 1,
        });
      }
    }

    // Remover operações sincronizadas com sucesso
    const remainingOperations = offlineOperations.filter(op =>
      !successfulOperations.includes(op.id)
    );
    // Adicionar operações que falharam (com limite de tentativas)
    const finalOperations = [
      ...remainingOperations,
      ...failedOperations.filter(op => op.retryCount < 3)
    ];
    setOfflineOperations(finalOperations);
    setSyncStatus({
      isSyncing: false,
      pendingOperations: finalOperations.length,
      lastSync: new Date(),
      syncErrors: failedOperations.map(op => `Erro ao sincronizar ${op.table}`),
    });
    localStorage.setItem('sigdmus-offline-api', JSON.stringify(finalOperations));
    if (successfulOperations.length > 0) {
      toast({
        title: 'Sincronização concluída',
        description: `${successfulOperations.length} operações sincronizadas com sucesso.`,
      });
    }
    if (failedOperations.length > 0) {
      toast({
        title: 'Erros na sincronização',
        description: `${failedOperations.length} operações falharam. Tentaremos novamente.`,
        variant: 'destructive',
      });
    }
  }, [offlineOperations, toast]);

  // Processar operação na API local
  const processApiOperation = async (operation: OfflineOperation) => {
    const { type, table, data } = operation;
    const apiUrl = `${getApiUrl()}/api/${table}`;
    switch (type) {
      case 'insert': {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Erro ao inserir');
        break;
      }
      case 'update': {
        const res = await fetch(`${apiUrl}/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Erro ao atualizar');
        break;
      }
      case 'delete': {
        const res = await fetch(`${apiUrl}/${data.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Erro ao deletar');
        break;
      }
    }
  };

  // Operações offline específicas para partituras
  const savePartituraOffline = useCallback((partitura: any, type: 'insert' | 'update' | 'delete') => {
    saveOfflineOperation({
      type,
      table: 'partituras',
      data: partitura,
    });
  }, [saveOfflineOperation]);

  // Operações offline específicas para performances
  const savePerformanceOffline = useCallback((performance: any, type: 'insert' | 'update' | 'delete') => {
    saveOfflineOperation({
      type,
      table: 'performances',
      data: performance,
    });
  }, [saveOfflineOperation]);

  // Limpar operações offline
  const clearOfflineOperations = useCallback(() => {
    setOfflineOperations([]);
    setSyncStatus(prev => ({ ...prev, pendingOperations: 0 }));
    localStorage.removeItem('sigdmus-offline-api');
    toast({
      title: 'Operações offline limpas',
      description: 'Todas as operações pendentes foram removidas.',
    });
  }, [toast]);

  // Detectar quando voltar online
  useEffect(() => {
    const handleOnline = () => {
      if (offlineOperations.length > 0) {
        syncOfflineOperations();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [offlineOperations, syncOfflineOperations]);

  return {
    offlineOperations,
    syncStatus,
    saveOfflineOperation,
    savePartituraOffline,
    savePerformanceOffline,
    syncOfflineOperations,
    clearOfflineOperations,
  };
}; 