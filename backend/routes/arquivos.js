const express = require('express');
const pool = require('../db');
const router = express.Router();

// Listar todos os arquivos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM arquivos ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar arquivo por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM arquivos WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Incrementar contador de downloads
router.post('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE arquivos SET downloads = COALESCE(downloads, 0) + 1 WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar arquivo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM arquivos WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    res.json({ message: 'Arquivo deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 