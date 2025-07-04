import { getApiUrl } from '@/utils/apiConfig';
import type { UserProfile, AuthState } from '@/types/auth';

export const useAuthActions = (
  authState: AuthState, 
  setAuthState: React.Dispatch<React.SetStateAction<AuthState>>
) => {
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

  const signIn = async (email: string, password: string) => {
    try {
      // Limpar token existente
      removeToken();
      
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

      const data = await response.json();
      
      // Salvar token
      saveToken(data.token);
      
      // Atualizar estado
      setAuthState({
        user: data.user,
        session: { user: data.user, access_token: data.token },
        profile: {
          id: data.user.id,
          name: data.user.nome,
          email: data.user.email,
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
      });
      
      return data;
    } catch (error: any) {
      console.error('useAuthActions: Sign in failed:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, extra: any) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/usuarios/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: extra.name,
          email,
          senha: password,
          funcao: extra.funcao,
          instrumento: extra.instrumento,
          instituicao: extra.instituicao,
          setor: extra.setor
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro no cadastro');
      }

      // Não fazer login automático após cadastro
      // Apenas exibir mensagem para o usuário checar o e-mail
      return await response.json();
    } catch (error: any) {
      console.error('useAuthActions: Sign up failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      removeToken();
      
      // Limpar estado local imediatamente
      setAuthState({
        user: null,
        session: null,
        profile: null,
        loading: false
      });
    } catch (error: any) {
      console.error('useAuthActions: Sign out failed:', error);
      // Limpar estado mesmo se signOut falhar
      removeToken();
      setAuthState({
        user: null,
        session: null,
        profile: null,
        loading: false
      });
      throw error;
    }
  };

  const updateProfile = async (updates: any) => {
    if (!authState.user) {
      console.error('useAuthActions: No user to update profile for');
      throw new Error('Usuário não está logado');
    }

    try {
      const response = await authenticatedFetch(`${getApiUrl()}/api/usuarios/${authState.user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nome: updates.name || updates.nome,
          email: updates.email,
        }),
      });

      const updatedUser = await response.json();
      
      // Atualizar estado local
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
        profile: {
          ...prev.profile!,
          name: updatedUser.nome,
          email: updatedUser.email,
          ...updates,
          updated_at: new Date().toISOString()
        }
      }));

      return updatedUser;
    } catch (error: any) {
      console.error('useAuthActions: Profile update error:', error);
      throw error;
    }
  };

  const hasRole = (role: UserProfile['role']) => {
    return authState.profile?.role === role;
  };

  const canAccessSector = (sector: UserProfile['setor']) => {
    // Removendo verificação de role - qualquer usuário pode acessar qualquer setor
    return true;
  };

  return {
    signIn,
    signUp,
    signOut,
    updateProfile,
    hasRole,
    canAccessSector,
    getToken,
    authenticatedFetch,
  };
};
