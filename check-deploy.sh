#!/bin/bash

# Script de Verificação Pós-Deploy para SIGDMUS
# Verifica se todos os serviços estão funcionando corretamente

set -e

# Configurações
VPS_IP="82.25.74.109"
DOMAIN="sigdmus.com"
API_URL="https://${DOMAIN}/api"
FRONTEND_URL="https://${DOMAIN}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

step() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] 🔍 $1${NC}"
}

# Função para testar conectividade
test_url() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    step "Testando $description..."
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        log "$description está funcionando (Status: $expected_status)"
        return 0
    else
        error "$description não está respondendo corretamente"
        return 1
    fi
}

# Função para verificar serviço no VPS
check_service() {
    local service=$1
    local description=$2
    
    step "Verificando $description..."
    
    if ssh root@${VPS_IP} "systemctl is-active --quiet $service"; then
        log "$description está rodando"
        return 0
    else
        error "$description não está rodando"
        return 1
    fi
}

echo "🔍 Iniciando verificação pós-deploy do SIGDMUS..."
echo "=================================================="

# Contadores para relatório final
total_checks=0
passed_checks=0
failed_checks=0

# 1. Verificar conectividade SSH
step "Verificando conectividade SSH..."
if ssh -o ConnectTimeout=10 root@${VPS_IP} "echo 'SSH OK'" > /dev/null 2>&1; then
    log "Conectividade SSH OK"
    ((passed_checks++))
else
    error "Não foi possível conectar via SSH"
    ((failed_checks++))
fi
((total_checks++))

# 2. Verificar serviços no VPS
step "Verificando serviços no VPS..."

services=(
    "nginx:Web Server (Nginx)"
    "pm2-root:PM2 Process Manager"
)

for service_info in "${services[@]}"; do
    IFS=':' read -r service description <<< "$service_info"
    if check_service "$service" "$description"; then
        ((passed_checks++))
    else
        ((failed_checks++))
    fi
    ((total_checks++))
done

# 3. Verificar aplicação Node.js
step "Verificando aplicação Node.js..."
if ssh root@${VPS_IP} "pm2 list | grep -q sigdmus-api"; then
    log "Aplicação Node.js (sigdmus-api) está rodando"
    ((passed_checks++))
else
    error "Aplicação Node.js não está rodando"
    ((failed_checks++))
fi
((total_checks++))

# 4. Verificar portas
step "Verificando portas..."
ports=(
    "80:HTTP"
    "443:HTTPS"
    "4000:Node.js API"
    "8090:Cyber Panel"
)

for port_info in "${ports[@]}"; do
    IFS=':' read -r port description <<< "$port_info"
    if ssh root@${VPS_IP} "netstat -tlnp | grep -q :$port"; then
        log "Porta $port ($description) está aberta"
        ((passed_checks++))
    else
        error "Porta $port ($description) não está aberta"
        ((failed_checks++))
    fi
    ((total_checks++))
done

# 5. Verificar diretórios
step "Verificando diretórios do projeto..."
directories=(
    "/home/${DOMAIN}/public_html:Frontend"
    "/home/${DOMAIN}/nodejsapps/sigdmus-api:Backend"
    "/var/www/sigdmus-uploads:Uploads"
)

for dir_info in "${directories[@]}"; do
    IFS=':' read -r directory description <<< "$dir_info"
    if ssh root@${VPS_IP} "[ -d '$directory' ]"; then
        log "Diretório $description existe"
        ((passed_checks++))
    else
        error "Diretório $description não existe"
        ((failed_checks++))
    fi
    ((total_checks++))
done

# 6. Verificar arquivos críticos
step "Verificando arquivos críticos..."
critical_files=(
    "/home/${DOMAIN}/public_html/index.html:Frontend Index"
    "/home/${DOMAIN}/nodejsapps/sigdmus-api/index.js:Backend Entry"
    "/home/${DOMAIN}/nodejsapps/sigdmus-api/package.json:Backend Package"
)

for file_info in "${critical_files[@]}"; do
    IFS=':' read -r file description <<< "$file_info"
    if ssh root@${VPS_IP} "[ -f '$file' ]"; then
        log "Arquivo $description existe"
        ((passed_checks++))
    else
        error "Arquivo $description não existe"
        ((failed_checks++))
    fi
    ((total_checks++))
done

# 7. Verificar SSL
step "Verificando certificados SSL..."
if ssh root@${VPS_IP} "[ -f '/etc/letsencrypt/live/${DOMAIN}/fullchain.pem' ]"; then
    log "Certificado SSL para ${DOMAIN} existe"
    ((passed_checks++))
else
    warn "Certificado SSL para ${DOMAIN} não encontrado"
    ((failed_checks++))
fi
((total_checks++))

# 8. Testar URLs (se o domínio estiver configurado)
step "Testando URLs da aplicação..."

# Verificar se o domínio está resolvendo
if nslookup ${DOMAIN} > /dev/null 2>&1; then
    log "Domínio ${DOMAIN} está resolvendo"
    
    # Testar frontend
    if test_url "$FRONTEND_URL" "Frontend (${DOMAIN})"; then
        ((passed_checks++))
    else
        ((failed_checks++))
    fi
    ((total_checks++))
    
    # Testar API
    if test_url "$API_URL" "API (${DOMAIN}/api)" "404"; then
        ((passed_checks++))
    else
        ((failed_checks++))
    fi
    ((total_checks++))
    
    # Testar SSL
    if curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q "200\|301\|302"; then
        log "SSL está funcionando"
        ((passed_checks++))
    else
        warn "SSL pode não estar funcionando"
        ((failed_checks++))
    fi
    ((total_checks++))
else
    warn "Domínio ${DOMAIN} não está resolvendo - pulando testes de URL"
fi

# 9. Verificar logs
step "Verificando logs..."
log_files=(
    "/var/log/nginx/error.log:Nginx Error Log"
    "/home/${DOMAIN}/nodejsapps/sigdmus-api/.pm2/logs/sigdmus-api-error.log:PM2 Error Log"
)

for log_info in "${log_files[@]}"; do
    IFS=':' read -r log_file description <<< "$log_info"
    if ssh root@${VPS_IP} "[ -f '$log_file' ]"; then
        log "Log $description existe"
        ((passed_checks++))
    else
        warn "Log $description não existe"
        ((failed_checks++))
    fi
    ((total_checks++))
done

# 10. Verificar uso de recursos
step "Verificando uso de recursos..."
echo "=== Uso de Recursos ==="
ssh root@${VPS_IP} "
    echo 'CPU:'
    top -bn1 | grep 'Cpu(s)' | awk '{print \$2}' | cut -d'%' -f1
    echo 'Memória:'
    free -h | grep Mem | awk '{print \$3}' | cut -d'G' -f1
    echo 'Disco:'
    df -h / | tail -1 | awk '{print \$5}' | cut -d'%' -f1
"

# Relatório final
echo ""
echo "=================================================="
echo "📊 RELATÓRIO FINAL DE VERIFICAÇÃO"
echo "=================================================="
echo "Total de verificações: $total_checks"
echo "✅ Passou: $passed_checks"
echo "❌ Falhou: $failed_checks"
echo "📈 Taxa de sucesso: $(( (passed_checks * 100) / total_checks ))%"

if [ $failed_checks -eq 0 ]; then
    echo ""
    log "🎉 TODOS OS TESTES PASSARAM! O SIGDMUS está funcionando perfeitamente!"
    echo ""
    echo "🔗 Links da aplicação:"
    echo "   - Frontend: $FRONTEND_URL"
    echo "   - API: $API_URL"
    echo "   - Cyber Panel: https://${VPS_IP}:8090"
    echo ""
    echo "💡 Próximos passos:"
    echo "   1. Teste todas as funcionalidades da aplicação"
    echo "   2. Configure backup automático"
    echo "   3. Configure monitoramento"
    echo "   4. Documente as configurações"
else
    echo ""
    warn "⚠️  ALGUNS TESTES FALHARAM. Verifique os problemas acima."
    echo ""
    echo "🔧 Comandos para troubleshooting:"
    echo "   - Logs da API: ssh root@${VPS_IP} 'pm2 logs sigdmus-api'"
    echo "   - Status PM2: ssh root@${VPS_IP} 'pm2 status'"
    echo "   - Logs Nginx: ssh root@${VPS_IP} 'tail -f /var/log/nginx/error.log'"
    echo "   - Status serviços: ssh root@${VPS_IP} 'systemctl status nginx'"
fi

echo ""
echo "📋 Checklist de segurança:"
echo "   - [ ] Firewall configurado"
echo "   - [ ] SSL funcionando"
echo "   - [ ] Backup configurado"
echo "   - [ ] Monitoramento ativo"
echo "   - [ ] Logs sendo monitorados" 