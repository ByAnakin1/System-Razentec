const { pool } = require('../config/db');
const { registrarLog } = require('../services/logService');

const sucursalesController = {
  listar: async (req, res) => {
    try {
      // ✨ CORRECCIÓN: Respetamos el UUID original, ya no forzamos a número
      const empresaId = req.user?.empresa_id || null;
      
      const query = `
        SELECT s.*, 
        COALESCE((SELECT SUM(stock_actual) FROM inventario WHERE sucursal_id = s.id AND (empresa_id = $1 OR empresa_id IS NULL)), 0) as total_stock,
        COALESCE((SELECT COUNT(DISTINCT producto_id) FROM inventario WHERE sucursal_id = s.id AND (empresa_id = $1 OR empresa_id IS NULL)), 0) as total_productos
        FROM sucursales s 
        WHERE s.empresa_id = $1 OR s.empresa_id IS NULL 
        ORDER BY s.id ASC
      `;
      const { rows } = await pool.query(query, [empresaId]);
      res.json(rows);
    } catch (error) {
      console.error("Error en listar sucursales:", error);
      res.status(500).json({ error: error.message });
    }
  },
  
  crear: async (req, res) => {
    try {
      const { nombre, direccion } = req.body;
      if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

      // ✨ CORRECCIÓN: Usamos el UUID directo de la sesión
      const empresaId = req.user?.empresa_id || null;

      const query = 'INSERT INTO sucursales (empresa_id, nombre, direccion) VALUES ($1, $2, $3) RETURNING *';
      const { rows } = await pool.query(query, [empresaId, nombre, direccion]);
      
      try {
        await registrarLog(req.user?.id, empresaId, 'CREAR', 'Sucursales', `Registró la sucursal: "${nombre}".`);
      } catch(e) { console.warn("Log warning:", e.message); }

      res.status(201).json(rows[0]);
    } catch (error) {
      console.error("Error crítico al crear sucursal:", error);
      res.status(500).json({ error: 'Error en la BD: ' + error.message });
    }
  },

  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const empresaId = req.user?.empresa_id || null;
      
      const { rowCount } = await pool.query('DELETE FROM sucursales WHERE id = $1 AND (empresa_id = $2 OR empresa_id IS NULL)', [id, empresaId]);
      
      if (rowCount === 0) return res.status(404).json({ error: 'Sucursal no encontrada' });

      try {
        await registrarLog(req.user?.id, empresaId, 'ELIMINAR', 'Sucursales', `Eliminó una sucursal del sistema.`);
      } catch(e) { console.warn("Log warning:", e.message); }

      res.json({ message: 'Sucursal eliminada' });
    } catch (error) {
      console.error("Error al eliminar sucursal:", error);
      res.status(500).json({ error: 'No se puede eliminar la sucursal porque tiene productos vinculados.' });
    }
  }
};

module.exports = sucursalesController;