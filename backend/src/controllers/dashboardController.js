const { pool } = require('../config/db');

const dashboardController = {
  getResumen: async (req, res) => {
    try {
      const empresaId = req.user.empresa_id;

      // 1. Total Ventas del Mes Actual
      const ventasMes = await pool.query(`
        SELECT COALESCE(SUM(total), 0) as total 
        FROM ventas 
        WHERE (empresa_id = $1 OR empresa_id IS NULL)
        AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      `, [empresaId]);

      // 2. Total Compras del Mes Actual
      const comprasMes = await pool.query(`
        SELECT COALESCE(SUM(total), 0) as total 
        FROM compras 
        WHERE empresa_id = $1 AND estado = 'COMPLETADO'
        AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      `, [empresaId]);

      // 3. Productos y Alertas de Stock (Menos de 5 unidades)
      const productosStats = await pool.query(`
        SELECT 
          COUNT(DISTINCT p.id) as total_productos,
          COUNT(DISTINCT CASE WHEN i.stock_actual <= 5 THEN p.id END) as stock_bajo
        FROM productos p
        LEFT JOIN inventario i ON p.id = i.producto_id
        WHERE (p.empresa_id = $1 OR p.empresa_id IS NULL) AND p.estado = true
      `, [empresaId]);

      // 4. Últimas 5 Ventas Recientes (Para la tablita rápida)
      const ultimasVentas = await pool.query(`
        SELECT v.id, v.total, v.created_at, c.nombre_completo as cliente
        FROM ventas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        WHERE (v.empresa_id = $1 OR v.empresa_id IS NULL)
        ORDER BY v.created_at DESC
        LIMIT 5
      `, [empresaId]);

      // Enviamos todo empaquetado al Frontend
      res.json({
        ventasDelMes: parseFloat(ventasMes.rows[0].total),
        comprasDelMes: parseFloat(comprasMes.rows[0].total),
        totalProductos: parseInt(productosStats.rows[0].total_productos),
        productosStockBajo: parseInt(productosStats.rows[0].stock_bajo),
        ultimasVentas: ultimasVentas.rows
      });

    } catch (error) {
      console.error("Error cargando Dashboard:", error);
      res.status(500).json({ error: 'Error al cargar los datos del panel de control' });
    }
  }
};

module.exports = dashboardController;