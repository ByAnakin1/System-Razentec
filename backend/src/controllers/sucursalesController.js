const { pool } = require('../config/db');
const { registrarLog } = require('../services/logService');

const sucursalesController = {
  listar: async (req, res) => {
    try {
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
      console.error("❌ Error en listar sucursales:", error);
      res.status(500).json({ error: error.message });
    }
  },
  
  crear: async (req, res) => {
    try {
      console.log("🚀 ¡LLEGÓ LA PETICIÓN DESDE REACT! Datos:", req.body); 
      
      const { nombre, direccion, latitud, longitud } = req.body;
      if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

      const empresaId = req.user?.empresa_id || null;
      const lat = latitud ? parseFloat(latitud) : null;
      const lng = longitud ? parseFloat(longitud) : null;

      const query = 'INSERT INTO sucursales (empresa_id, nombre, direccion, latitud, longitud) VALUES ($1, $2, $3, $4, $5) RETURNING *';
      const { rows } = await pool.query(query, [empresaId, nombre, direccion, lat, lng]);
      
      console.log("✅ SUCURSAL GUARDADA EN LA BD:", rows[0].nombre); 

      try {
        if (req.user?.id) {
          await registrarLog(req.user.id, empresaId, 'CREAR', 'Sucursales', `Registró la sucursal: "${nombre}".`);
        }
      } catch(e) { console.warn("Advertencia de Log:", e.message); }

      res.status(201).json(rows[0]);
    } catch (error) {
      console.error("❌ Error crítico en la Base de Datos:", error);
      res.status(500).json({ error: 'Error en la BD: ' + error.message });
    }
  },

  // ✨ NUEVA FUNCIÓN: Actualizar Sucursal ✨
  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, direccion, latitud, longitud } = req.body;
      const empresaId = req.user?.empresa_id || null;

      if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

      const lat = latitud ? parseFloat(latitud) : null;
      const lng = longitud ? parseFloat(longitud) : null;

      const query = `
        UPDATE sucursales 
        SET nombre = $1, direccion = $2, latitud = $3, longitud = $4
        WHERE id = $5 AND (empresa_id = $6 OR empresa_id IS NULL)
        RETURNING *
      `;
      const { rows } = await pool.query(query, [nombre, direccion, lat, lng, id, empresaId]);

      if (rows.length === 0) return res.status(404).json({ error: 'Sucursal no encontrada' });

      try {
        if (req.user?.id) {
          await registrarLog(req.user.id, empresaId, 'ACTUALIZAR', 'Sucursales', `Editó los datos de la sucursal: "${nombre}".`);
        }
      } catch(e) { console.warn("Advertencia de Log:", e.message); }

      res.json(rows[0]);
    } catch (error) {
      console.error("❌ Error al actualizar sucursal:", error);
      res.status(500).json({ error: 'Error en la BD al actualizar.' });
    }
  },

  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const empresaId = req.user?.empresa_id || null;
      
      const { rowCount } = await pool.query('DELETE FROM sucursales WHERE id = $1 AND (empresa_id = $2 OR empresa_id IS NULL)', [id, empresaId]);
      
      if (rowCount === 0) return res.status(404).json({ error: 'Sucursal no encontrada' });

      try {
        if (req.user?.id) {
          await registrarLog(req.user.id, empresaId, 'ELIMINAR', 'Sucursales', `Eliminó una sucursal del sistema.`);
        }
      } catch(e) { console.warn("Advertencia de Log:", e.message); }

      res.json({ message: 'Sucursal eliminada' });
    } catch (error) {
      console.error("❌ Error al eliminar sucursal:", error);
      res.status(500).json({ error: 'No se puede eliminar la sucursal porque tiene productos vinculados.' });
    }
  }
};

module.exports = sucursalesController;