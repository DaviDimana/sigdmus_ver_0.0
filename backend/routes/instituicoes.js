const express = require('express');
const pool = require('../db');
const router = express.Router();
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token de acesso necessário' });
  jwt.verify(token, process.env.JWT_SECRET || 'segredo', (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
    req.user = user;
    next();
  });
}

// Listar todas as instituições (público)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM instituicoes ORDER BY nome');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar nova instituição (público)
router.post('/', async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) {
      return res.status(400).json({ error: 'Nome da instituição é obrigatório' });
    }
    
    const result = await pool.query(
      'INSERT INTO instituicoes (nome) VALUES ($1) RETURNING *',
      [nome]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'Esta instituição já existe' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Atualizar instituição (protegido)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome da instituição é obrigatório' });
    }
    
    const result = await pool.query(
      'UPDATE instituicoes SET nome = $1 WHERE id = $2 RETURNING *',
      [nome, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instituição não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'Esta instituição já existe' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Deletar instituição (protegido)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM instituicoes WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instituição não encontrada' });
    }
    
    res.json({ message: 'Instituição deletada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 