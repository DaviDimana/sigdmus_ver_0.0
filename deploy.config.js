// Configuração para deploy no VPS Hostinger
export const deployConfig = {
  // Configurações do VPS
  vps: {
    domain: 'www.sigdmus.com',
    ip: '82.25.74.109',
    uploadsPath: '/var/www/sigdmus-uploads',
    nginxConfig: '/etc/nginx/sites-available/sigdmus',
  },
  
  // Configurações do backend
  backend: {
    port: 4000,
    nodeEnv: 'production',
    corsOrigins: [
      'https://www.sigdmus.com',
      'http://82.25.74.109'
    ]
  },
  
  // Configurações do frontend
  frontend: {
    buildDir: 'dist',
    nginxRoot: '/var/www/sigdmus',
    staticFiles: ['index.html', 'assets/']
  },
};

// Função para gerar configuração do Nginx
export const generateNginxConfig = () => {
  return `
server {
    listen 80;
    server_name ${deployConfig.vps.domain} ${deployConfig.vps.ip};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${deployConfig.vps.domain} ${deployConfig.vps.ip};
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/${deployConfig.vps.domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${deployConfig.vps.domain}/privkey.pem;
    
    # Frontend
    root ${deployConfig.frontend.nginxRoot};
    index index.html;
    
    # API Backend
    location /api/ {
        proxy_pass http://localhost:${deployConfig.backend.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Uploads
    location /uploads/ {
        alias ${deployConfig.vps.uploadsPath}/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Static files
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
`;
}; 