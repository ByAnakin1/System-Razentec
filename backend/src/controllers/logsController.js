const { pool } = require('../config/db');

const logsController = {
  // GET /logs - Listar logs de la empresa (quién, qué acción, en qué tabla, cuándo)
  listar: async (req, res) => {
    try {
      const empresaId = req.user.empresa_id;

      if (req.user.rol !== 'Administrador') {
        return res.status(403).json({ error: 'Solo el Administrador puede ver los logs de actividad' });
      }

      const { usuario_id, limite = 100 } = req.query;
      const params = [empresaId];
      const limit = Math.min(parseInt(limite, 10) || 100, 500);

      let query = `
        SELECT l.id, l.usuario_id, l.accion, l.modulo, l.tabla_afectada, l.registro_id, l.detalles, l.created_at,
               u.nombre_completo, u.email, u.rol
        FROM logs_actividad l
        JOIN usuarios u ON u.id = l.usuario_id
        WHERE l.empresa_id = $1
      `;

      if (usuario_id) {
        params.push(usuario_id);
        query += ` AND l.usuario_id = $${params.length}`;
      }
      params.push(limit);
      query += ` ORDER BY l.created_at DESC LIMIT $${params.length}`;

      const { rows } = await pool.query(query, params);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al listar logs' });
    }
  }
};

module.exports = logsController;
