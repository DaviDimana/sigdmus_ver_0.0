import { useState, useEffect, useCallback } from 'react';

interface PWAMetrics {
  installTime: number | null;
  firstLaunch: number | null;
  sessionCount: number;
  totalUsageTime: number;
  offlineUsageTime: number;
  cacheHits: number;
  cacheMisses: number;
  pushNotificationsReceived: number;
  pushNotificationsClicked: number;
  shortcutsUsed: number;
  lastSyncTime: number | null;
  syncSuccessCount: number;
  syncErrorCount: number;
}

interface UserBehavior {
  mostUsedFeatures: Record<string, number>;
  averageSessionDuration: number;
  preferredTimes: Record<string, number>;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
}

export const usePWAAnalytics = () => {
  const [metrics, setMetrics] = useState<PWAMetrics>({
    installTime: null,
    firstLaunch: null,
    sessionCount: 0,
    totalUsageTime: 0,
    offlineUsageTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    pushNotificationsReceived: 0,
    pushNotificationsClicked: 0,
    shortcutsUsed: 0,
    lastSyncTime: null,
    syncSuccessCount: 0,
    syncErrorCount: 0,
  });

  const [userBehavior, setUserBehavior] = useState<UserBehavior>({
    mostUsedFeatures: {},
    averageSessionDuration: 0,
    preferredTimes: {},
    deviceType: 'desktop',
    browser: '',
    os: '',
  });

  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());

  // Carregar métricas salvas
  useEffect(() => {
    loadMetrics();
    detectDeviceInfo();
    startSession();
  }, []);

  // Carregar métricas do localStorage
  const loadMetrics = () => {
    try {
      const savedMetrics = localStorage.getItem('sigdmus-pwa-metrics');
      const savedBehavior = localStorage.getItem('sigdmus-user-behavior');
      
      if (savedMetrics) {
        setMetrics(JSON.parse(savedMetrics));
      }
      
      if (savedBehavior) {
        setUserBehavior(JSON.parse(savedBehavior));
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    }
  };

  // Salvar métricas
  const saveMetrics = useCallback((newMetrics: PWAMetrics) => {
    try {
      localStorage.setItem('sigdmus-pwa-metrics', JSON.stringify(newMetrics));
      setMetrics(newMetrics);
    } catch (error) {
      console.error('Erro ao salvar métricas:', error);
    }
  }, []);

  // Salvar comportamento do usuário
  const saveUserBehavior = useCallback((newBehavior: UserBehavior) => {
    try {
      localStorage.setItem('sigdmus-user-behavior', JSON.stringify(newBehavior));
      setUserBehavior(newBehavior);
    } catch (error) {
      console.error('Erro ao salvar comportamento:', error);
    }
  }, []);

  // Detectar informações do dispositivo
  const detectDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    const browser = getBrowserInfo(userAgent);
    const os = getOSInfo(userAgent);
    const deviceType = getDeviceType();

    setUserBehavior(prev => ({
      ...prev,
      browser,
      os,
      deviceType,
    }));
  };

  // Iniciar sessão
  const startSession = () => {
    const now = Date.now();
    setSessionStartTime(now);
    
    // Verificar se é primeira execução
    if (!metrics.firstLaunch) {
      setMetrics(prev => ({
        ...prev,
        firstLaunch: now,
        sessionCount: 1,
      }));
    } else {
      setMetrics(prev => ({
        ...prev,
        sessionCount: prev.sessionCount + 1,
      }));
    }
  };

  // Finalizar sessão
  const endSession = useCallback(() => {
    const sessionDuration = Date.now() - sessionStartTime;
    
    setMetrics(prev => ({
      ...prev,
      totalUsageTime: prev.totalUsageTime + sessionDuration,
    }));

    // Calcular duração média da sessão
    const newAverageDuration = (metrics.totalUsageTime + sessionDuration) / metrics.sessionCount;
    setUserBehavior(prev => ({
      ...prev,
      averageSessionDuration: newAverageDuration,
    }));
  }, [sessionStartTime, metrics.totalUsageTime, metrics.sessionCount]);

  // Registrar instalação
  const recordInstall = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      installTime: Date.now(),
    }));
  }, []);

  // Registrar uso offline
  const recordOfflineUsage = useCallback((duration: number) => {
    setMetrics(prev => ({
      ...prev,
      offlineUsageTime: prev.offlineUsageTime + duration,
    }));
  }, []);

  // Registrar cache hit/miss
  const recordCacheHit = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      cacheHits: prev.cacheHits + 1,
    }));
  }, []);

  const recordCacheMiss = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      cacheMisses: prev.cacheMisses + 1,
    }));
  }, []);

  // Registrar notificação push
  const recordPushNotification = useCallback((clicked: boolean = false) => {
    setMetrics(prev => ({
      ...prev,
      pushNotificationsReceived: prev.pushNotificationsReceived + 1,
      pushNotificationsClicked: clicked 
        ? prev.pushNotificationsClicked + 1 
        : prev.pushNotificationsClicked,
    }));
  }, []);

  // Registrar uso de atalho
  const recordShortcutUsage = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      shortcutsUsed: prev.shortcutsUsed + 1,
    }));
  }, []);

  // Registrar sincronização
  const recordSync = useCallback((success: boolean) => {
    setMetrics(prev => ({
      ...prev,
      lastSyncTime: Date.now(),
      syncSuccessCount: success ? prev.syncSuccessCount + 1 : prev.syncSuccessCount,
      syncErrorCount: success ? prev.syncErrorCount : prev.syncErrorCount + 1,
    }));
  }, []);

  // Registrar uso de funcionalidade
  const recordFeatureUsage = useCallback((feature: string) => {
    setUserBehavior(prev => ({
      ...prev,
      mostUsedFeatures: {
        ...prev.mostUsedFeatures,
        [feature]: (prev.mostUsedFeatures[feature] || 0) + 1,
      },
    }));
  }, []);

  // Registrar horário de uso
  const recordUsageTime = useCallback(() => {
    const hour = new Date().getHours();
    const timeSlot = `${hour}:00-${hour + 1}:00`;
    
    setUserBehavior(prev => ({
      ...prev,
      preferredTimes: {
        ...prev.preferredTimes,
        [timeSlot]: (prev.preferredTimes[timeSlot] || 0) + 1,
      },
    }));
  }, []);

  // Obter relatório de métricas
  const getMetricsReport = useCallback(() => {
    const cacheHitRate = metrics.cacheHits + metrics.cacheMisses > 0 
      ? (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100 
      : 0;

    const pushClickRate = metrics.pushNotificationsReceived > 0 
      ? (metrics.pushNotificationsClicked / metrics.pushNotificationsReceived) * 100 
      : 0;

    const syncSuccessRate = metrics.syncSuccessCount + metrics.syncErrorCount > 0 
      ? (metrics.syncSuccessCount / (metrics.syncSuccessCount + metrics.syncErrorCount)) * 100 
      : 0;

    return {
      ...metrics,
      cacheHitRate: Math.round(cacheHitRate),
      pushClickRate: Math.round(pushClickRate),
      syncSuccessRate: Math.round(syncSuccessRate),
      averageSessionDuration: Math.round(userBehavior.averageSessionDuration / 1000 / 60), // em minutos
      topFeatures: Object.entries(userBehavior.mostUsedFeatures)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([feature, count]) => ({ feature, count })),
      preferredTimeSlots: Object.entries(userBehavior.preferredTimes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([timeSlot, count]) => ({ timeSlot, count })),
    };
  }, [metrics, userBehavior]);

  // Enviar métricas para servidor
  const sendMetricsToServer = useCallback(async () => {
    try {
      const report = getMetricsReport();
      
      // Aqui você enviaria para sua API de analytics
      await fetch('/api/analytics/pwa-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });
    } catch (error) {
      console.error('Erro ao enviar métricas:', error);
    }
  }, [getMetricsReport]);

  // Limpar métricas
  const clearMetrics = useCallback(() => {
    const defaultMetrics: PWAMetrics = {
      installTime: null,
      firstLaunch: null,
      sessionCount: 0,
      totalUsageTime: 0,
      offlineUsageTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      pushNotificationsReceived: 0,
      pushNotificationsClicked: 0,
      shortcutsUsed: 0,
      lastSyncTime: null,
      syncSuccessCount: 0,
      syncErrorCount: 0,
    };

    const defaultBehavior: UserBehavior = {
      mostUsedFeatures: {},
      averageSessionDuration: 0,
      preferredTimes: {},
      deviceType: 'desktop',
      browser: '',
      os: '',
    };

    saveMetrics(defaultMetrics);
    saveUserBehavior(defaultBehavior);
  }, [saveMetrics, saveUserBehavior]);

  // Salvar métricas periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      saveMetrics(metrics);
      saveUserBehavior(userBehavior);
    }, 60000); // A cada minuto

    return () => clearInterval(interval);
  }, [metrics, userBehavior, saveMetrics, saveUserBehavior]);

  // Finalizar sessão quando a página for fechada
  useEffect(() => {
    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [endSession]);

  return {
    metrics,
    userBehavior,
    recordInstall,
    recordOfflineUsage,
    recordCacheHit,
    recordCacheMiss,
    recordPushNotification,
    recordShortcutUsage,
    recordSync,
    recordFeatureUsage,
    recordUsageTime,
    getMetricsReport,
    sendMetricsToServer,
    clearMetrics,
  };
};

// Funções auxiliares
const getBrowserInfo = (userAgent: string): string => {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
};

const getOSInfo = (userAgent: string): string => {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
};

const getDeviceType = (): 'mobile' | 'desktop' | 'tablet' => {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent);
  
  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'desktop';
}; 