import { useState, useEffect, useCallback } from 'react';

interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  deferredPrompt: any;
  updateAvailable: boolean;
}

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWA = () => {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstalled: false,
    isOnline: navigator.onLine,
    canInstall: false,
    deferredPrompt: null,
    updateAvailable: false,
  });

  useEffect(() => {
    // Verificar se já está instalado
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setPwaState(prev => ({ ...prev, isInstalled: true }));
      }
    };

    // Verificar conectividade
    const handleOnline = () => setPwaState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setPwaState(prev => ({ ...prev, isOnline: false }));

    // Capturar evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaState(prev => ({ 
        ...prev, 
        canInstall: true, 
        deferredPrompt: e as InstallPromptEvent 
      }));
    };

    // Capturar evento de instalação concluída
    const handleAppInstalled = () => {
      setPwaState(prev => ({ 
        ...prev, 
        isInstalled: true, 
        canInstall: false,
        deferredPrompt: null 
      }));
    };

    // Verificar atualizações do Service Worker
    const checkForUpdates = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setPwaState(prev => ({ ...prev, updateAvailable: true }));
                }
              });
            }
          });
        });
      }
    };

    // Event listeners
    checkIfInstalled();
    checkForUpdates();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Função para instalar PWA
  const installPWA = async (): Promise<boolean> => {
    if (!pwaState.deferredPrompt) {
      console.log('PWA install prompt not available');
      return false;
    }

    try {
      pwaState.deferredPrompt.prompt();
      const { outcome } = await pwaState.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installed successfully');
        setPwaState(prev => ({ 
          ...prev, 
          isInstalled: true, 
          canInstall: false,
          deferredPrompt: null 
        }));
        return true;
      } else {
        console.log('PWA install dismissed');
        return false;
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  };

  // Função para atualizar PWA
  const updatePWA = () => {
    if (pwaState.updateAvailable && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      });
    }
  };

  // Função para sincronizar dados offline
  const syncOfflineData = async () => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync');
        console.log('Background sync registered');
      } catch (error) {
        console.error('Error registering background sync:', error);
      }
    }
  };

  // Função para solicitar notificações
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  // Função para enviar notificação
  const sendNotification = (title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      });
    }
  };

  // Forçar atualização do service worker
  const forceUpdateSW = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.waiting) {
          // Enviar mensagem para o service worker se atualizar
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          // Recarregar a página após atualização
          window.location.reload();
        }
      } catch (error) {
        console.error('Erro ao atualizar service worker:', error);
      }
    }
  }, []);

  return {
    ...pwaState,
    installPWA,
    updatePWA,
    syncOfflineData,
    requestNotificationPermission,
    sendNotification,
    forceUpdateSW,
  };
}; 