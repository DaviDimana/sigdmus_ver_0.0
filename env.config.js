// Configuração de ambiente para o projeto
export const envConfig = {
  // API Configuration - Development
  VITE_API_URL_DEV: "http://localhost:4000",
  
  // API Configuration - Production (VPS Hostinger)
  VITE_API_URL_PROD: "https://www.sigdmus.com",
  
  // Environment
  VITE_NODE_ENV: "production"
};

// Função para obter a URL da API baseada no ambiente
export const getApiUrl = () => {
  const env = import.meta.env.VITE_NODE_ENV || 'development';
  return env === 'production' 
    ? envConfig.VITE_API_URL_PROD 
    : envConfig.VITE_API_URL_DEV;
}; 