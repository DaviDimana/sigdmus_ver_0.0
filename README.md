<<<<<<< HEAD
# Score Performance Hub

Uma aplicação moderna para gerenciamento de performance e métricas, construída com React, TypeScript e Supabase.

## 🚀 Tecnologias

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- React Query
- React Router DOM
- Shadcn/ui

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/score-performance-hub.git
cd score-performance-hub
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

## 🏗️ Estrutura do Projeto

```
src/
├── assets/         # Recursos estáticos
├── components/     # Componentes reutilizáveis
├── hooks/         # Custom hooks
├── lib/           # Configurações e utilitários
├── pages/         # Páginas da aplicação
├── services/      # Serviços de API
├── store/         # Gerenciamento de estado
├── types/         # Definições de tipos
└── utils/         # Funções utilitárias
```

## 🛠️ Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run lint` - Executa o linter
- `npm run preview` - Visualiza a build de produção localmente

## 📝 Convenções de Código

- Utilizamos ESLint e Prettier para padronização
- Seguimos o padrão de commits convencionais
- Componentes são escritos em PascalCase
- Funções utilitárias são escritas em camelCase

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📧 Suporte

Para suporte, envie um email para davidimana123@gmail.com ou abra uma issue no GitHub.

---

# Guia Rápido do Usuário – SIGDMUS

Bem-vindo ao SIGDMUS!

O SIGDMUS é o sistema oficial da instituição para cadastro, organização e compartilhamento de partituras, programas de concerto e arquivos musicais. Ele foi pensado para facilitar o trabalho de músicos, professores, bibliotecários e toda a equipe envolvida na vida musical da instituição.

## 1. Acesso ao Sistema
- Acesse: [https://www.sigdmus.com](https://www.sigdmus.com)
- Clique em **Criar Conta** para se cadastrar.
- Preencha seus dados e aguarde o e-mail de confirmação.
- Siga as instruções do e-mail para ativar sua conta.
- Em caso de dúvidas, entre em contato com o suporte.

## 2. Perfil do Usuário
- Após o login, clique no seu nome ou avatar no canto superior direito para acessar o perfil.
- Atualize seus dados pessoais, troque sua foto de perfil (avatar) e altere sua senha quando desejar.
- Sua foto de perfil pode ser JPG ou PNG, até 2MB.

## 3. Upload de Arquivos
### A. Avatar (Foto de Perfil)
- Clique em sua foto de perfil e selecione uma nova imagem.
- A foto será atualizada imediatamente após o upload.

### B. Partituras
- Vá até a seção **Partituras** no menu principal.
- Clique em **Nova Partitura** para cadastrar uma nova obra.
- Preencha os campos obrigatórios (título, compositor, instrumentação, setor, etc.).
- Faça upload dos arquivos PDF correspondentes à partitura.
- Você pode associar instrumentos a cada arquivo enviado.
- Para editar ou excluir uma partitura, clique nos ícones de lápis (editar) ou lixeira (excluir).

### C. Programa de Concerto
- Ao cadastrar uma nova performance, faça upload do programa de concerto (PDF, DOC, JPG, PNG).
- Se houver outras performances no mesmo local, data e horário, o programa será automaticamente compartilhado entre elas, evitando uploads duplicados.
- Para visualizar ou baixar um programa já cadastrado, clique no ícone de "olho" ao lado do arquivo.

## 4. Exclusão de Arquivos
- Para remover um arquivo (partitura, programa, foto), clique no ícone de lixeira ou "remover" ao lado do arquivo.
- O arquivo será excluído do sistema e do servidor, liberando espaço.
- Atenção: esta ação é irreversível!

## 5. Dicas de Uso
- Sempre confira os dados antes de salvar ou excluir.
- Para evitar perda de informações, não feche o navegador durante uploads grandes.
- Use preferencialmente o navegador Google Chrome ou Mozilla Firefox para melhor experiência.
- Se encontrar qualquer erro, mensagem estranha ou dificuldade, entre em contato com o suporte.

## 6. Segurança e Privacidade
- Seus arquivos e dados estão protegidos e só podem ser acessados por usuários autorizados.
- Todas as ações de upload e exclusão são registradas para auditoria.
- Nunca compartilhe sua senha com terceiros.
- Faça logout ao terminar de usar o sistema, especialmente em computadores compartilhados.

## 7. Suporte
- Em caso de dúvidas ou problemas, envie um e-mail para: **davidimana123@gmail.com**
- Ou procure o responsável pelo SIGDMUS na sua instituição.

**Bom uso e boa música!**

# SIGDMUS - Deploy e Configuração

## Configuração do nginx

O arquivo `nginx-sigdmus.conf` contém a configuração recomendada para rodar o frontend e backend do SIGDMUS em produção.

**Para aplicar:**
1. Copie `nginx-sigdmus.conf` para `/etc/nginx/conf.d/sigdmus.com.conf` no VPS.
2. Reinicie o nginx:  
   ```sh
   systemctl restart nginx
   ```

## Variáveis de ambiente

### Backend
1. Copie `.env.example` para `.env` e preencha com seus dados reais.
2. Instale dependências: `npm install`
3. Rode: `npm run dev` ou `npm start`

### Frontend
1. Copie `env.config.example.js` para `env.config.js` e preencha com seus dados reais.
2. Instale dependências: `npm install`
3. Rode: `npm run dev`

## Build e Deploy

### Build do frontend
```sh
npm ci --only=production
npm run build
```

### Deploy para o VPS (Windows)
```sh
powershell -ExecutionPolicy Bypass -File deploy-to-vps.ps1
```

### Deploy para o VPS (Linux)
```sh
sh deploy-to-vps.sh
```

## Storage/uploads

- Os uploads de arquivos e avatars ficam em `/var/www/sigdmus-uploads`.
- Certifique-se de que o backend tem permissão de escrita nessa pasta.

## [NOVO] Armazenamento de Avatares no VPS

A partir de julho de 2025, os uploads de fotos de perfil (avatar) são feitos diretamente para o VPS, e não mais para o Supabase Storage.

- O endpoint de upload é `/api/avatar` (backend).
- Os arquivos são salvos em `/var/www/sigdmus-uploads/avatars/`.
- As URLs públicas dos avatares são: `https://www.sigdmus.com/uploads/avatars/<user_id>.png`
- O nginx já está configurado para servir essa pasta.

**Importante:** O restante das configurações de endpoints, CORS e nginx permanece igual. O endpoint antigo `/api/upload` continua disponível para outros tipos de upload.

## Segurança

- Nunca versionar arquivos `.env` com segredos reais. Use `.env.example` para mostrar a estrutura.
- Sempre use HTTPS em produção.
=======
# sigdmus_ver_0.0
>>>>>>> 968b40704f0a58fac5e80e2ac1df252298883bde
