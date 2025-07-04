-- Habilitar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- TABELA: setores
-- =========================
CREATE TABLE setores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =========================
-- TABELA: instituicoes
-- =========================
CREATE TABLE instituicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- =========================
-- TABELA: partituras
-- =========================
CREATE TABLE partituras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setor text NOT NULL,
  titulo text NOT NULL,
  compositor text NOT NULL,
  instrumentacao text NOT NULL,
  tonalidade text,
  genero text,
  edicao text,
  ano_edicao text,
  digitalizado boolean NOT NULL DEFAULT false,
  numero_armario text,
  numero_prateleira text,
  numero_pasta text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  instituicao text,
  observacoes text,
  pdf_urls jsonb
);

-- =========================
-- TABELA: performances
-- =========================
CREATE TABLE performances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo_obra text NOT NULL,
  nome_compositor text NOT NULL,
  local text NOT NULL,
  data date NOT NULL,
  horario time without time zone NOT NULL,
  maestros text NOT NULL,
  interpretes text NOT NULL,
  release text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  programa_arquivo_url text
);

-- =========================
-- TABELA: arquivos
-- =========================
CREATE TABLE arquivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL,
  tamanho bigint NOT NULL,
  categoria text NOT NULL,
  obra text NOT NULL,
  partitura_id uuid REFERENCES partituras(id),
  performance_id uuid REFERENCES performances(id),
  arquivo_url text,
  downloads integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  restricao_download boolean NOT NULL DEFAULT false,
  usuario_upload uuid,
  instrumento text,
  url text
);

-- =========================
-- TABELA: usuarios
-- =========================
CREATE TABLE usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL UNIQUE,
  senha text NOT NULL,
  role text NOT NULL DEFAULT 'USER',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  instituicao_id uuid REFERENCES instituicoes(id),
  setor_id uuid REFERENCES setores(id),
  funcao text,
  instrumento text,
  confirmado boolean DEFAULT false,
  confirmation_token text
);

-- =========================
-- TABELA: solicitacoes_download
-- =========================
CREATE TABLE solicitacoes_download (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arquivo_id uuid NOT NULL REFERENCES arquivos(id) ON DELETE CASCADE,
  usuario_solicitante uuid NOT NULL,
  usuario_responsavel uuid NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  mensagem text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT status_check CHECK (status IN ('pendente', 'aprovada', 'rejeitada'))
);

-- =========================
-- TABELA: profiles (opcional)
-- =========================
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  nome text,
  email text,
  role text DEFAULT 'MUSICO',
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  funcao text
);

-- =========================
-- TABELA: user_profiles (opcional)
-- =========================
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY,
  nome text,
  email text,
  role_user_role text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  role text DEFAULT 'MUSICO',
  instituicao text,
  setor text,
  instrumento text,
  status text,
  telefone text
);

-- =========================
-- Índices extras (opcional)
-- =========================
CREATE INDEX IF NOT EXISTS idx_arquivos_partitura_id ON arquivos(partitura_id);
CREATE INDEX IF NOT EXISTS idx_arquivos_performance_id ON arquivos(performance_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_arquivo_id ON solicitacoes_download(arquivo_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_usuario_solicitante ON solicitacoes_download(usuario_solicitante);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_usuario_responsavel ON solicitacoes_download(usuario_responsavel); 