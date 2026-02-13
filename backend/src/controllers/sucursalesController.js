const { pool } = require('../config/db');

const sucursalesController = {
  create: async (req, res) => {
    try {
      const { nombre, direccion } = req.body;
      const empresaId = req.user.empresa_id;

      const query = `
        INSERT INTO sucursales (empresa_id, nombre, direccion)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const { rows } = await pool.query(query, [empresaId, nombre, direccion]);
      
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear sucursal' });
    }
  },
  
  listar: async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM sucursales WHERE empresa_id = $1', [req.user.empresa_id]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Error al listar sucursales' });
    }
  }
};

module.exports = sucursalesController;