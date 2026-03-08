const { pool } = require('../config/db');
const { registrarLog } = require('../services/logService');

const proveedoresController = {
  listar: async (req, res) => {
    try {
      const { estado } = req.query;
      const sucursalId = req.headers['x-sucursal-id']; 

      let query = `
        SELECT p.*, s.nombre as sucursal_nombre 
        FROM proveedores p
        LEFT JOIN sucursales s ON p.sucursal_id = s.id
        WHERE p.empresa_id = $1
      `;
      const params = [req.user.empresa_id];

      // ✨ AISLAMIENTO ESTRICTO
      if (sucursalId) {
        query += ' AND p.sucursal_id = $2';
        params.push(sucursalId);
      }

      if (estado === 'activos') query += ' AND p.estado = true';
      else if (estado === 'inactivos') query += ' AND p.estado = false';
      
      query += ' ORDER BY p.id DESC';

      const { rows } = await pool.query(query, params);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al listar proveedores' });
    }
  },

  crear: async (req, res) => {
    try {
      const { razon_social, ruc, telefono, email, direccion, sucursal_id } = req.body;
      const finalSucursalId = sucursal_id ? parseInt(sucursal_id) : (req.headers['x-sucursal-id'] ? parseInt(req.headers['x-sucursal-id']) : null);

      if (!razon_social || razon_social.trim() === '') return res.status(400).json({ error: 'La Razón Social es obligatoria' });

      if (ruc && ruc.trim() !== '') {
        const checkDoc = await pool.query('SELECT id FROM proveedores WHERE ruc = $1 AND empresa_id = $2', [ruc, req.user.empresa_id]);
        if (checkDoc.rows.length > 0) return res.status(400).json({ error: 'Este RUC ya está registrado' });
      }

      await pool.query(
        'INSERT INTO proveedores (empresa_id, razon_social, ruc, telefono, email, direccion, sucursal_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [req.user.empresa_id, razon_social, ruc, telefono, email, direccion, finalSucursalId]
      );

      await registrarLog(req.user.id, req.user.empresa_id, 'CREAR', 'Proveedores', `Registró al proveedor: ${razon_social}`);
      res.status(201).json({ message: 'Proveedor creado con éxito' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error BD: Verifica haber creado la columna sucursal_id' });
    }
  },

  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { razon_social, ruc, telefono, email, direccion, sucursal_id } = req.body;
      const finalSucId = sucursal_id ? parseInt(sucursal_id) : null;

      if (!razon_social || razon_social.trim() === '') return res.status(400).json({ error: 'La Razón Social es obligatoria' });

      if (ruc && ruc.trim() !== '') {
        const checkDoc = await pool.query('SELECT id FROM proveedores WHERE ruc = $1 AND empresa_id = $2 AND id != $3', [ruc, req.user.empresa_id, id]);
        if (checkDoc.rows.length > 0) return res.status(400).json({ error: 'Este RUC ya pertenece a otro proveedor' });
      }

      const { rowCount } = await pool.query(
        'UPDATE proveedores SET razon_social = $1, ruc = $2, telefono = $3, email = $4, direccion = $5, sucursal_id = $6 WHERE id = $7 AND empresa_id = $8',
        [razon_social, ruc, telefono, email, direccion, finalSucId, id, req.user.empresa_id]
      );

      if (rowCount === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });

      await registrarLog(req.user.id, req.user.empresa_id, 'ACTUALIZAR', 'Proveedores', `Actualizó al proveedor: ${razon_social}`);
      res.json({ message: 'Proveedor actualizado' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar proveedor' });
    }
  },

  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const { rowCount } = await pool.query('UPDATE proveedores SET estado = false WHERE id = $1 AND empresa_id = $2', [id, req.user.empresa_id]);
      if (rowCount === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });
      res.json({ message: 'Proveedor movido a papelera' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar proveedor' });
    }
  }
};
module.exports = proveedoresController;