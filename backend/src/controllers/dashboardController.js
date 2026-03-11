const { pool } = require('../config/db');

const dashboardController = {
  getResumen: async (req, res) => {
    try {
      const empresaId = req.user.empresa_id;

      // 1. Ventas del Mes
      const ventasMes = await pool.query(`
        SELECT COALESCE(SUM(total), 0) as total FROM ventas 
        WHERE (empresa_id = $1 OR empresa_id IS NULL)
        AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      `, [empresaId]);

      // 2. ✨ NUEVO: Ventas de HOY
      const ventasHoy = await pool.query(`
        SELECT COALESCE(SUM(total), 0) as total FROM ventas 
        WHERE (empresa_id = $1 OR empresa_id IS NULL)
        AND DATE(created_at) = CURRENT_DATE
      `, [empresaId]);

      // 3. Compras del Mes
      const comprasMes = await pool.query(`
        SELECT COALESCE(SUM(total), 0) as total FROM compras 
        WHERE empresa_id = $1 AND estado = 'COMPLETADO'
        AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      `, [empresaId]);

      // 4. Productos y Alertas
      const productosStats = await pool.query(`
        SELECT 
          COUNT(DISTINCT p.id) as total_productos,
          COUNT(DISTINCT CASE WHEN i.stock_actual <= 5 THEN p.id END) as stock_bajo
        FROM productos p
        LEFT JOIN inventario i ON p.id = i.producto_id
        WHERE (p.empresa_id = $1 OR p.empresa_id IS NULL) AND p.estado = true
      `, [empresaId]);

      // 5. ✨ NUEVO: Total de Clientes
      const clientesTotales = await pool.query(`
        SELECT COUNT(id) as total FROM clientes WHERE empresa_id = $1 OR empresa_id IS NULL
      `, [empresaId]);

      // 6. Últimas 5 Ventas
      const ultimasVentas = await pool.query(`
        SELECT v.id, v.total, v.created_at, c.nombre_completo as cliente
        FROM ventas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        WHERE (v.empresa_id = $1 OR v.empresa_id IS NULL)
        ORDER BY v.created_at DESC LIMIT 5
      `, [empresaId]);

      // 7. ✨ NUEVO: Top 5 Productos Más Vendidos
      const topProductos = await pool.query(`
        SELECT p.nombre, SUM(dv.cantidad) as cantidad_vendida, SUM(dv.subtotal) as total_generado
        FROM detalle_venta dv
        JOIN ventas v ON dv.venta_id = v.id
        JOIN productos p ON dv.producto_id = p.id
        WHERE (v.empresa_id = $1 OR v.empresa_id IS NULL)
        GROUP BY p.id, p.nombre
        ORDER BY cantidad_vendida DESC LIMIT 5
      `, [empresaId]);

      // Empaquetamos todo
      res.json({
        ventasDelMes: parseFloat(ventasMes.rows[0].total),
        ventasHoy: parseFloat(ventasHoy.rows[0].total),
        comprasDelMes: parseFloat(comprasMes.rows[0].total),
        totalProductos: parseInt(productosStats.rows[0].total_productos),
        productosStockBajo: parseInt(productosStats.rows[0].stock_bajo),
        clientesTotales: parseInt(clientesTotales.rows[0].total),
        ultimasVentas: ultimasVentas.rows,
        topProductos: topProductos.rows
      });

    } catch (error) {
      console.error("Error cargando Dashboard:", error);
      res.status(500).json({ error: 'Error al cargar los datos del panel de control' });
    }
  }
};

module.exports = dashboardController;