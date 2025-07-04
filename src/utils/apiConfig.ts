// Configuração de API baseada no ambiente
export const getApiUrl = (): string => {
  // Em desenvolvimento, usar localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:4000';
  }
  
  // Em produção, usar o domínio do VPS
  return 'https://sigdmus.com';
};

// Configuração para uploads
export function getUploadConfig() {
  return {
    uploadUrl: "/api/avatar"
  }
}

// Configuração para CORS
export const getCorsConfig = () => {
  return {
    allowedOrigins: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://sigdmus.com',
      'https://www.sigdmus.com',
      'http://82.25.74.109',
      'https://82.25.74.109'
    ],
    credentials: true,
  };
}; 