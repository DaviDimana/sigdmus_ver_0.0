const express = require('express');
const pool = require('../db');
const router = express.Router();

// Endpoint para listar todas as partituras
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM partituras');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar partitura por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM partituras WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partitura não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar nova partitura
router.post('/', async (req, res) => {
  try {
    const fields = [
      'setor', 'titulo', 'compositor', 'instrumentacao', 'tonalidade', 'genero', 'edicao', 'ano_edicao',
      'digitalizado', 'numero_armario', 'numero_prateleira', 'numero_pasta', 'instituicao', 'observacoes', 'pdf_urls'
    ];
    const values = fields.map(f => req.body[f]);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO partituras (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar partitura
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const fields = [
      'setor', 'titulo', 'compositor', 'instrumentacao', 'tonalidade', 'genero', 'edicao', 'ano_edicao',
      'digitalizado', 'numero_armario', 'numero_prateleira', 'numero_pasta', 'instituicao', 'observacoes', 'pdf_urls'
    ];
    const updates = [];
    const values = [];
    fields.forEach((f, i) => {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = $${values.length + 1}`);
        values.push(req.body[f]);
      }
    });
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }
    values.push(id);
    const query = `UPDATE partituras SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`;
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partitura não encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar partitura
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM partituras WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Partitura não encontrada' });
    }
    res.json({ message: 'Partitura deletada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 