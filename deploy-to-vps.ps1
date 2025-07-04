# Script de Deploy para SIGDMUS no VPS Hostinger (PowerShell)
# Este script deve ser executado no Windows após o build local

Write-Host "🚀 Iniciando deploy do SIGDMUS..." -ForegroundColor Green

# Configurações
$DOMAIN = "sigdmus.com"
$VPS_USER = "root"
$VPS_IP = "82.25.74.109"
$FRONTEND_DIR = "/home/sigdmus.com/public_html"
$BACKEND_DIR = "/home/sigdmus-backend"
$UPLOADS_DIR = "/var/www/sigdmus-uploads"

# Verificar se o build existe
if (-not (Test-Path "dist")) {
    Write-Host "❌ Pasta 'dist' não encontrada. Execute 'npm run build' primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se o backend existe
if (-not (Test-Path "backend")) {
    Write-Host "❌ Pasta 'backend' não encontrada." -ForegroundColor Red
    exit 1
}

try {
    # 1. Backup do frontend atual
    Write-Host "📦 Fazendo backup do frontend atual..." -ForegroundColor Yellow
    $backupDate = Get-Date -Format "yyyyMMdd_HHmmss"
    ssh "${VPS_USER}@${VPS_IP}" "cp -r $FRONTEND_DIR ${FRONTEND_DIR}_backup_${backupDate}"

    # 2. Upload do frontend buildado
    Write-Host "📤 Enviando frontend para o VPS..." -ForegroundColor Yellow
    scp -r dist/* "${VPS_USER}@${VPS_IP}:${FRONTEND_DIR}/"

    # 3. Configurar permissões
    Write-Host "🔐 Configurando permissões..." -ForegroundColor Yellow
    ssh "${VPS_USER}@${VPS_IP}" "chown -R www-data:www-data $FRONTEND_DIR"
    ssh "${VPS_USER}@${VPS_IP}" "chmod -R 755 $FRONTEND_DIR"

    # 4. Criar diretório de uploads se não existir
    Write-Host "📁 Configurando diretório de uploads..." -ForegroundColor Yellow
    ssh "${VPS_USER}@${VPS_IP}" "mkdir -p $UPLOADS_DIR"
    ssh "${VPS_USER}@${VPS_IP}" "chown -R www-data:www-data $UPLOADS_DIR"
    ssh "${VPS_USER}@${VPS_IP}" "chmod -R 755 $UPLOADS_DIR"

    # 5. Upload do backend atualizado
    Write-Host "📤 Enviando backend para o VPS..." -ForegroundColor Yellow
    scp -r backend/* "${VPS_USER}@${VPS_IP}:${BACKEND_DIR}/"

    # 6. Instalar dependências do backend
    Write-Host "📦 Instalando dependências do backend..." -ForegroundColor Yellow
    ssh "${VPS_USER}@${VPS_IP}" "cd $BACKEND_DIR && npm install --production"

    # 7. Configurar Nginx
    Write-Host "⚙️ Configurando Nginx..." -ForegroundColor Yellow
    scp nginx-sigdmus.conf "${VPS_USER}@${VPS_IP}:/tmp/nginx-sigdmus.conf"
    ssh "${VPS_USER}@${VPS_IP}" "cp /tmp/nginx-sigdmus.conf /home/sigdmus.com/nginx.conf"

    # 8. Reiniciar serviços
    Write-Host "🔄 Reiniciando serviços..." -ForegroundColor Yellow
    ssh "${VPS_USER}@${VPS_IP}" "systemctl restart nginx"
    ssh "${VPS_USER}@${VPS_IP}" "pm2 restart sigdmus-backend || pm2 start $BACKEND_DIR/index.js --name sigdmus-backend"

    # 9. Verificar status
    Write-Host "✅ Verificando status dos serviços..." -ForegroundColor Green
    ssh "${VPS_USER}@${VPS_IP}" "systemctl status nginx --no-pager"
    ssh "${VPS_USER}@${VPS_IP}" "pm2 status"

    # 10. Testar endpoints
    Write-Host "🧪 Testando endpoints..." -ForegroundColor Green
    Write-Host "Frontend: https://$DOMAIN" -ForegroundColor Cyan
    Write-Host "API Health: https://$DOMAIN/health" -ForegroundColor Cyan
    Write-Host "Uploads: https://$DOMAIN/uploads/" -ForegroundColor Cyan

    # 11. Limpar arquivos temporários
    Write-Host "🧹 Limpando arquivos temporários..." -ForegroundColor Yellow
    ssh "${VPS_USER}@${VPS_IP}" "rm -f /tmp/nginx-sigdmus.conf"

    Write-Host "🎉 Deploy concluído com sucesso!" -ForegroundColor Green
    Write-Host "🌐 Acesse: https://$DOMAIN" -ForegroundColor Cyan
    Write-Host "📊 Monitoramento: pm2 monit" -ForegroundColor Cyan

} catch {
    Write-Host "❌ Erro durante o deploy: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} 