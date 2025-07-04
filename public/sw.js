// Service Worker para SiGDMus PWA
const CACHE_NAME = 'sigdmus-v1.0.1';
const STATIC_CACHE = 'sigdmus-static-v1.0.1';
const DYNAMIC_CACHE = 'sigdmus-dynamic-v1.0.1';
const PAGES_CACHE = 'sigdmus-pages-v1.0.1';

// Arquivos para cache estático
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png'
];

// Rotas principais da aplicação para cache
const APP_ROUTES = [
  '/',
  '/dashboard',
  '/partituras',
  '/performances',
  '/usuarios',
  '/relatorios',
  '/configuracoes',
  '/perfil'
];

// Estratégias de cache
const CACHE_STRATEGIES = {
  // Cache First para arquivos estáticos
  STATIC: 'static',
  // Network First para API calls
  API: 'api',
  // Stale While Revalidate para outros recursos
  DYNAMIC: 'dynamic'
};

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Cacheando arquivos estáticos');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Service Worker instalado com sucesso');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Erro na instalação:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker ativado');
        return self.clients.claim();
      })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Pular requisições não-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Pular requisições para outros domínios (exceto a API local)
  if (url.origin !== location.origin && !url.hostname.includes('sigdmus.com')) {
    return;
  }
  
  // Estratégia baseada no tipo de requisição
  if (url.pathname.startsWith('/api/')) {
    // API calls - Network First
    event.respondWith(handleApiRequest(request));
  } else if (isStaticFile(url.pathname)) {
    // Arquivos estáticos - Cache First
    event.respondWith(handleStaticRequest(request));
  } else if (isAppRoute(url.pathname)) {
    // Rotas da aplicação - Cache First com fallback
    event.respondWith(handleAppRoute(request));
  } else {
    // Outros recursos - Stale While Revalidate
    event.respondWith(handleDynamicRequest(request));
  }
});

// Estratégia para requisições Supabase (Network First com cache inteligente)
async function handleSupabaseRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(DYNAMIC_CACHE);
  
  // Para autenticação, sempre tentar network primeiro
  if (url.pathname.includes('/auth/') || url.pathname.includes('/token')) {
    try {
      const networkResponse = await fetch(request);
      return networkResponse;
    } catch (error) {
      console.log('[SW] Supabase auth offline:', error);
      // Para auth, não usar cache - retornar erro
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'Autenticação requer conexão com internet.' 
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  // Para dados (partituras, performances, etc.)
  try {
    // Tentar network primeiro
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache da resposta para uso offline
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Supabase offline, tentando cache:', error);
    
    // Fallback para cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Resposta de erro offline para dados
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Dados não disponíveis offline. Verifique sua conexão.' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Estratégia para API calls (Network First)
async function handleApiRequest(request) {
  try {
    // Tentar network primeiro
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache da resposta para uso offline
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] API offline, tentando cache:', error);
    
    // Fallback para cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Resposta de erro offline
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Você está offline. Verifique sua conexão.' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Estratégia para arquivos estáticos (Cache First)
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Erro ao buscar arquivo estático:', error);
    return new Response('Arquivo não encontrado', { status: 404 });
  }
}

// Estratégia para recursos dinâmicos (Stale While Revalidate)
async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Buscar nova versão em background
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Ignorar erros de network
  });
  
  // Retornar cache se disponível, senão aguardar network
  return cachedResponse || networkPromise;
}

// Estratégia para rotas da aplicação (Cache First com fallback)
async function handleAppRoute(request) {
  const cache = await caches.open(PAGES_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Retornar cache se disponível
    return cachedResponse;
  }
  
  try {
    // Tentar buscar da rede
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache da resposta
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] App route offline, retornando index.html:', error);
    
    // Fallback para index.html (SPA fallback)
    const fallbackResponse = await cache.match('/index.html');
    if (fallbackResponse) {
      return fallbackResponse;
    }
    
    // Último fallback
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>SiGDMus - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h1>🔄 SiGDMus</h1>
            <p>Você está offline. Algumas funcionalidades podem não estar disponíveis.</p>
            <p>Verifique sua conexão com a internet.</p>
            <button onclick="window.location.reload()">Tentar Novamente</button>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Verificar se é arquivo estático
function isStaticFile(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
    '.ico', '.woff', '.woff2', '.ttf', '.eot', '.pdf'
  ];
  
  return staticExtensions.some(ext => pathname.endsWith(ext)) ||
         pathname.startsWith('/icons/') ||
         pathname.startsWith('/assets/');
}

// Verificar se é rota da aplicação
function isAppRoute(pathname) {
  // Verificar se é uma rota da aplicação React
  return APP_ROUTES.includes(pathname) ||
         pathname.startsWith('/partituras/') ||
         pathname.startsWith('/performances/') ||
         pathname.startsWith('/usuarios/') ||
         pathname.startsWith('/relatorios/') ||
         pathname.startsWith('/configuracoes/') ||
         pathname.startsWith('/perfil/') ||
         pathname.startsWith('/dashboard/');
}

// Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Sincronização em background iniciada');
    event.waitUntil(performBackgroundSync());
  }
});

// Sincronização de dados offline
async function performBackgroundSync() {
  try {
    // Aqui você pode implementar sincronização de dados offline
    // Por exemplo, enviar dados salvos localmente para o servidor
    console.log('[SW] Sincronização concluída');
  } catch (error) {
    console.error('[SW] Erro na sincronização:', error);
  }
}

// Notificações push (opcional)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nova notificação do SiGDMus',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      },
      actions: [
        {
          action: 'open',
          title: 'Abrir',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'close',
          title: 'Fechar',
          icon: '/icons/icon-72x72.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'SiGDMus', options)
    );
  }
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || event.action === '') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
}); 