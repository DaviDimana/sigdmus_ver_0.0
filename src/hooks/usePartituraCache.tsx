import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

interface PartituraCache {
  id: string;
  title: string;
  composer: string;
  instrument: string;
  pdfUrl: string;
  lastAccessed: number;
  size: number;
  isDownloaded: boolean;
}

interface CacheStats {
  totalSize: number;
  itemCount: number;
  availableSpace: number;
}

export const usePartituraCache = () => {
  const [cachedPartituras, setCachedPartituras] = useState<PartituraCache[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    totalSize: 0,
    itemCount: 0,
    availableSpace: 0,
  });
  const { toast } = useToast();

  // Carregar cache do IndexedDB
  useEffect(() => {
    loadCacheFromStorage();
    calculateCacheStats();
  }, []);

  // Carregar cache do storage
  const loadCacheFromStorage = async () => {
    try {
      const saved = localStorage.getItem('sigdmus-partitura-cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCachedPartituras(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar cache:', error);
    }
  };

  // Salvar cache no storage
  const saveCacheToStorage = useCallback((cache: PartituraCache[]) => {
    try {
      localStorage.setItem('sigdmus-partitura-cache', JSON.stringify(cache));
    } catch (error) {
      console.error('Erro ao salvar cache:', error);
    }
  }, []);

  // Calcular estatísticas do cache
  const calculateCacheStats = useCallback(async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        setCacheStats(prev => ({
          ...prev,
          availableSpace: (estimate.quota || 0) - (estimate.usage || 0),
        }));
      } catch (error) {
        console.error('Erro ao calcular espaço disponível:', error);
      }
    }

    const totalSize = cachedPartituras.reduce((sum, item) => sum + item.size, 0);
    setCacheStats(prev => ({
      ...prev,
      totalSize,
      itemCount: cachedPartituras.length,
    }));
  }, [cachedPartituras]);

  // Adicionar partitura ao cache
  const cachePartitura = useCallback(async (partitura: Omit<PartituraCache, 'lastAccessed' | 'isDownloaded'>) => {
    try {
      // Verificar se já está no cache
      const existingIndex = cachedPartituras.findIndex(p => p.id === partitura.id);
      
      if (existingIndex >= 0) {
        // Atualizar último acesso
        const updated = [...cachedPartituras];
        updated[existingIndex] = {
          ...updated[existingIndex],
          lastAccessed: Date.now(),
        };
        setCachedPartituras(updated);
        saveCacheToStorage(updated);
        return true;
      }

      // Verificar espaço disponível
      if (partitura.size > cacheStats.availableSpace && cacheStats.availableSpace > 0) {
        // Limpar cache antigo se necessário
        await cleanupOldCache(partitura.size);
      }

      // Baixar e armazenar partitura
      const downloaded = await downloadAndStorePartitura(partitura);
      
      if (downloaded) {
        const newCacheItem: PartituraCache = {
          ...partitura,
          lastAccessed: Date.now(),
          isDownloaded: true,
        };

        const updated = [...cachedPartituras, newCacheItem];
        setCachedPartituras(updated);
        saveCacheToStorage(updated);
        
        toast({
          title: "Partitura em cache",
          description: `${partitura.title} foi salva para uso offline.`,
        });

        calculateCacheStats();
        return true;
      }
    } catch (error) {
      console.error('Erro ao cachear partitura:', error);
      toast({
        title: "Erro ao salvar partitura",
        description: "Não foi possível salvar para uso offline.",
        variant: "destructive",
      });
    }
    return false;
  }, [cachedPartituras, cacheStats.availableSpace, saveCacheToStorage, calculateCacheStats, toast]);

  // Baixar e armazenar partitura
  const downloadAndStorePartitura = async (partitura: Omit<PartituraCache, 'lastAccessed' | 'isDownloaded'>): Promise<boolean> => {
    try {
      const response = await fetch(partitura.pdfUrl);
      if (!response.ok) throw new Error('Erro ao baixar partitura');

      const blob = await response.blob();
      
      // Armazenar no Cache API
      const cache = await caches.open('sigdmus-partituras');
      await cache.put(partitura.pdfUrl, new Response(blob));
      
      return true;
    } catch (error) {
      console.error('Erro ao baixar partitura:', error);
      return false;
    }
  };

  // Obter partitura do cache
  const getCachedPartitura = useCallback(async (id: string): Promise<Blob | null> => {
    try {
      const partitura = cachedPartituras.find(p => p.id === id);
      if (!partitura || !partitura.isDownloaded) return null;

      // Atualizar último acesso
      const updated = cachedPartituras.map(p => 
        p.id === id ? { ...p, lastAccessed: Date.now() } : p
      );
      setCachedPartituras(updated);
      saveCacheToStorage(updated);

      // Buscar do Cache API
      const cache = await caches.open('sigdmus-partituras');
      const response = await cache.match(partitura.pdfUrl);
      
      if (response) {
        return await response.blob();
      }
    } catch (error) {
      console.error('Erro ao obter partitura do cache:', error);
    }
    return null;
  }, [cachedPartituras, saveCacheToStorage]);

  // Verificar se partitura está em cache
  const isPartituraCached = useCallback((id: string): boolean => {
    return cachedPartituras.some(p => p.id === id && p.isDownloaded);
  }, [cachedPartituras]);

  // Limpar cache antigo
  const cleanupOldCache = async (requiredSpace: number) => {
    // Ordenar por último acesso (mais antigo primeiro)
    const sorted = [...cachedPartituras].sort((a, b) => a.lastAccessed - b.lastAccessed);
    
    let freedSpace = 0;
    const toRemove: string[] = [];

    for (const partitura of sorted) {
      if (freedSpace >= requiredSpace) break;
      
      toRemove.push(partitura.id);
      freedSpace += partitura.size;
    }

    // Remover do cache
    const updated = cachedPartituras.filter(p => !toRemove.includes(p.id));
    setCachedPartituras(updated);
    saveCacheToStorage(updated);

    // Remover do Cache API
    const cache = await caches.open('sigdmus-partituras');
    for (const id of toRemove) {
      const partitura = cachedPartituras.find(p => p.id === id);
      if (partitura) {
        await cache.delete(partitura.pdfUrl);
      }
    }

    toast({
      title: "Cache limpo",
      description: `${toRemove.length} partituras antigas foram removidas.`,
    });
  };

  // Limpar cache completo
  const clearAllCache = useCallback(async () => {
    try {
      // Limpar Cache API
      const cache = await caches.open('sigdmus-partituras');
      await cache.keys().then(keys => Promise.all(keys.map(key => cache.delete(key))));
      
      // Limpar estado
      setCachedPartituras([]);
      saveCacheToStorage([]);
      
      toast({
        title: "Cache limpo",
        description: "Todas as partituras foram removidas do cache.",
      });
      
      calculateCacheStats();
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }, [saveCacheToStorage, calculateCacheStats, toast]);

  // Remover partitura específica do cache
  const removeFromCache = useCallback(async (id: string) => {
    try {
      const partitura = cachedPartituras.find(p => p.id === id);
      if (!partitura) return;

      // Remover do Cache API
      const cache = await caches.open('sigdmus-partituras');
      await cache.delete(partitura.pdfUrl);

      // Remover do estado
      const updated = cachedPartituras.filter(p => p.id !== id);
      setCachedPartituras(updated);
      saveCacheToStorage(updated);

      toast({
        title: "Partitura removida",
        description: `${partitura.title} foi removida do cache.`,
      });

      calculateCacheStats();
    } catch (error) {
      console.error('Erro ao remover do cache:', error);
    }
  }, [cachedPartituras, saveCacheToStorage, calculateCacheStats, toast]);

  return {
    cachedPartituras,
    cacheStats,
    cachePartitura,
    getCachedPartitura,
    isPartituraCached,
    clearAllCache,
    removeFromCache,
  };
}; 