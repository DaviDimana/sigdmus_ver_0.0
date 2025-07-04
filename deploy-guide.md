# Guia Completo - Deploy SIGDMUS no VPS Hostinger com Cyber Panel

## 📋 Pré-requisitos
- VPS Hostinger com Ubuntu 20.04+ 
- Domínio configurado (ex: sigdmus.com)
- Acesso SSH ao VPS
- Cyber Panel instalado

## 🚀 Passo 1: Instalação do Cyber Panel (se não instalado)

```bash
# Conectar via SSH ao VPS
ssh root@82.25.74.109

# Baixar e executar o instalador do Cyber Panel
wget -O install.sh https://cyberpanel.net/install.sh
chmod +x install.sh
./install.sh

# Durante a instalação:
# - Escolha "1" para instalação completa
# - Defina senha do admin
# - Aguarde a conclusão (pode demorar 15-30 minutos)
```

## 🌐 Passo 2: Configuração do Website no Cyber Panel

1. **Acesse o Cyber Panel:**
   - URL: `https://82.25.74.109:8090`
   - Login: admin
   - Senha: (definida na instalação)

2. **Criar Website:**
   - Clique em "Websites" → "List Websites"
   - Clique em "Create Website"
   - Preencha:
     - Domain: `sigdmus.com`
     - Email: seu-email@exemplo.com
     - Package: Default
     - PHP: None (vamos usar Node.js)
   - Clique "Create Website"

3. **Configurar SSL:**
   - Vá em "Websites" → "List Websites"
   - Clique no ícone de cadeado ao lado do domínio
   - Escolha "Let's Encrypt SSL"
   - Aguarde a instalação

## 📦 Passo 3: Preparação do Projeto Local

### 3.1 Criar script de deploy
```bash
# No seu computador local, execute:
chmod +x deploy-to-vps.sh
./deploy-to-vps.sh
```

### 3.2 Configurar variáveis de ambiente
```bash
# Criar arquivo .env no backend
cd backend
cp .env.example .env
# Editar com suas configurações do Supabase
```

## 🔧 Passo 4: Deploy do Backend (Node.js)

### 4.1 Conectar via SSH e preparar ambiente
```bash
ssh root@82.25.74.109

# Instalar Node.js 18+ (se não instalado)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 4.2 Criar aplicação Node.js no Cyber Panel
1. No Cyber Panel: "Websites" → "List Websites"
2. Clique em "Manage" ao lado do sigdmus.com
3. Vá em "Node.js Apps"
4. Clique "Create Node.js App"
5. Preencha:
   - App Name: `sigdmus-api`
   - Node.js Version: 18
   - Port: `4000`
   - Startup File: `index.js`
   - App Domain: `api.sigdmus.com` (ou deixe vazio para usar subpath)

### 4.3 Fazer upload do backend
```bash
# No VPS, navegar para o diretório da aplicação
cd /home/sigdmus.com/nodejsapps/sigdmus-api

# Fazer upload dos arquivos (via SCP ou SFTP)
# Ou usar git clone se o projeto estiver no GitHub
```

### 4.4 Instalar dependências e iniciar
```bash
cd /home/sigdmus.com/nodejsapps/sigdmus-api
npm install --production
npm start
```

## 🎨 Passo 5: Deploy do Frontend

### 5.1 Build local do frontend
```bash
# No seu computador local
npm run build
```

### 5.2 Upload dos arquivos estáticos
```bash
# Conectar via SFTP ou usar o File Manager do Cyber Panel
# Upload da pasta 'dist' para: /home/sigdmus.com/public_html/
```

### 5.3 Configurar Nginx (se necessário)
O Cyber Panel já configura automaticamente, mas você pode personalizar:
- Vá em "Websites" → "List Websites"
- Clique "Manage" → "Config"
- Edite o arquivo nginx.conf se necessário

## 🔄 Passo 6: Configuração Final

### 6.1 Testar a aplicação
- Frontend: https://sigdmus.com
- API: https://sigdmus.com/api/ (ou https://api.sigdmus.com)

### 6.2 Configurar domínio personalizado para API (opcional)
1. No Cyber Panel: "Websites" → "Create Website"
2. Domain: `api.sigdmus.com`
3. Configurar proxy para porta 4000

### 6.3 Configurar PM2 para auto-restart
```bash
# No VPS
npm install -g pm2
cd /home/sigdmus.com/nodejsapps/sigdmus-api
pm2 start index.js --name "sigdmus-api"
pm2 startup
pm2 save
```

## 🛠️ Passo 7: Scripts de Automação

### Script de Deploy Automático
```bash
#!/bin/bash
# deploy-to-vps.sh

echo "🚀 Iniciando deploy do SIGDMUS..."

# Build do frontend
echo "📦 Fazendo build do frontend..."
npm run build

# Upload via SCP
echo "📤 Fazendo upload dos arquivos..."
scp -r dist/* root@82.25.74.109:/home/sigdmus.com/public_html/
scp -r backend/* root@82.25.74.109:/home/sigdmus.com/nodejsapps/sigdmus-api/

# Reiniciar serviços
echo "🔄 Reiniciando serviços..."
ssh root@82.25.74.109 "cd /home/sigdmus.com/nodejsapps/sigdmus-api && npm install && pm2 restart sigdmus-api"

echo "✅ Deploy concluído!"
```

## 🔍 Passo 8: Troubleshooting

### Problemas Comuns:

1. **Erro de permissão:**
```bash
chmod -R 755 /home/sigdmus.com/public_html/
chown -R sigdmus:sigdmus /home/sigdmus.com/
```

2. **Porta 4000 não acessível:**
```bash
# Verificar se o Node.js está rodando
pm2 status
pm2 logs sigdmus-api
```

3. **SSL não funciona:**
- Verificar se o domínio está apontando para o IP correto
- Aguardar propagação do DNS (pode levar até 24h)

## 📊 Monitoramento

### Logs importantes:
- Nginx: `/var/log/nginx/`
- Node.js: `pm2 logs sigdmus-api`
- Cyber Panel: `/usr/local/CyberCP/logs/`

### Comandos úteis:
```bash
# Status dos serviços
pm2 status
systemctl status nginx

# Logs em tempo real
pm2 logs sigdmus-api --lines 100
tail -f /var/log/nginx/access.log
```

## 🔒 Segurança

1. **Firewall:**
```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

2. **Backup automático:**
- Configure backup no Cyber Panel
- Backup do banco Supabase
- Backup dos uploads

## ✅ Checklist Final

- [ ] Cyber Panel instalado
- [ ] Website criado no painel
- [ ] SSL configurado
- [ ] Node.js app criado
- [ ] Backend funcionando
- [ ] Frontend buildado e uploadado
- [ ] PM2 configurado
- [ ] Domínio apontando para o VPS
- [ ] Testes realizados
- [ ] Backup configurado

---

**🎉 Parabéns! Seu SIGDMUS está no ar!**

Para dúvidas ou problemas, consulte:
- Logs do sistema
- Documentação do Cyber Panel
- Comunidade do Cyber Panel 