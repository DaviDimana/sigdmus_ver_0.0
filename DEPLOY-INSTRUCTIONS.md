# 🚀 Instruções de Deploy - SIGDMUS no VPS Hostinger

## 📋 Pré-requisitos

### No seu computador Windows:
- [Git Bash](https://git-scm.com/download/win) ou [WSL](https://docs.microsoft.com/en-us/windows/wsl/install)
- [Node.js](https://nodejs.org/) 18+
- [SSH Key](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent) configurada

### No VPS Hostinger:
- Ubuntu 20.04+
- Acesso root via SSH
- IP: `82.25.74.109`
- Domínio: `sigdmus.com` (configurado no DNS)

## 🎯 Passo a Passo Completo

### **Passo 1: Preparar o VPS**

1. **Conectar ao VPS:**
   ```bash
   ssh root@82.25.74.109
   ```

2. **Executar script de configuração:**
   ```bash
   # No VPS, baixar e executar o script
   wget https://raw.githubusercontent.com/seu-usuario/sigdmus/main/setup-vps.sh
   chmod +x setup-vps.sh
   ./setup-vps.sh
   ```

3. **Aguardar instalação do Cyber Panel (15-30 minutos)**

### **Passo 2: Configurar Cyber Panel**

1. **Acessar o painel:**
   - URL: `https://82.25.74.109:8090`
   - Login: `admin`
   - Senha: (definida durante a instalação)

2. **Criar Website:**
   - Clique em "Websites" → "List Websites"
   - Clique em "Create Website"
   - Preencha:
     - Domain: `sigdmus.com`
     - Email: seu-email@exemplo.com
     - Package: Default
     - PHP: None
   - Clique "Create Website"

3. **Configurar SSL:**
   - Vá em "Websites" → "List Websites"
   - Clique no ícone de cadeado ao lado do domínio
   - Escolha "Let's Encrypt SSL"
   - Aguarde a instalação

4. **Criar aplicação Node.js:**
   - Vá em "Websites" → "List Websites"
   - Clique "Manage" ao lado do sigdmus.com
   - Vá em "Node.js Apps"
   - Clique "Create Node.js App"
   - Preencha:
     - App Name: `sigdmus-api`
     - Node.js Version: 18
     - Port: `4000`
     - Startup File: `index.js`

### **Passo 3: Preparar o Projeto Local**

1. **No seu computador Windows, abra o Git Bash ou PowerShell**

2. **Navegar para o projeto:**
   ```bash
   cd /c/Users/Davi\ Dimana/Documents/GitHub/sigdmus_ver_0.0
   ```

3. **Instalar dependências:**
   ```bash
   npm install
   ```

4. **Testar build local:**
   ```bash
   npm run build
   ```

### **Passo 4: Fazer Deploy**

#### **Opção A: Deploy Manual (Recomendado para primeira vez)**

1. **Build do frontend:**
   ```bash
   npm run build
   ```

2. **Upload do frontend (via SFTP ou Cyber Panel):**
   - Use o File Manager do Cyber Panel
   - Ou use um cliente SFTP como FileZilla
   - Upload da pasta `dist/*` para `/home/sigdmus.com/public_html/`

3. **Upload do backend:**
   ```bash
   # Via SCP (Git Bash)
   scp -r backend/* root@82.25.74.109:/home/sigdmus.com/nodejsapps/sigdmus-api/
   ```

4. **Configurar backend no VPS:**
   ```bash
   ssh root@82.25.74.109
   cd /home/sigdmus.com/nodejsapps/sigdmus-api
   npm install --production
   pm2 start index.js --name sigdmus-api
   pm2 save
   pm2 startup
   ```

#### **Opção B: Deploy Automático (Após configuração inicial)**

1. **Tornar script executável (Git Bash):**
   ```bash
   chmod +x deploy-to-vps.sh
   ```

2. **Executar deploy:**
   ```bash
   ./deploy-to-vps.sh
   ```

### **Passo 5: Verificar Deploy**

1. **Executar verificação:**
   ```bash
   chmod +x check-deploy.sh
   ./check-deploy.sh
   ```

2. **Testar manualmente:**
   - Frontend: https://sigdmus.com
   - API: https://sigdmus.com/api/
   - Cyber Panel: https://82.25.74.109:8090

## 🔧 Configurações Específicas

### **Configurar Nginx (se necessário)**

1. **No Cyber Panel:**
   - Vá em "Websites" → "List Websites"
   - Clique "Manage" → "Config"
   - Edite o arquivo nginx.conf

2. **Ou copiar configuração otimizada:**
   ```bash
   # No VPS
   cp nginx-sigdmus.conf /home/sigdmus.com/nginx.conf
   ```

### **Configurar Variáveis de Ambiente**

1. **Criar arquivo .env no backend:**
   ```bash
   # No VPS
   cd /home/sigdmus.com/nodejsapps/sigdmus-api
   cat > .env << EOF
   NODE_ENV=production
   PORT=4000
   UPLOADS_DIR=/var/www/sigdmus-uploads
   EOF
   ```

### **Configurar Backup Automático**

1. **No VPS, o script já configura backup diário**
2. **Verificar configuração:**
   ```bash
   crontab -l
   ```

## 🚨 Troubleshooting

### **Problemas Comuns:**

1. **Erro de permissão:**
   ```bash
   ssh root@82.25.74.109
   chmod -R 755 /home/sigdmus.com/public_html/
   chown -R www-data:www-data /home/sigdmus.com/
   ```

2. **API não responde:**
   ```bash
   ssh root@82.25.74.109
   pm2 status
   pm2 logs sigdmus-api
   ```

3. **SSL não funciona:**
   - Verificar se o domínio aponta para o IP correto
   - Aguardar propagação do DNS (até 24h)
   - Verificar certificado no Cyber Panel

4. **Build falha:**
   ```bash
   # Limpar cache
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

### **Comandos Úteis:**

```bash
# Status dos serviços
ssh root@82.25.74.109 "pm2 status"
ssh root@82.25.74.109 "systemctl status nginx"

# Logs em tempo real
ssh root@82.25.74.109 "pm2 logs sigdmus-api --lines 100"

# Reiniciar serviços
ssh root@82.25.74.109 "pm2 restart sigdmus-api"
ssh root@82.25.74.109 "systemctl restart nginx"

# Verificar uso de recursos
ssh root@82.25.74.109 "htop"
ssh root@82.25.74.109 "df -h"
```

## 📊 Monitoramento

### **Ferramentas Disponíveis:**

1. **Cyber Panel Dashboard:**
   - https://82.25.74.109:8090
   - Monitoramento de recursos
   - Logs centralizados
   - Backup automático

2. **Comandos de monitoramento:**
   ```bash
   # Status geral
   ssh root@82.25.74.109 "sigdmus-status.sh"
   
   # Logs específicos
   ssh root@82.25.74.109 "tail -f /var/log/nginx/access.log"
   ssh root@82.25.74.109 "pm2 logs sigdmus-api"
   ```

## 🔒 Segurança

### **Configurações Recomendadas:**

1. **Firewall (já configurado pelo script):**
   - Porta 22 (SSH)
   - Porta 80 (HTTP)
   - Porta 443 (HTTPS)
   - Porta 8090 (Cyber Panel)

2. **SSL/HTTPS:**
   - Certificado Let's Encrypt automático
   - Redirecionamento HTTP → HTTPS

3. **Backup:**
   - Backup diário automático
   - Retenção de 7 dias
   - Backup dos uploads e código

## ✅ Checklist Final

- [ ] VPS configurado com Cyber Panel
- [ ] Website criado no painel
- [ ] SSL configurado
- [ ] Node.js app criado
- [ ] Frontend buildado e uploadado
- [ ] Backend configurado e rodando
- [ ] PM2 configurado
- [ ] Domínio apontando para o VPS
- [ ] Testes realizados
- [ ] Backup configurado
- [ ] Monitoramento ativo

## 🎉 Sucesso!

Seu SIGDMUS está no ar! 

**Links importantes:**
- 🌐 Frontend: https://sigdmus.com
- 🔧 API: https://sigdmus.com/api/
- 📊 Painel: https://82.25.74.109:8090

**Para atualizações futuras:**
```bash
# Apenas execute o script de deploy
./deploy-to-vps.sh
```

---

**💡 Dica:** Mantenha este arquivo atualizado com suas configurações específicas! 