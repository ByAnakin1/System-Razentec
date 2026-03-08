const { pool } = require('../config/db');

const auditoriaController = {
  listar: async (req, res) => {
    try {
      // ✨ PERMISO: Admin o Supervisor pueden ver auditoría (El supervisor solo verá su local)
      if (req.user.rol !== 'Administrador' && req.user.rol !== 'Supervisor') {
        return res.status(403).json({ error: 'Acceso denegado.' });
      }

      const sucursalId = req.headers['x-sucursal-id'];

      let query = `
        SELECT l.id, l.usuario_id, l.accion, l.modulo, l.detalles, 
               (l.created_at AT TIME ZONE 'UTC') AS created_at, 
               e.nombre_completo as usuario_nombre, e.avatar, u.area_cargo, u.rol, u.sucursales_asignadas
        FROM logs_actividad l
        LEFT JOIN usuarios u ON l.usuario_id = u.id
        LEFT JOIN empleados e ON u.empleado_id = e.id
        WHERE l.empresa_id = $1
      `;
      const params = [req.user.empresa_id];

      // ✨ FILTRO DE AUDITORÍA: El Supervisor solo ve a la gente de su sucursal
      if (sucursalId) {
        query += ` AND (u.sucursales_asignadas::jsonb @> $2::jsonb OR l.usuario_id = $3)`;
        params.push(JSON.stringify([parseInt(sucursalId)]));
        params.push(req.user.id); // Siempre puede ver sus propias acciones
      }

      query += ` ORDER BY l.created_at DESC, l.id DESC LIMIT 300`;
      
      const { rows } = await pool.query(query, params);
      res.json(rows);
    } catch (error) {
      console.error("Error al cargar la auditoría:", error);
      res.status(500).json({ error: 'Error al cargar los registros de auditoría' });
    }
  }
};

module.exports = auditoriaController;