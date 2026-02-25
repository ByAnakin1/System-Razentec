const { pool } = require('../config/db');

const clientesController = {
  listar: async (req, res) => {
    try {
      // Traemos clientes de la empresa y también los antiguos (NULL) para no perder datos
      const query = 'SELECT * FROM clientes WHERE empresa_id = $1 OR empresa_id IS NULL ORDER BY nombre_completo ASC';
      const { rows } = await pool.query(query, [req.user.empresa_id]);
      res.json(rows);
    } catch (error) {
      console.error("Error listar clientes:", error);
      res.status(500).json({ error: 'Error al obtener clientes' });
    }
  },
  crear: async (req, res) => {
    try {
      const { nombre_completo, documento_identidad, email, telefono } = req.body;
      const query = `
        INSERT INTO clientes (empresa_id, nombre_completo, documento_identidad, email, telefono) 
        VALUES ($1, $2, $3, $4, $5) RETURNING *
      `;
      const { rows } = await pool.query(query, [req.user.empresa_id, nombre_completo, documento_identidad, email, telefono]);
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error("Error al crear cliente:", error);
      res.status(500).json({ error: 'Error al crear cliente' });
    }
  }
};

module.exports = clientesController;