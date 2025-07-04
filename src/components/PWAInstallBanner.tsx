import React from 'react';
import { usePWA } from '../hooks/usePWA';
import { Button } from './ui/button';
import { X, Download, Wifi, WifiOff } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { 
    canInstall, 
    isInstalled, 
    isOnline, 
    updateAvailable, 
    installPWA, 
    updatePWA 
  } = usePWA();

  // Não mostrar se já estiver instalado
  if (isInstalled) {
    return null;
  }

  // Banner de atualização disponível
  if (updateAvailable) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Download className="h-5 w-5" />
            <div>
              <p className="font-medium">Nova versão disponível!</p>
              <p className="text-sm opacity-90">Atualize para obter as últimas funcionalidades.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={updatePWA}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              Atualizar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Banner de instalação
  if (canInstall) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Download className="h-5 w-5" />
            <div>
              <p className="font-medium">Instalar SiGDMus</p>
              <p className="text-sm opacity-90">
                Instale o app para acesso rápido e funcionalidades offline.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={installPWA}
              className="bg-white text-purple-600 hover:bg-gray-100"
            >
              Instalar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Banner de status offline
  if (!isOnline) {
    return (
      <div className="fixed top-4 left-4 right-4 bg-yellow-600 text-white p-3 rounded-lg shadow-lg z-50">
        <div className="flex items-center justify-center space-x-2">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">
            Você está offline. Algumas funcionalidades podem estar limitadas.
          </span>
        </div>
      </div>
    );
  }

  return null;
};

// Componente para mostrar status PWA no header
export const PWAStatus: React.FC = () => {
  const { isOnline, isInstalled } = usePWA();

  return (
    <div className="flex items-center space-x-2">
      {isInstalled && (
        <div className="flex items-center space-x-1 text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs">App</span>
        </div>
      )}
      
      <div className="flex items-center space-x-1">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-yellow-500" />
        )}
      </div>
    </div>
  );
};

// Componente para menu PWA
export const PWAMenu: React.FC = () => {
  const { 
    isInstalled, 
    canInstall, 
    installPWA, 
    requestNotificationPermission,
    sendNotification 
  } = usePWA();

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      // Mostrar notificação de sucesso
      sendNotification('SiGDMus instalado!', {
        body: 'O app foi instalado com sucesso no seu dispositivo.',
        icon: '/icons/icon-192x192.png'
      });
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      sendNotification('Notificações ativadas!', {
        body: 'Você receberá notificações sobre atualizações e atividades.',
        icon: '/icons/icon-192x192.png'
      });
    }
  };

  return (
    <div className="space-y-2">
      {!isInstalled && canInstall && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleInstall}
          className="w-full justify-start"
        >
          <Download className="h-4 w-4 mr-2" />
          Instalar App
        </Button>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleEnableNotifications}
        className="w-full justify-start"
      >
        <Wifi className="h-4 w-4 mr-2" />
        Ativar Notificações
      </Button>
      
      {isInstalled && (
        <div className="text-xs text-green-600 flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          App instalado
        </div>
      )}
    </div>
  );
}; 