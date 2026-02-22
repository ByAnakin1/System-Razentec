const { pool } = require('../config/db');

const categoriasController = {
  listar: async (req, res) => {
    try {
      const { estado } = req.query;
      let query = 'SELECT * FROM categorias WHERE empresa_id = $1';
      
      if (estado === 'activos') {
        query += ' AND estado = true';
      } else if (estado === 'inactivos') {
        query += ' AND estado = false';
      }
      query += ' ORDER BY nombre ASC';

      const { rows } = await pool.query(query, [req.user.empresa_id]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Error al listar categorías' });
    }
  },

  crear: async (req, res) => {
    try {
      const { nombre } = req.body;
      if (!nombre) return res.status(400).json({ error: 'Nombre obligatorio' });
      
      const { rows } = await pool.query(
        'INSERT INTO categorias (empresa_id, nombre) VALUES ($1, $2) RETURNING *',
        [req.user.empresa_id, nombre]
      );
      res.status(201).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Error al crear categoría' });
    }
  },

  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre } = req.body;
      const { rowCount } = await pool.query(
        'UPDATE categorias SET nombre = $1 WHERE id = $2 AND empresa_id = $3',
        [nombre, id, req.user.empresa_id]
      );
      if (rowCount === 0) return res.status(404).json({ error: 'No encontrada' });
      res.json({ message: 'Actualizada' });
    } catch (error) {
      res.status(500).json({ error: 'Error al editar' });
    }
  },

  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      // Eliminación lógica
      const { rowCount } = await pool.query(
        'UPDATE categorias SET estado = false WHERE id = $1 AND empresa_id = $2',
        [id, req.user.empresa_id]
      );
      if (rowCount === 0) return res.status(404).json({ error: 'No encontrada' });
      res.json({ message: 'Categoría eliminada' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar' });
    }
  }
};

module.exports = categoriasController;