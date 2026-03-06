const { pool } = require('../config/db');
const { registrarLog } = require('../services/logService');

const clientesController = {
  listar: async (req, res) => {
    try {
      const query = 'SELECT * FROM clientes WHERE empresa_id = $1 OR empresa_id IS NULL ORDER BY created_at DESC';
      const { rows } = await pool.query(query, [req.user.empresa_id]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener clientes' });
    }
  },
  
  crear: async (req, res) => {
    try {
      const nombre_completo = req.body.nombre_completo || req.body.nombre;
      const documento_identidad = req.body.documento_identidad || req.body.dni;
      const { email, telefono, direccion } = req.body;

      if (!nombre_completo) return res.status(400).json({ error: 'El nombre es obligatorio' });

      const query = `
        INSERT INTO clientes (empresa_id, nombre_completo, documento_identidad, email, telefono, direccion) 
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
      `;
      const { rows } = await pool.query(query, [req.user.empresa_id, nombre_completo, documento_identidad, email, telefono, direccion]);
      
      await registrarLog(req.user.id, req.user.empresa_id, 'CREAR', 'Clientes', `Registró al cliente: "${nombre_completo}".`);
      res.status(201).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Error al crear cliente' });
    }
  },

  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre_completo, documento_identidad, email, telefono, direccion } = req.body;
      
      const query = `
        UPDATE clientes SET nombre_completo = $1, documento_identidad = $2, email = $3, telefono = $4, direccion = $5 
        WHERE id = $6 AND (empresa_id = $7 OR empresa_id IS NULL) RETURNING *
      `;
      const { rows } = await pool.query(query, [nombre_completo, documento_identidad, email, telefono, direccion, id, req.user.empresa_id]);
      
      if (rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
      
      await registrarLog(req.user.id, req.user.empresa_id, 'ACTUALIZAR', 'Clientes', `Actualizó los datos del cliente: "${nombre_completo}".`);
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar cliente' });
    }
  },

  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const { rowCount } = await pool.query('DELETE FROM clientes WHERE id = $1 AND (empresa_id = $2 OR empresa_id IS NULL)', [id, req.user.empresa_id]);
      
      if (rowCount === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
      
      await registrarLog(req.user.id, req.user.empresa_id, 'ELIMINAR', 'Clientes', `Eliminó un cliente del sistema.`);
      res.json({ message: 'Cliente eliminado' });
    } catch (error) {
      res.status(500).json({ error: 'No se puede eliminar porque tiene ventas registradas.' });
    }
  }
};

module.exports = clientesController;