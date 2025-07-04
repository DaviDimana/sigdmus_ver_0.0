# 🚀 Guia de Deploy - SIGDMUS

Este guia explica como fazer o deploy do projeto no VPS da Hostinger.

## 📋 Pré-requisitos

- VPS com 100GB de espaço
- Node.js 18+ instalado
- Nginx configurado
- SSL/HTTPS configurado
- Acesso root ao servidor

## 🏗️ Estrutura do Projeto

```
VPS Hostinger:
├── Frontend (React/TypeScript) → /var/www/sigdmus
├── Backend (Node.js/Express) → Porta 4000
├── Uploads → /var/www/sigdmus-uploads
└── Nginx → Proxy reverso

Supabase:
├── Banco de dados
├── Autenticação
└── Storage (fallback)
```

## 🔧 Configuração do Ambiente

### 1. Preparar o VPS

```bash
# Conectar ao VPS
ssh root@82.25.74.109

# Criar diretórios necessários
mkdir -p /var/www/sigdmus
mkdir -p /var/www/sigdmus-uploads
chown -R www-data:www-data /var/www/sigdmus-uploads
chmod 755 /var/www/sigdmus-uploads
```

### 2. Configurar Nginx

```bash
# Criar configuração do site
nano /etc/nginx/sites-available/sigdmus

# Conteúdo da configuração (ver deploy.config.js)
# ...

# Ativar o site
ln -s /etc/nginx/sites-available/sigdmus /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 3. Configurar SSL

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx

# Obter certificado SSL
certbot --nginx -d www.sigdmus.com
```

## 📦 Deploy do Frontend

### 1. Build Local

```bash
# No seu computador local
npm run build

# Verificar se o build foi criado
ls -la dist/
```

### 2. Upload para o VPS

```bash
# Usando SCP ou SFTP
scp -r dist/* root@82.25.74.109:/var/www/sigdmus/

# Ou usando rsync
rsync -avz --delete dist/ root@82.25.74.109:/var/www/sigdmus/
```

### 3. Configurar permissões

```bash
# No VPS
chown -R www-data:www-data /var/www/sigdmus
chmod -R 755 /var/www/sigdmus
```

## 🔌 Deploy do Backend

### 1. Upload do código

```bash
# Upload do backend
scp index.js package.json root@82.25.74.109:/var/www/sigdmus-backend/
```

### 2. Instalar dependências

```bash
# No VPS
cd /var/www/sigdmus-backend
npm install --production
```

### 3. Configurar PM2

```bash
# Instalar PM2
npm install -g pm2

# Criar arquivo de configuração
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'sigdmus-api',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    }
  }]
};
```

### 4. Iniciar o serviço

```bash
# Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔍 Verificação do Deploy

### 1. Testar Frontend

```bash
# Verificar se o site está acessível
curl -I https://www.sigdmus.com
```

### 2. Testar API

```bash
# Testar endpoint de upload
curl -X POST https://www.sigdmus.com/api/upload \
  -F "file=@teste.txt"
```

### 3. Verificar logs

```bash
# Logs do PM2
pm2 logs sigdmus-api

# Logs do Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 🛠️ Troubleshooting

### Problemas Comuns

1. **CORS Errors**
   - Verificar configuração de CORS no backend
   - Confirmar domínios permitidos

2. **Uploads não funcionam**
   - Verificar permissões da pasta `/var/www/sigdmus-uploads`
   - Confirmar se o Nginx está servindo `/uploads/`

3. **Build não carrega**
   - Verificar se os arquivos estão em `/var/www/sigdmus`
   - Confirmar configuração do Nginx para SPA routing

### Comandos Úteis

```bash
# Reiniciar serviços
pm2 restart sigdmus-api
systemctl reload nginx

# Verificar status
pm2 status
systemctl status nginx

# Limpar cache
pm2 flush
nginx -s reload
```

## 📝 Variáveis de Ambiente

Criar arquivo `.env` no backend:

```env
NODE_ENV=production
PORT=4000
UPLOADS_DIR=/var/www/sigdmus-uploads
```

## 🔄 Atualizações

Para atualizar o projeto:

1. Fazer build local: `npm run build`
2. Upload dos arquivos para o VPS
3. Reiniciar o backend: `pm2 restart sigdmus-api`
4. Verificar se tudo está funcionando

## 📞 Suporte

Em caso de problemas:
1. Verificar logs do PM2 e Nginx
2. Testar endpoints individualmente
3. Verificar configurações de CORS e SSL 