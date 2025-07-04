require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { logAudit } = require('./logger');

const app = express();
const PORT = process.env.PORT || 4000;

// Configuração de CORS mais flexível
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://sigdmus.com',
  'https://www.sigdmus.com',
  'http://82.25.74.109',
  'https://82.25.74.109',
  'http://192.168.0.24:5173',
  'http://localhost:5173/'
];

app.use(cors({ 
  origin: function (origin, callback) {
    // Permitir requests sem origin (como mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Middleware para parsing JSON
app.use(express.json());

// Middleware de autenticação JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso necessário' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'segredo', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
    req.user = user;
    next();
  });
};

const UPLOADS_DIR = '/var/www/sigdmus-uploads';
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Endpoint de upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  // Log de upload
  logAudit('upload', `/uploads/${req.file.filename}`, req.body.userId || null);
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Novo endpoint de upload de avatar
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');
if (!fs.existsSync(AVATARS_DIR)) fs.mkdirSync(AVATARS_DIR, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATARS_DIR),
  filename: (req, file, cb) => {
    const userId = req.body.userId;
    if (!userId) return cb(new Error('userId não informado'));
    cb(null, `${userId}${path.extname(file.originalname)}`);
  }
});
const avatarUpload = multer({ storage: avatarStorage });

app.post('/api/avatar', avatarUpload.single('avatar'), (req, res) => {
  const userId = req.body.userId;
  if (!userId || !req.file) {
    return res.status(400).json({ error: 'Dados insuficientes' });
  }
  const avatarUrl = `/uploads/avatars/${userId}${path.extname(req.file.originalname)}`;
  // Log de upload de avatar
  logAudit('upload', avatarUrl, userId);
  res.json({ avatarUrl: `${process.env.API_URL || 'https://sigdmus.com'}${avatarUrl}` });
});

// Servir arquivos publicamente
app.use('/uploads', express.static(UPLOADS_DIR));

// Endpoint para exclusão de arquivos do storage do VPS (apenas subpastas permitidas)
app.delete('/api/upload', (req, res) => {
  const file = req.query.file;
  if (!file) {
    return res.status(400).json({ error: 'Arquivo não especificado' });
  }

  // Permitir apenas subpastas específicas
  const allowedDirs = ['programas', 'partituras', 'avatars', 'outros'];
  const [firstDir] = file.split('/');
  if (!allowedDirs.includes(firstDir)) {
    return res.status(400).json({ error: 'Subpasta não permitida' });
  }

  // Caminho absoluto seguro
  const filePath = path.join(UPLOADS_DIR, file);
  if (!filePath.startsWith(UPLOADS_DIR)) {
    return res.status(400).json({ error: 'Caminho inválido' });
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }
      console.error('Erro ao deletar arquivo:', err);
      return res.status(500).json({ error: 'Erro ao deletar arquivo' });
    }
    // Log de exclusão
    logAudit('delete', `/uploads/${file}`);
    res.json({ success: true });
  });
});

// Rotas públicas (não precisam de autenticação)
app.use('/api/usuarios', require('./routes/user_profiles'));

// Rotas protegidas (precisam de autenticação)
app.use('/api/partituras', authenticateToken, require('./routes/partituras'));
app.use('/api/performances', authenticateToken, require('./routes/performances'));
app.use('/api/arquivos', authenticateToken, require('./routes/arquivos'));
app.use('/api/instituicoes', require('./routes/instituicoes'));
app.use('/api/setores', require('./routes/setores'));
app.use('/api/solicitacoes-download', authenticateToken, require('./routes/solicitacoes-download'));

app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));