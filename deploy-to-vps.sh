#!/bin/bash

# Script de Deploy para SIGDMUS no VPS Hostinger
# Este script deve ser executado no VPS após o build local

set -e

echo "🚀 Iniciando deploy do SIGDMUS..."

# Configurações
DOMAIN="sigdmus.com"
VPS_USER="root"
VPS_IP="82.25.74.109"
FRONTEND_DIR="/home/sigdmus.com/public_html"
BACKEND_DIR="/home/sigdmus-backend"
UPLOADS_DIR="/var/www/sigdmus-uploads"

# 1. Backup do frontend atual
echo "📦 Fazendo backup do frontend atual..."
ssh $VPS_USER@$VPS_IP "cp -r $FRONTEND_DIR ${FRONTEND_DIR}_backup_$(date +%Y%m%d_%H%M%S)"

# 2. Upload do frontend buildado
echo "📤 Enviando frontend para o VPS..."
scp -r dist/* $VPS_USER@$VPS_IP:$FRONTEND_DIR/

# 3. Configurar permissões
echo "🔐 Configurando permissões..."
ssh $VPS_USER@$VPS_IP "chown -R www-data:www-data $FRONTEND_DIR"
ssh $VPS_USER@$VPS_IP "chmod -R 755 $FRONTEND_DIR"

# 4. Criar diretório de uploads se não existir
echo "📁 Configurando diretório de uploads..."
ssh $VPS_USER@$VPS_IP "mkdir -p $UPLOADS_DIR"
ssh $VPS_USER@$VPS_IP "chown -R www-data:www-data $UPLOADS_DIR"
ssh $VPS_USER@$VPS_IP "chmod -R 755 $UPLOADS_DIR"

# 5. Upload do backend atualizado
echo "📤 Enviando backend para o VPS..."
scp -r backend/* $VPS_USER@$VPS_IP:$BACKEND_DIR/

# 6. Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
ssh $VPS_USER@$VPS_IP "cd $BACKEND_DIR && npm install --production"

# 7. Configurar Nginx
echo "⚙️ Configurando Nginx..."
scp nginx-sigdmus.conf $VPS_USER@$VPS_IP:/tmp/nginx-sigdmus.conf
ssh $VPS_USER@$VPS_IP "cp /tmp/nginx-sigdmus.conf /home/sigdmus.com/nginx.conf"

# 8. Reiniciar serviços
echo "🔄 Reiniciando serviços..."
ssh $VPS_USER@$VPS_IP "systemctl restart nginx"
ssh $VPS_USER@$VPS_IP "pm2 restart sigdmus-backend || pm2 start $BACKEND_DIR/index.js --name sigdmus-backend"

# 9. Verificar status
echo "✅ Verificando status dos serviços..."
ssh $VPS_USER@$VPS_IP "systemctl status nginx --no-pager"
ssh $VPS_USER@$VPS_IP "pm2 status"

# 10. Testar endpoints
echo "🧪 Testando endpoints..."
echo "Frontend: https://$DOMAIN"
echo "API Health: https://$DOMAIN/health"
echo "Uploads: https://$DOMAIN/uploads/"

# 11. Limpar arquivos temporários
echo "🧹 Limpando arquivos temporários..."
ssh $VPS_USER@$VPS_IP "rm -f /tmp/nginx-sigdmus.conf"

echo "🎉 Deploy concluído com sucesso!"
echo "🌐 Acesse: https://$DOMAIN"
echo "📊 Monitoramento: pm2 monit" 