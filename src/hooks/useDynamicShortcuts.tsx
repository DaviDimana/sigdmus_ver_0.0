import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

interface DynamicShortcut {
  name: string;
  short_name: string;
  description: string;
  url: string;
  icon: string;
  category: 'recent' | 'favorite' | 'quick' | 'custom';
  timestamp: number;
  usageCount: number;
}

export const useDynamicShortcuts = () => {
  const [shortcuts, setShortcuts] = useState<DynamicShortcut[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se atalhos dinâmicos são suportados
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 
                       'beforeinstallprompt' in window;
      setIsSupported(supported);
      return supported;
    };

    if (checkSupport()) {
      loadShortcuts();
    }
  }, []);

  // Carregar atalhos salvos
  const loadShortcuts = () => {
    try {
      const saved = localStorage.getItem('sigdmus-dynamic-shortcuts');
      if (saved) {
        const parsed = JSON.parse(saved);
        setShortcuts(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar atalhos:', error);
    }
  };

  // Salvar atalhos
  const saveShortcuts = useCallback((newShortcuts: DynamicShortcut[]) => {
    try {
      localStorage.setItem('sigdmus-dynamic-shortcuts', JSON.stringify(newShortcuts));
      setShortcuts(newShortcuts);
    } catch (error) {
      console.error('Erro ao salvar atalhos:', error);
    }
  }, []);

  // Adicionar atalho dinâmico
  const addShortcut = useCallback((shortcut: Omit<DynamicShortcut, 'timestamp' | 'usageCount'>) => {
    const newShortcut: DynamicShortcut = {
      ...shortcut,
      timestamp: Date.now(),
      usageCount: 0,
    };

    const updated = [...shortcuts, newShortcut];
    saveShortcuts(updated);

    // Atualizar manifest dinamicamente
    updateManifestShortcuts(updated);

    toast({
      title: "Atalho criado",
      description: `${shortcut.name} foi adicionado aos atalhos.`,
    });
  }, [shortcuts, saveShortcuts, toast]);

  // Remover atalho
  const removeShortcut = useCallback((name: string) => {
    const updated = shortcuts.filter(s => s.name !== name);
    saveShortcuts(updated);
    updateManifestShortcuts(updated);

    toast({
      title: "Atalho removido",
      description: "O atalho foi removido com sucesso.",
    });
  }, [shortcuts, saveShortcuts, toast]);

  // Registrar uso de atalho
  const useShortcut = useCallback((name: string) => {
    const updated = shortcuts.map(s => 
      s.name === name 
        ? { ...s, usageCount: s.usageCount + 1, timestamp: Date.now() }
        : s
    );
    saveShortcuts(updated);
  }, [shortcuts, saveShortcuts]);

  // Adicionar partitura recente como atalho
  const addRecentPartitura = useCallback((partitura: { id: string; title: string; composer: string }) => {
    const shortcut: Omit<DynamicShortcut, 'timestamp' | 'usageCount'> = {
      name: `Ver ${partitura.title}`,
      short_name: partitura.title,
      description: `Abrir partitura ${partitura.title} de ${partitura.composer}`,
      url: `/partituras/${partitura.id}`,
      icon: '/icons/shortcut-partitura.png',
      category: 'recent',
    };

    addShortcut(shortcut);
  }, [addShortcut]);

  // Adicionar performance recente como atalho
  const addRecentPerformance = useCallback((performance: { id: string; title: string; date: string }) => {
    const shortcut: Omit<DynamicShortcut, 'timestamp' | 'usageCount'> = {
      name: `Ver ${performance.title}`,
      short_name: performance.title,
      description: `Abrir performance ${performance.title} de ${performance.date}`,
      url: `/performances/${performance.id}`,
      icon: '/icons/shortcut-performance.png',
      category: 'recent',
    };

    addShortcut(shortcut);
  }, [addShortcut]);

  // Adicionar atalho favorito
  const addFavoriteShortcut = useCallback((name: string, url: string, description: string) => {
    const shortcut: Omit<DynamicShortcut, 'timestamp' | 'usageCount'> = {
      name,
      short_name: name,
      description,
      url,
      icon: '/icons/shortcut-favorite.png',
      category: 'favorite',
    };

    addShortcut(shortcut);
  }, [addShortcut]);

  // Limpar atalhos antigos
  const cleanupOldShortcuts = useCallback(() => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const updated = shortcuts.filter(s => 
      s.category !== 'recent' || s.timestamp > thirtyDaysAgo
    );

    if (updated.length !== shortcuts.length) {
      saveShortcuts(updated);
      updateManifestShortcuts(updated);
      
      toast({
        title: "Atalhos limpos",
        description: "Atalhos antigos foram removidos automaticamente.",
      });
    }
  }, [shortcuts, saveShortcuts, toast]);

  // Obter atalhos mais usados
  const getMostUsedShortcuts = useCallback((limit: number = 5) => {
    return shortcuts
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }, [shortcuts]);

  // Obter atalhos por categoria
  const getShortcutsByCategory = useCallback((category: DynamicShortcut['category']) => {
    return shortcuts.filter(s => s.category === category);
  }, [shortcuts]);

  // Atualizar manifest dinamicamente
  const updateManifestShortcuts = useCallback((newShortcuts: DynamicShortcut[]) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Enviar mensagem para o service worker atualizar o manifest
        registration.active?.postMessage({
          type: 'UPDATE_SHORTCUTS',
          shortcuts: newShortcuts.map(s => ({
            name: s.name,
            short_name: s.short_name,
            description: s.description,
            url: s.url,
            icons: [{ src: s.icon, sizes: '96x96' }],
          })),
        });
      });
    }
  }, []);

  // Limpar todos os atalhos
  const clearAllShortcuts = useCallback(() => {
    saveShortcuts([]);
    updateManifestShortcuts([]);
    
    toast({
      title: "Atalhos limpos",
      description: "Todos os atalhos foram removidos.",
    });
  }, [saveShortcuts, updateManifestShortcuts, toast]);

  // Auto-limpeza de atalhos antigos
  useEffect(() => {
    const interval = setInterval(cleanupOldShortcuts, 24 * 60 * 60 * 1000); // Diário
    return () => clearInterval(interval);
  }, [cleanupOldShortcuts]);

  return {
    shortcuts,
    isSupported,
    addShortcut,
    removeShortcut,
    useShortcut,
    addRecentPartitura,
    addRecentPerformance,
    addFavoriteShortcut,
    getMostUsedShortcuts,
    getShortcutsByCategory,
    clearAllShortcuts,
    cleanupOldShortcuts,
  };
}; 