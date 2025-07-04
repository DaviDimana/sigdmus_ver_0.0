#!/bin/bash

# Script de Configuração Inicial do VPS Hostinger
# Para SIGDMUS com Cyber Panel

set -e

# Configurações
VPS_IP="82.25.74.109"
DOMAIN="sigdmus.com"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

step() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] 🔄 $1${NC}"
}

log "🚀 Iniciando configuração do VPS para SIGDMUS..."

# Verificar se o script está sendo executado no VPS
if [ "$(hostname)" != "localhost" ] && [ "$(hostname)" != "sigdmus" ]; then
    error "Este script deve ser executado no VPS, não localmente"
    echo "Execute: ssh root@${VPS_IP}"
    exit 1
fi

# Passo 1: Atualizar sistema
step "Atualizando sistema..."
apt update && apt upgrade -y

# Passo 2: Instalar dependências básicas
step "Instalando dependências básicas..."
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Passo 3: Instalar Node.js 18
step "Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Verificar instalação
log "✅ Node.js $(node --version) instalado"
log "✅ NPM $(npm --version) instalado"

# Passo 4: Instalar PM2 globalmente
step "Instalando PM2..."
npm install -g pm2

# Passo 5: Configurar firewall
step "Configurando firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 8090/tcp  # Cyber Panel
ufw --force enable

log "✅ Firewall configurado"

# Passo 6: Instalar Cyber Panel (se não instalado)
if [ ! -d "/usr/local/CyberCP" ]; then
    step "Instalando Cyber Panel..."
    wget -O install.sh https://cyberpanel.net/install.sh
    chmod +x install.sh
    ./install.sh
else
    log "✅ Cyber Panel já está instalado"
fi

# Passo 7: Criar diretórios necessários
step "Criando diretórios do projeto..."
mkdir -p /home/${DOMAIN}/public_html
mkdir -p /home/${DOMAIN}/nodejsapps/sigdmus-api
mkdir -p /var/www/sigdmus-uploads

# Passo 8: Configurar permissões
step "Configurando permissões..."
chown -R www-data:www-data /home/${DOMAIN}
chown -R www-data:www-data /var/www/sigdmus-uploads
chmod -R 755 /home/${DOMAIN}
chmod -R 755 /var/www/sigdmus-uploads

# Passo 9: Configurar variáveis de ambiente
step "Configurando variáveis de ambiente..."
cat > /home/${DOMAIN}/nodejsapps/sigdmus-api/.env << EOF
NODE_ENV=production
PORT=4000
UPLOADS_DIR=/var/www/sigdmus-uploads
EOF

# Passo 10: Configurar logrotate para PM2
step "Configurando logrotate..."
cat > /etc/logrotate.d/pm2 << EOF
/home/${DOMAIN}/nodejsapps/sigdmus-api/.pm2/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
EOF

# Passo 11: Configurar monitoramento básico
step "Configurando monitoramento..."
npm install -g pm2-logrotate
pm2 install pm2-logrotate

# Passo 12: Criar script de backup
step "Criando script de backup..."
cat > /usr/local/bin/backup-sigdmus.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/sigdmus"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup dos uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/sigdmus-uploads

# Backup do código
tar -czf $BACKUP_DIR/code_$DATE.tar.gz /home/sigdmus.com

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup concluído: $BACKUP_DIR"
EOF

chmod +x /usr/local/bin/backup-sigdmus.sh

# Passo 13: Configurar cron para backup diário
step "Configurando backup automático..."
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-sigdmus.sh") | crontab -

# Passo 14: Configurar monitoramento de recursos
step "Configurando monitoramento de recursos..."
apt install -y htop iotop

# Passo 15: Criar script de status
step "Criando script de status..."
cat > /usr/local/bin/sigdmus-status.sh << 'EOF'
#!/bin/bash
echo "=== Status do SIGDMUS ==="
echo "Data: $(date)"
echo ""
echo "=== Status PM2 ==="
pm2 status
echo ""
echo "=== Status Nginx ==="
systemctl status nginx --no-pager -l
echo ""
echo "=== Uso de Disco ==="
df -h
echo ""
echo "=== Uso de Memória ==="
free -h
echo ""
echo "=== Últimos logs da API ==="
pm2 logs sigdmus-api --lines 20 --nostream
EOF

chmod +x /usr/local/bin/sigdmus-status.sh

# Passo 16: Configurar SSL automático (se domínio estiver configurado)
step "Configurando SSL automático..."
if command -v certbot &> /dev/null; then
    log "✅ Certbot já instalado"
else
    apt install -y certbot python3-certbot-nginx
fi

# Passo 17: Configurar otimizações do sistema
step "Configurando otimizações do sistema..."

# Otimizar Nginx
cat > /etc/nginx/conf.d/sigdmus-optimizations.conf << EOF
# Otimizações para SIGDMUS
client_max_body_size 100M;
client_body_timeout 60s;
client_header_timeout 60s;

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# Cache para arquivos estáticos
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
EOF

# Passo 18: Configurar swap (se necessário)
step "Configurando swap..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    log "✅ Swap de 2GB configurado"
else
    log "✅ Swap já configurado"
fi

# Passo 19: Configurar timezone
step "Configurando timezone..."
timedatectl set-timezone America/Sao_Paulo

# Passo 20: Configurar hostname
step "Configurando hostname..."
echo "sigdmus" > /etc/hostname
hostnamectl set-hostname sigdmus

# Finalização
log "🎉 Configuração do VPS concluída!"
echo ""
log "📋 Próximos passos:"
echo "   1. Acesse o Cyber Panel: https://${VPS_IP}:8090"
echo "   2. Crie o website: ${DOMAIN}"
echo "   3. Configure SSL com Let's Encrypt"
echo "   4. Execute o deploy: ./deploy-to-vps.sh"
echo ""
log "🔗 Comandos úteis:"
echo "   - Status: sigdmus-status.sh"
echo "   - Backup: backup-sigdmus.sh"
echo "   - Logs: pm2 logs sigdmus-api"
echo "   - Monitor: htop"
echo ""
log "📊 Monitoramento:"
echo "   - Cyber Panel: https://${VPS_IP}:8090"
echo "   - Frontend: https://${DOMAIN}"
echo "   - API: https://${DOMAIN}/api/" 