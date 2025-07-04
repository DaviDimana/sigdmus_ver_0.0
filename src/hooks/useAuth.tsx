import { useEffect, useState, useRef } from 'react';
import { getApiUrl } from '@/utils/apiConfig';

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  confirmado: boolean;
}

interface Profile {
  id: string;
  name: string;
  role_user_role: string;
  email: string;
  avatar_url?: string;
  // adicione outros campos se necessário
}

interface AuthResponse {
  token: string;
  user: User;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedUserId = useRef<string | null>(null);

  // Função para obter o token do localStorage
  const getToken = (): string | null => {
    return localStorage.getItem('auth_token');
  };

  // Função para salvar o token no localStorage
  const saveToken = (token: string): void => {
    localStorage.setItem('auth_token', token);
  };

  // Função para remover o token do localStorage
  const removeToken = (): void => {
    localStorage.removeItem('auth_token');
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
        removeToken();
        setUser(null);
        setProfile(null);
        throw new Error('Sessão expirada');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro na requisição');
    }

    return response;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      
      if (!token || !isTokenValid(token)) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        // Decodificar o token para obter informações do usuário
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id;
        
        if (lastFetchedUserId.current !== userId) {
          lastFetchedUserId.current = userId;
          
          // Buscar dados do usuário
          const response = await authenticatedFetch(`${getApiUrl()}/api/usuarios/${userId}`);
          const userData = await response.json();
          
          setUser(userData);
          
          // Por enquanto, vamos usar os dados básicos do usuário como perfil
          // Você pode expandir isso para buscar um perfil mais completo se necessário
          setProfile({
            id: userData.id,
            name: userData.nome,
            email: userData.email,
            role_user_role: 'MUSICO', // Valor padrão
            avatar_url: undefined,
          });
        }
      } catch (error: any) {
        console.error('Erro ao inicializar autenticação:', error);
        if (error.message === 'Sessão expirada') {
          removeToken();
        }
        setUser(null);
        setProfile(null);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching profile for user:', userId);
      
      const response = await authenticatedFetch(`${getApiUrl()}/api/usuarios/${userId}`);
      const userData = await response.json();
      
      console.log('Profile fetched successfully:', userData);
      setProfile({
        id: userData.id,
        name: userData.nome,
        email: userData.email,
        role_user_role: 'MUSICO', // Valor padrão
        avatar_url: undefined,
      });
      setError(null);
    } catch (error: any) {
      console.error('Error in fetchProfile:', error);
      setError(error.message || 'Erro inesperado ao buscar perfil.');
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/user_profiles/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          senha: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro no login');
      }

      const data: AuthResponse = await response.json();
      
      // Salvar token
      saveToken(data.token);
      
      // Atualizar estado
      setUser({ ...data.user, role: data.user.role, confirmado: data.user.confirmado });
      setProfile({
        id: data.user.id,
        name: data.user.nome,
        email: data.user.email,
        role_user_role: 'MUSICO', // Valor padrão
        avatar_url: undefined,
      });
      
      return data;
    } catch (error: any) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, metadata: any) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: metadata.name || metadata.nome || 'Usuário',
          email,
          senha: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro no cadastro');
      }

      const data = await response.json();
      
      // Após o cadastro, fazer login automaticamente
      return await signIn(email, password);
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      removeToken();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      // Mesmo com erro, limpar o estado local
      removeToken();
      setUser(null);
      setProfile(null);
      throw error;
    }
  };

  return {
    user,
    profile,
    loading,
    error,
    setProfile,
    fetchProfile,
    signIn,
    signUp,
    signOut,
    getToken,
    authenticatedFetch,
  };
};
