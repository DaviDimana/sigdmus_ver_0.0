// Tema personalizado para SiGDMus PWA
export const PWATHEME = {
  // Cores principais
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Cor principal
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Cores secundárias (música/arte)
  secondary: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef', // Cor secundária
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
  },
  
  // Cores de sucesso
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Cores de aviso
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Cores de erro
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Cores neutras
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  
  // Gradientes personalizados
  gradients: {
    primary: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    secondary: 'linear-gradient(135deg, #d946ef 0%, #c026d3 100%)',
    success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    dark: 'linear-gradient(135deg, #262626 0%, #171717 100%)',
    light: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
  },
  
  // Cores para diferentes estados
  states: {
    online: '#22c55e',
    offline: '#ef4444',
    syncing: '#f59e0b',
    idle: '#737373',
    loading: '#0ea5e9',
  },
  
  // Cores para categorias de instrumentos
  instruments: {
    strings: '#0ea5e9',      // Azul para cordas
    woodwinds: '#22c55e',    // Verde para madeiras
    brass: '#f59e0b',        // Amarelo para metais
    percussion: '#d946ef',   // Roxo para percussão
    keyboard: '#ef4444',     // Vermelho para teclas
    voice: '#8b5cf6',        // Violeta para voz
  },
  
  // Cores para tipos de partitura
  partituraTypes: {
    score: '#0ea5e9',        // Partitura completa
    part: '#22c55e',         // Parte individual
    arrangement: '#f59e0b',  // Arranjo
    transcription: '#d946ef', // Transcrição
    original: '#ef4444',     // Original
  },
};

// Configurações de tema para diferentes contextos
export const THEME_CONFIG = {
  // Tema claro (padrão)
  light: {
    background: '#ffffff',
    surface: '#fafafa',
    text: '#171717',
    textSecondary: '#525252',
    border: '#e5e5e5',
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  },
  
  // Tema escuro
  dark: {
    background: '#171717',
    surface: '#262626',
    text: '#fafafa',
    textSecondary: '#a3a3a3',
    border: '#404040',
    shadow: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
  },
  
  // Tema para impressão
  print: {
    background: '#ffffff',
    surface: '#ffffff',
    text: '#000000',
    textSecondary: '#333333',
    border: '#cccccc',
    shadow: 'none',
  },
};

// Configurações específicas do PWA
export const PWA_CONFIG = {
  // Cores do manifest
  manifest: {
    themeColor: PWATHEME.primary[500],
    backgroundColor: PWATHEME.neutral[50],
    display: 'standalone',
    orientation: 'portrait-primary',
  },
  
  // Cores para notificações
  notifications: {
    success: PWATHEME.success[500],
    warning: PWATHEME.warning[500],
    error: PWATHEME.error[500],
    info: PWATHEME.primary[500],
  },
  
  // Cores para status
  status: {
    online: PWATHEME.states.online,
    offline: PWATHEME.states.offline,
    syncing: PWATHEME.states.syncing,
    loading: PWATHEME.states.loading,
  },
};

export default PWATHEME; 