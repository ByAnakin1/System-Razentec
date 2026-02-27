const { pool } = require('../config/db');
const { registrarLog } = require('../services/logService');

const proveedoresController = {
  listar: async (req, res) => {
    try {
      const { estado } = req.query;
      let query = 'SELECT * FROM proveedores WHERE empresa_id = $1';
      
      if (estado === 'activos') query += ' AND estado = true';
      else if (estado === 'inactivos') query += ' AND estado = false';
      
      query += ' ORDER BY id DESC';

      const { rows } = await pool.query(query, [req.user.empresa_id]);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al listar proveedores' });
    }
  },

  crear: async (req, res) => {
    try {
      // ⚠️ Usando razon_social y ruc tal como está en tu Base de Datos
      const { razon_social, ruc, telefono, email, direccion } = req.body;
      
      if (!razon_social || razon_social.trim() === '') {
        return res.status(400).json({ error: 'La Razón Social / Nombre es obligatorio' });
      }

      // Validar si el RUC ya existe para esta empresa
      if (ruc && ruc.trim() !== '') {
        const checkDoc = await pool.query('SELECT id FROM proveedores WHERE ruc = $1 AND empresa_id = $2', [ruc, req.user.empresa_id]);
        if (checkDoc.rows.length > 0) return res.status(400).json({ error: 'Este RUC ya está registrado' });
      }

      await pool.query(
        'INSERT INTO proveedores (empresa_id, razon_social, ruc, telefono, email, direccion) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.user.empresa_id, razon_social, ruc, telefono, email, direccion]
      );

      await registrarLog(req.user.id, req.user.empresa_id, 'CREAR', 'Proveedores', `Registró al proveedor: ${razon_social}`);
      res.status(201).json({ message: 'Proveedor creado con éxito' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear proveedor' });
    }
  },

  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { razon_social, ruc, telefono, email, direccion } = req.body;
      
      if (!razon_social || razon_social.trim() === '') {
        return res.status(400).json({ error: 'La Razón Social / Nombre es obligatorio' });
      }

      if (ruc && ruc.trim() !== '') {
        const checkDoc = await pool.query('SELECT id FROM proveedores WHERE ruc = $1 AND empresa_id = $2 AND id != $3', [ruc, req.user.empresa_id, id]);
        if (checkDoc.rows.length > 0) return res.status(400).json({ error: 'Este RUC ya pertenece a otro proveedor' });
      }

      const { rowCount } = await pool.query(
        'UPDATE proveedores SET razon_social = $1, ruc = $2, telefono = $3, email = $4, direccion = $5 WHERE id = $6 AND empresa_id = $7',
        [razon_social, ruc, telefono, email, direccion, id, req.user.empresa_id]
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
      
      const provData = await pool.query('SELECT razon_social FROM proveedores WHERE id = $1', [id]);
      const nombreProv = provData.rows.length > 0 ? provData.rows[0].razon_social : 'Desconocido';

      const { rowCount } = await pool.query('UPDATE proveedores SET estado = false WHERE id = $1 AND empresa_id = $2', [id, req.user.empresa_id]);
      
      if (rowCount === 0) return res.status(404).json({ error: 'Proveedor no encontrado' });

      await registrarLog(req.user.id, req.user.empresa_id, 'ELIMINAR', 'Proveedores', `Envió a papelera al proveedor: ${nombreProv}`);
      res.json({ message: 'Proveedor movido a papelera' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar proveedor' });
    }
  }
};

module.exports = proveedoresController;