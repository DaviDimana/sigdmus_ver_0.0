const express = require('express');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

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

// Cadastro de usuário (público)
router.post('/', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }
    const hashedPassword = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      'INSERT INTO user_profiles (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email',
      [nome, email, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login (público) - só permite login se confirmado
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const result = await pool.query('SELECT * FROM user_profiles WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  }
  const usuario = result.rows[0];
  const senhaOk = await bcrypt.compare(senha, usuario.senha);
  if (!senhaOk) {
    return res.status(401).json({ error: 'Usuário ou senha inválidos' });
  }
  if (!usuario.confirmado) {
    return res.status(403).json({ error: 'Seu cadastro ainda não foi confirmado. Verifique seu e-mail.' });
  }
  const token = jwt.sign({ id: usuario.id, email: usuario.email }, process.env.JWT_SECRET || 'segredo', { expiresIn: '1d' });
  res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } });
});

// Listar todos os usuários (protegido)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nome, email FROM user_profiles');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar usuário por ID (protegido)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT id, nome, email FROM user_profiles WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar usuário (protegido)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, senha } = req.body;
    const fields = [];
    const values = [];
    if (nome) { fields.push('nome'); values.push(nome); }
    if (email) { fields.push('email'); values.push(email); }
    if (senha) { fields.push('senha'); values.push(await bcrypt.hash(senha, 10)); }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
    values.push(id);
    const query = `UPDATE user_profiles SET ${setClause} WHERE id = $${values.length} RETURNING id, nome, email`;
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar usuário (protegido)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM user_profiles WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para checar se já existe admin
router.get('/has-admin', async (req, res) => {
  const result = await pool.query("SELECT 1 FROM user_profiles WHERE role = 'ADMIN' LIMIT 1");
  res.json({ hasAdmin: result.rows.length > 0 });
});

// Novo endpoint de cadastro com confirmação por e-mail
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha, funcao, instrumento, instituicao, setor, role } = req.body;
    if (!nome || !email || !senha || !instituicao || !setor) {
      return res.status(400).json({ error: 'Nome, email, senha, instituição e setor são obrigatórios' });
    }
    // 1. Verificar/criar instituição
    let instituicao_id;
    if (uuidv4.validate?.(instituicao) || /^[0-9a-fA-F-]{36}$/.test(instituicao)) {
      instituicao_id = instituicao;
    } else {
      let result = await pool.query('SELECT id FROM instituicoes WHERE nome = $1', [instituicao]);
      if (result.rows.length === 0) {
        result = await pool.query('INSERT INTO instituicoes (nome) VALUES ($1) RETURNING id', [instituicao]);
      }
      instituicao_id = result.rows[0].id;
    }
    // 2. Verificar/criar setor
    let setor_id;
    if (uuidv4.validate?.(setor) || /^[0-9a-fA-F-]{36}$/.test(setor)) {
      setor_id = setor;
    } else {
      let result = await pool.query('SELECT id FROM setores WHERE nome = $1', [setor]);
      if (result.rows.length === 0) {
        result = await pool.query('INSERT INTO setores (nome) VALUES ($1) RETURNING id', [setor]);
      }
      setor_id = result.rows[0].id;
    }
    // 3. Gerar token de confirmação
    const confirmation_token = uuidv4();
    // 4. Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);
    // 5. Checar se já existe admin
    const adminCheck = await pool.query("SELECT 1 FROM user_profiles WHERE role = 'ADMIN' LIMIT 1");
    let finalRole = 'USER';
    if ((!adminCheck.rows.length) && role === 'ADMIN') {
      finalRole = 'ADMIN';
    }
    // 6. Criar usuário (não confirmado)
    const result = await pool.query(
      `INSERT INTO user_profiles (nome, email, senha, funcao, instrumento, instituicao_id, setor_id, confirmado, confirmation_token, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8, $9) RETURNING id, nome, email` ,
      [nome, email, hashedPassword, funcao, instrumento, instituicao_id, setor_id, confirmation_token, finalRole]
    );
    // 7. Enviar e-mail de confirmação
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    const confirmUrl = `https://sigdmus.com/confirmar-email?token=${confirmation_token}`;
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'sigdmus@sigdmus.com',
      to: email,
      subject: 'Confirmação de cadastro - SIGDMus',
      html: `<p>Olá, ${nome}!</p><p>Para confirmar seu cadastro, clique no link abaixo:</p><p><a href="${confirmUrl}">${confirmUrl}</a></p>`
    });
    res.status(201).json({ message: 'Cadastro realizado! Verifique seu e-mail para confirmar.' });
  } catch (err) {
    console.error('Erro no cadastro:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint de confirmação de e-mail
router.get('/confirmar-email', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: 'Token de confirmação não fornecido.' });
  }
  try {
    const result = await pool.query(
      'UPDATE user_profiles SET confirmado = true, confirmation_token = NULL WHERE confirmation_token = $1 RETURNING id, nome, email',
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido ou já utilizado.' });
    }
    // Redirecionar para página de sucesso no frontend
    return res.redirect('https://sigdmus.com/confirmado');
  } catch (err) {
    console.error('Erro ao confirmar e-mail:', err);
    res.status(500).json({ error: 'Erro ao confirmar e-mail.' });
  }
});

// Recuperação de senha - envia e-mail com token
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'E-mail é obrigatório' });
    const result = await pool.query('SELECT id, nome FROM user_profiles WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(200).json({ message: 'Se o e-mail existir, enviaremos instruções.' });
    }
    const user = result.rows[0];
    const resetToken = uuidv4();
    await pool.query('UPDATE user_profiles SET confirmation_token = $1 WHERE id = $2', [resetToken, user.id]);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    const resetUrl = `https://sigdmus.com/resetar-senha?token=${resetToken}`;
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'sigdmus@sigdmus.com',
      to: email,
      subject: 'Recuperação de senha - SIGDMus',
      html: `<p>Olá, ${user.nome}!</p><p>Para redefinir sua senha, clique no link abaixo:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
    });
    res.status(200).json({ message: 'Se o e-mail existir, enviaremos instruções.' });
  } catch (err) {
    console.error('Erro ao enviar e-mail de recuperação:', err);
    res.status(500).json({ error: 'Erro ao enviar e-mail de recuperação.' });
  }
});

// Redefinição de senha via token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, novaSenha } = req.body;
    if (!token || !novaSenha) return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    const hashedPassword = await bcrypt.hash(novaSenha, 10);
    const result = await pool.query(
      'UPDATE user_profiles SET senha = $1, confirmation_token = NULL WHERE confirmation_token = $2 RETURNING id',
      [hashedPassword, token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido ou expirado.' });
    }
    res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
});

// Endpoint para confirmar cadastro
router.get('/confirmar/:token', async (req, res) => {
  const { token } = req.params;
  if (!token) return res.status(400).json({ error: 'Token ausente' });
  const result = await pool.query('UPDATE user_profiles SET confirmado = true, confirmation_token = NULL WHERE confirmation_token = $1 RETURNING id', [token]);
  if (result.rowCount === 0) {
    return res.status(400).json({ error: 'Token inválido ou já utilizado' });
  }
  res.json({ message: 'Cadastro confirmado com sucesso!' });
});

module.exports = router;