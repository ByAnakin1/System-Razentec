const { pool } = require('../config/db');

const empleadosController = {
  listar: async (req, res) => {
    try {
      const query = `
        SELECT e.*, u.rol, u.email as correo_corporativo, u.categorias, u.area_cargo 
        FROM empleados e 
        LEFT JOIN usuarios u ON e.id = u.empleado_id 
        WHERE e.empresa_id = $1
        ORDER BY e.created_at DESC
      `;
      const { rows } = await pool.query(query, [req.user.empresa_id]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Error al listar empleados' });
    }
  },

  crear: async (req, res) => {
    try {
      const { nombre_completo, dni, telefono, correo_personal } = req.body;
      const { rows } = await pool.query(
        'INSERT INTO empleados (empresa_id, nombre_completo, dni, telefono, correo_personal) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [req.user.empresa_id, nombre_completo, dni, telefono, correo_personal]
      );
      res.status(201).json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Error al crear empleado' });
    }
  },

  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre_completo, dni, telefono, correo_personal } = req.body;
      await pool.query(
        'UPDATE empleados SET nombre_completo = $1, dni = $2, telefono = $3, correo_personal = $4 WHERE id = $5 AND empresa_id = $6',
        [nombre_completo, dni, telefono, correo_personal, id, req.user.empresa_id]
      );
      res.json({ message: 'Empleado actualizado con éxito' });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar empleado' });
    }
  }
};

module.exports = empleadosController;