const { pool } = require('../config/db');

const auditoriaController = {
  listar: async (req, res) => {
    try {
      if (req.user.rol !== 'Administrador') {
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
      }

      // ✨ SOLUCIÓN AL ORDEN Y ZONA HORARIA: 
      // 1. (l.created_at AT TIME ZONE 'UTC') obliga al sistema a reconocer que viene de Londres.
      // 2. l.id DESC garantiza el orden cronológico perfecto.
      const query = `
        SELECT l.id, l.usuario_id, l.accion, l.modulo, l.detalles, 
               (l.created_at AT TIME ZONE 'UTC') AS created_at, 
               e.nombre_completo as usuario_nombre, e.avatar, u.area_cargo, u.rol 
        FROM logs_actividad l
        LEFT JOIN usuarios u ON l.usuario_id = u.id
        LEFT JOIN empleados e ON u.empleado_id = e.id
        WHERE l.empresa_id = $1
        ORDER BY l.created_at DESC, l.id DESC
        LIMIT 300
      `;
      
      const { rows } = await pool.query(query, [req.user.empresa_id]);
      res.json(rows);
    } catch (error) {
      console.error("Error al cargar la auditoría:", error);
      res.status(500).json({ error: 'Error al cargar los registros de auditoría' });
    }
  }
};

module.exports = auditoriaController;