const { pool } = require('../config/db');

const categoriasController = {
  listar: async (req, res) => {
    try {
      const { estado } = req.query;
      // ✨ LEER LA SUCURSAL DEL INTERCEPTOR
      const sucursalId = req.headers['x-sucursal-id'];

      let query = `
        SELECT c.*, s.nombre as sucursal_nombre 
        FROM categorias c
        LEFT JOIN sucursales s ON c.sucursal_id = s.id
        WHERE c.empresa_id = $1
      `;
      const params = [req.user.empresa_id];

      // ✨ FILTRADO CONDICIONAL POR SUCURSAL
      if (sucursalId) {
        query += ' AND c.sucursal_id = $2';
        params.push(sucursalId);
      }

      if (estado === 'activos') {
        query += ` AND c.estado = true`;
      } else if (estado === 'inactivos') {
        query += ` AND c.estado = false`;
      }
      query += ' ORDER BY c.nombre ASC';

      const { rows } = await pool.query(query, params);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al listar categorías' });
    }
  },

  crear: async (req, res) => {
    try {
      // ✨ RECIBIR LA SUCURSAL DESDE EL FRONTEND
      const { nombre, sucursal_id } = req.body;
      const sucursalHeader = req.headers['x-sucursal-id'];
      
      // Si el frontend manda un ID lo usamos, si no, usamos el del header, si no, null
      const finalSucursalId = sucursal_id || sucursalHeader || null;

      if (!nombre) return res.status(400).json({ error: 'Nombre obligatorio' });
      
      const { rows } = await pool.query(
        'INSERT INTO categorias (empresa_id, nombre, sucursal_id) VALUES ($1, $2, $3) RETURNING *',
        [req.user.empresa_id, nombre, finalSucursalId]
      );
      res.status(201).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Error al crear categoría' });
    }
  },

  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      // ✨ ACTUALIZAR NOMBRE Y SUCURSAL
      const { nombre, sucursal_id } = req.body;
      const sucIdValid = sucursal_id ? parseInt(sucursal_id) : null;

      const { rowCount } = await pool.query(
        'UPDATE categorias SET nombre = $1, sucursal_id = $2 WHERE id = $3 AND empresa_id = $4',
        [nombre, sucIdValid, id, req.user.empresa_id]
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