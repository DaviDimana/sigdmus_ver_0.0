import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export const usePushNotifications = () => {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se notificações push são suportadas
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 
                       'PushManager' in window && 
                       'Notification' in window;
      setIsSupported(supported);
      return supported;
    };

    if (checkSupport()) {
      checkSubscription();
    }
  }, []);

  // Verificar se já está inscrito
  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setSubscription(existingSubscription);
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Erro ao verificar inscrição:', error);
    }
  };

  // Solicitar permissão e inscrever
  const subscribeToPush = async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações push.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Solicitar permissão
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: "Permissão negada",
          description: "Você precisa permitir notificações para receber atualizações.",
          variant: "destructive",
        });
        return false;
      }

      // Registrar service worker
      const registration = await navigator.serviceWorker.ready;
      
      // Gerar chaves VAPID (você precisará configurar isso no servidor)
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa1HxFRPz4KjZ1MOnM';
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      // Inscrever para push
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      setSubscription(pushSubscription);
      setIsSubscribed(true);

      // Enviar inscrição para o servidor
      await sendSubscriptionToServer(pushSubscription);

      toast({
        title: "Notificações ativadas!",
        description: "Você receberá notificações sobre atualizações importantes.",
      });

      return true;
    } catch (error) {
      console.error('Erro ao inscrever para push:', error);
      toast({
        title: "Erro ao ativar notificações",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Cancelar inscrição
  const unsubscribeFromPush = async (): Promise<boolean> => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);
        setIsSubscribed(false);
        
        // Remover do servidor
        await removeSubscriptionFromServer(subscription);
        
        toast({
          title: "Notificações desativadas",
          description: "Você não receberá mais notificações push.",
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
      return false;
    }
  };

  // Enviar notificação local
  const sendLocalNotification = useCallback((data: NotificationData) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/icon-72x72.png',
        tag: data.tag,
        data: data.data,
        actions: data.actions,
        requireInteraction: true,
        silent: false,
      });

      // Lidar com cliques na notificação
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        
        // Navegar para a página relevante
        if (data.data?.url) {
          window.location.href = data.data.url;
        }
      };

      return notification;
    }
  }, []);

  // Enviar inscrição para o servidor
  const sendSubscriptionToServer = async (pushSubscription: PushSubscription) => {
    try {
      // Aqui você enviaria para sua API
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pushSubscription),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar inscrição para o servidor');
      }
    } catch (error) {
      console.error('Erro ao enviar inscrição:', error);
    }
  };

  // Remover inscrição do servidor
  const removeSubscriptionFromServer = async (pushSubscription: PushSubscription) => {
    try {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pushSubscription),
      });
    } catch (error) {
      console.error('Erro ao remover inscrição:', error);
    }
  };

  // Converter chave VAPID
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  return {
    isSupported,
    isSubscribed,
    subscription,
    subscribeToPush,
    unsubscribeFromPush,
    sendLocalNotification,
  };
}; 