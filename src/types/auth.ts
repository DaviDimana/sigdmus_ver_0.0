export interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  confirmado: boolean;
}

export interface Session {
  user: User;
  access_token: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'MUSICO' | 'ADMIN' | 'MAESTRO';
  setor: string | null;
  instrumento: string | null;
  telefone: string | null;
  instituicao: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
}
