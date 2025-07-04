import { useState, useEffect } from 'react';
import { getApiUrl } from '@/utils/apiConfig';
import type { AuthState } from '@/types/auth';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  confirmado: boolean;
}

export const useAuthState = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true
  });

  // Função para obter o token do localStorage
  const getToken = (): string | null => {
    return localStorage.getItem('auth_token');
  };

  // Função para verificar se o token é válido
  const isTokenValid = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  // Função para fazer requisições autenticadas
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    if (!token) {
      throw new Error('Token não encontrado');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token inválido, fazer logout
        localStorage.removeItem('auth_token');
        setAuthState({
          user: null,
          session: null,
          profile: null,
          loading: false
        });
        throw new Error('Sessão expirada');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro na requisição');
    }

    return response;
  };

  useEffect(() => {
    let mounted = true;

    // Inicializar estado de autenticação
    const initializeAuth = async () => {
      try {
        const token = getToken();
        
        if (!token || !isTokenValid(token)) {
          if (!mounted) return;
          setAuthState({
            user: null,
            session: null,
            profile: null,
            loading: false
          });
          return;
        }

        // Decodificar o token para obter informações do usuário
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id;
        
        if (!mounted) return;

        // Definir estado inicial com sessão
        setAuthState(prev => ({
          ...prev,
          session: { user: { id: userId, email: payload.email }, access_token: token },
          user: { id: userId, email: payload.email, nome: payload.nome || 'Usuário', role: payload.role, confirmado: payload.confirmado },
          loading: true // Manter loading enquanto busca perfil
        }));

        // Buscar perfil do usuário
        try {
          const response = await authenticatedFetch(`${getApiUrl()}/api/usuarios/${userId}`);
          const userData = await response.json();

          if (!mounted) return;

          setAuthState(prev => ({
            ...prev,
            profile: {
              id: userData.id,
              name: userData.nome,
              email: userData.email,
              role: 'MUSICO' as const,
              setor: null,
              instrumento: null,
              telefone: null,
              instituicao: null,
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            loading: false
          }));
        } catch (profileError: any) {
          console.error('useAuthState: Profile fetch error:', profileError);
          if (!mounted) return;
          setAuthState(prev => ({ 
            ...prev, 
            profile: null,
            loading: false 
          }));
        }
      } catch (error: any) {
        console.error('useAuthState: Initialization error:', error);
        if (!mounted) return;
        setAuthState({
          user: null,
          session: null,
          profile: null,
          loading: false
        });
      }
    };

    // Iniciar inicialização
    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  return { authState, setAuthState };
};
