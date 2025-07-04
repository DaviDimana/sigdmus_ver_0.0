import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

interface OfflineData {
  id: string;
  type: 'partitura' | 'performance' | 'user';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

interface SyncStatus {
  isSyncing: boolean;
  pendingItems: number;
  lastSync: Date | null;
  syncErrors: string[];
}

export const useOfflineSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingItems: 0,
    lastSync: null,
    syncErrors: [],
  });
  const [offlineData, setOfflineData] = useState<OfflineData[]>([]);
  const { toast } = useToast();

  // Carregar dados offline do localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('sigdmus-offline-data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setOfflineData(parsed);
        setSyncStatus(prev => ({ ...prev, pendingItems: parsed.length }));
      } catch (error) {
        console.error('Erro ao carregar dados offline:', error);
      }
    }
  }, []);

  // Salvar dados offline
  const saveOfflineData = useCallback((data: Omit<OfflineData, 'id' | 'timestamp' | 'retryCount'>) => {
    const newItem: OfflineData = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    const updatedData = [...offlineData, newItem];
    setOfflineData(updatedData);
    setSyncStatus(prev => ({ ...prev, pendingItems: updatedData.length }));
    
    localStorage.setItem('sigdmus-offline-data', JSON.stringify(updatedData));
    
    toast({
      title: "Dados salvos offline",
      description: "Serão sincronizados quando você estiver online.",
    });
  }, [offlineData, toast]);

  // Sincronizar dados quando online
  const syncOfflineData = useCallback(async () => {
    if (offlineData.length === 0) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    const successfulItems: string[] = [];
    const failedItems: OfflineData[] = [];

    for (const item of offlineData) {
      try {
        // Simular chamada à API baseada no tipo
        await processOfflineItem(item);
        successfulItems.push(item.id);
      } catch (error) {
        console.error(`Erro ao sincronizar item ${item.id}:`, error);
        failedItems.push({
          ...item,
          retryCount: item.retryCount + 1,
        });
      }
    }

    // Remover itens sincronizados com sucesso
    const remainingItems = offlineData.filter(item => 
      !successfulItems.includes(item.id)
    );

    // Adicionar itens que falharam (com limite de tentativas)
    const finalItems = [
      ...remainingItems,
      ...failedItems.filter(item => item.retryCount < 3)
    ];

    setOfflineData(finalItems);
    setSyncStatus({
      isSyncing: false,
      pendingItems: finalItems.length,
      lastSync: new Date(),
      syncErrors: failedItems.map(item => `Erro ao sincronizar ${item.type}`),
    });

    localStorage.setItem('sigdmus-offline-data', JSON.stringify(finalItems));

    if (successfulItems.length > 0) {
      toast({
        title: "Sincronização concluída",
        description: `${successfulItems.length} itens sincronizados com sucesso.`,
      });
    }

    if (failedItems.length > 0) {
      toast({
        title: "Erros na sincronização",
        description: `${failedItems.length} itens falharam. Tentaremos novamente.`,
        variant: "destructive",
      });
    }
  }, [offlineData, toast]);

  // Processar item offline
  const processOfflineItem = async (item: OfflineData) => {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Aqui você implementaria as chamadas reais para sua API
        // await supabase.from('partituras').upsert(item.data);
        // await supabase.from('performances').upsert(item.data);
        // await supabase.auth.updateUser(item.data);
  };

  // Limpar dados offline
  const clearOfflineData = useCallback(() => {
    setOfflineData([]);
    setSyncStatus(prev => ({ ...prev, pendingItems: 0 }));
    localStorage.removeItem('sigdmus-offline-data');
    
    toast({
      title: "Dados offline limpos",
      description: "Todos os dados pendentes foram removidos.",
    });
  }, [toast]);

  // Detectar quando voltar online
  useEffect(() => {
    const handleOnline = () => {
      if (offlineData.length > 0) {
        syncOfflineData();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [offlineData, syncOfflineData]);

  return {
    offlineData,
    syncStatus,
    saveOfflineData,
    syncOfflineData,
    clearOfflineData,
  };
}; 