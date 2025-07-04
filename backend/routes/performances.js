const express = require('express');
const pool = require('../db');
const router = express.Router();

// Listar todas as performances
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM performances');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar performance por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM performances WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Performance não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar nova performance
router.post('/', async (req, res) => {
  try {
    const fields = [
      'titulo', 'data', 'local', 'descricao', 'obra_id', 'participantes', 'pdf_urls', 'created_at', 'updated_at'
    ];
    const values = fields.map(f => req.body[f]);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO performances (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar performance
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = [
      'titulo', 'data', 'local', 'descricao', 'obra_id', 'participantes', 'pdf_urls', 'created_at', 'updated_at'
    ];
    const updates = [];
    const values = [];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = $${values.length + 1}`);
        values.push(req.body[f]);
      }
    });
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }
    values.push(id);
    const query = `UPDATE performances SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`;
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Performance não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar performance
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM performances WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Performance não encontrada' });
    }
    res.json({ message: 'Performance deletada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 