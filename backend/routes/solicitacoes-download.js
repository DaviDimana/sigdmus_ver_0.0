const express = require('express');
const pool = require('../db');
const router = express.Router();

// Listar todas as solicitações de download
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM solicitacoes_download ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar nova solicitação de download
router.post('/', async (req, res) => {
  try {
    const { arquivo_id, mensagem } = req.body;
    const usuario_solicitante = req.user.id;
    
    if (!arquivo_id) {
      return res.status(400).json({ error: 'ID do arquivo é obrigatório' });
    }
    
    // Buscar o arquivo para obter o usuário responsável
    const arquivoResult = await pool.query('SELECT usuario_upload FROM arquivos WHERE id = $1', [arquivo_id]);
    if (arquivoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    
    const usuario_responsavel = arquivoResult.rows[0].usuario_upload;
    
    const result = await pool.query(
      'INSERT INTO solicitacoes_download (arquivo_id, usuario_solicitante, usuario_responsavel, mensagem) VALUES ($1, $2, $3, $4) RETURNING *',
      [arquivo_id, usuario_solicitante, usuario_responsavel, mensagem]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verificar autorização para download
router.get('/verificar/:arquivoId', async (req, res) => {
  try {
    const { arquivoId } = req.params;
    const usuario_solicitante = req.user.id;
    
    const result = await pool.query(
      'SELECT * FROM solicitacoes_download WHERE arquivo_id = $1 AND usuario_solicitante = $2 ORDER BY created_at DESC LIMIT 1',
      [arquivoId, usuario_solicitante]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar status da solicitação
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pendente', 'aprovada', 'rejeitada'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    const result = await pool.query(
      'UPDATE solicitacoes_download SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar solicitação
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM solicitacoes_download WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }
    
    res.json({ message: 'Solicitação deletada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 