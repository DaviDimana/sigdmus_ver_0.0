#!/bin/bash

# Script de build para produção
echo "🚀 Iniciando build de produção..."

# Limpar builds anteriores
echo "🧹 Limpando builds anteriores..."
rm -rf dist

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci --only=production

# Build de produção
echo "🔨 Criando build de produção..."
npm run build

# Verificar se o build foi bem-sucedido
if [ -d "dist" ]; then
    echo "✅ Build concluído com sucesso!"
    echo "📁 Arquivos gerados em: dist/"
    echo "📊 Tamanho do build:"
    du -sh dist/
else
    echo "❌ Erro no build!"
    exit 1
fi

echo "�� Build finalizado!" 