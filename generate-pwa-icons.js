#!/usr/bin/env node

/**
 * Script para gerar ícones PWA
 * 
 * Este script gera todos os ícones necessários para PWA a partir do favicon.ico
 * 
 * Pré-requisitos:
 * - Node.js
 * - sharp: npm install sharp
 * 
 * Uso:
 * node generate-pwa-icons.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tamanhos de ícones necessários para PWA
const ICON_SIZES = [
  16, 32, 72, 96, 128, 144, 152, 192, 384, 512
];

// Tamanhos para Apple Touch Icons
const APPLE_ICON_SIZES = [
  180, 167, 152, 120, 87, 80, 76, 60, 40, 29
];

// Tamanhos para ícones de atalho
const SHORTCUT_ICON_SIZES = [
  96
];

async function generateIcons() {
  console.log('🎨 Gerando ícones PWA...');
  
  // Verificar se o favicon existe
  const faviconPath = path.join(__dirname, 'public', 'favicon.ico');
  if (!fs.existsSync(faviconPath)) {
    console.error('❌ favicon.ico não encontrado em public/');
    console.log('💡 Crie um favicon.ico de alta qualidade (pelo menos 512x512)');
    return;
  }
  
  // Verificar se o ícone fonte existe
  const iconSourcePath = path.join(__dirname, 'public', 'icon-source.svg');
  if (!fs.existsSync(iconSourcePath)) {
    console.error('❌ icon-source.svg não encontrado em public/');
    console.log('💡 Crie um icon-source.svg de alta qualidade (512x512)');
    return;
  }
  
  // Criar diretório de ícones se não existir
  const iconsDir = path.join(__dirname, 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  // Criar diretório de screenshots se não existir
  const screenshotsDir = path.join(__dirname, 'public', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  try {
    // Gerar ícones padrão
    console.log('📱 Gerando ícones padrão...');
    for (const size of ICON_SIZES) {
      await generateIcon(size, `icon-${size}x${size}.png`);
    }
    
    // Gerar ícones Apple
    console.log('🍎 Gerando ícones Apple...');
    for (const size of APPLE_ICON_SIZES) {
      await generateIcon(size, `apple-touch-icon-${size}x${size}.png`);
    }
    
    // Gerar ícones de atalho
    console.log('⚡ Gerando ícones de atalho...');
    for (const size of SHORTCUT_ICON_SIZES) {
      await generateShortcutIcon(size);
    }
    
    // Gerar ícone maskable (com padding)
    console.log('🎭 Gerando ícone maskable...');
    await generateMaskableIcon();
    
    console.log('✅ Todos os ícones foram gerados com sucesso!');
    console.log('');
    console.log('📁 Ícones gerados em: public/icons/');
    console.log('📋 Próximos passos:');
    console.log('   1. Verifique se os ícones estão corretos');
    console.log('   2. Atualize o manifest.json se necessário');
    console.log('   3. Teste a instalação PWA');
    
  } catch (error) {
    console.error('❌ Erro ao gerar ícones:', error);
  }
}

async function generateIcon(size, filename) {
  const inputPath = path.join(__dirname, 'public', 'icon-source.svg');
  const outputPath = path.join(__dirname, 'public', 'icons', filename);
  
  await sharp(inputPath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toFile(outputPath);
    
  console.log(`   ✅ ${filename} (${size}x${size})`);
}

async function generateShortcutIcon(size) {
  const inputPath = path.join(__dirname, 'public', 'icon-source.svg');
  const outputPath = path.join(__dirname, 'public', 'icons', `shortcut-${size}x${size}.png`);
  
  // Criar ícone com fundo colorido para atalhos
  await sharp(inputPath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 14, g: 165, b: 233, alpha: 1 } // Cor primária do tema
    })
    .png()
    .toFile(outputPath);
    
  console.log(`   ✅ shortcut-${size}x${size}.png (${size}x${size})`);
}

async function generateMaskableIcon() {
  const inputPath = path.join(__dirname, 'public', 'icon-source.svg');
  const outputPath = path.join(__dirname, 'public', 'icons', 'icon-maskable-512x512.png');
  
  // Criar ícone maskable com padding seguro
  const canvas = sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 14, g: 165, b: 233, alpha: 1 } // Cor primária do tema
    }
  });
  
  const icon = sharp(inputPath)
    .resize(448, 448, { // 87.5% do tamanho total para padding seguro
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    });
    
  await canvas
    .composite([{
      input: await icon.toBuffer(),
      top: 32,
      left: 32
    }])
    .png()
    .toFile(outputPath);
    
  console.log('   ✅ icon-maskable-512x512.png (512x512)');
}

// Função para criar placeholder de screenshots
async function createScreenshotPlaceholders() {
  console.log('📸 Criando placeholders de screenshots...');
  
  const screenshots = [
    { name: 'desktop-1.png', width: 1280, height: 720, label: 'Dashboard principal' },
    { name: 'mobile-1.png', width: 390, height: 844, label: 'Interface mobile' }
  ];
  
  for (const screenshot of screenshots) {
    const outputPath = path.join(__dirname, 'public', 'screenshots', screenshot.name);
    
    await sharp({
      create: {
        width: screenshot.width,
        height: screenshot.height,
        channels: 4,
        background: { r: 243, g: 244, b: 246, alpha: 1 } // Gray background
      }
    })
    .png()
    .toFile(outputPath);
    
    console.log(`   ✅ ${screenshot.name} (${screenshot.width}x${screenshot.height})`);
  }
}

// Executar script
generateIcons().then(() => {
  createScreenshotPlaceholders();
}).catch(console.error); 