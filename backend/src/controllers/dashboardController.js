const { pool } = require('../config/db');

const dashboardController = {
  getResumen: async (req, res) => {
    try {
      const empresaId = req.user.empresa_id;
      // Capturar sucursal_id opcional de la consulta
      const { sucursal_id } = req.query; 
      
      let queryParams = [empresaId];
      // Definir filtros base
      let ventasQueryFilter = "WHERE v.empresa_id = $1";
      let comprasQueryFilter = "WHERE c.empresa_id = $1 AND c.estado = 'COMPLETADO'";
      let productosStatsQueryFilter = "WHERE p.empresa_id = $1 AND p.estado = true";
      let tp_queryFilter = "WHERE v.empresa_id = $1";
      
      // ✨ NUEVO: Filtro base para clientes (asumiendo que quieres clientes activos si tienes columna estado)
      let clientesQueryFilter = "WHERE empresa_id = $1"; 

      // Si se proporciona una sucursal específica, filtrar por ella
      if (sucursal_id && sucursal_id !== 'general') {
        const sucIdNum = parseInt(sucursal_id, 10);
        queryParams.push(sucIdNum);
        ventasQueryFilter += " AND v.sucursal_id = $2";
        comprasQueryFilter += " AND c.sucursal_id = $2";
        productosStatsQueryFilter += " AND i.sucursal_id = $2"; // Filtrar inventario por sucursal
        tp_queryFilter += " AND v.sucursal_id = $2";
        
        // ✨ APLICANDO FILTRO DE SUCURSAL PARA CLIENTES
        clientesQueryFilter += " AND sucursal_id = $2"; 
      }

      // 1. Ventas del Mes
      const ventasMesQuery = `
        SELECT COALESCE(SUM(v.total), 0) as total FROM ventas v
        ${ventasQueryFilter}
        AND EXTRACT(MONTH FROM v.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM v.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
      `;
      const ventasMes = await pool.query(ventasMesQuery, queryParams);

      // 2. Ventas de HOY
      const ventasHoyQuery = `
        SELECT COALESCE(SUM(v.total), 0) as total FROM ventas v
        ${ventasQueryFilter}
        AND DATE(v.created_at) = CURRENT_DATE
      `;
      const ventasHoy = await pool.query(ventasHoyQuery, queryParams);

      // 3. Compras del Mes
      const comprasMesQuery = `
        SELECT COALESCE(SUM(c.total), 0) as total FROM compras c
        ${comprasQueryFilter}
        AND EXTRACT(MONTH FROM c.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      `;
      const comprasMes = await pool.query(comprasMesQuery, queryParams);

      // 4. Productos y Alertas de Stock (Filtrado por sucursal si corresponde)
      const productosStatsQuery = `
        SELECT 
          COUNT(DISTINCT p.id) as total_productos,
          COUNT(DISTINCT CASE WHEN i.stock_actual <= 5 THEN p.id END) as stock_bajo
        FROM productos p
        LEFT JOIN inventario i ON p.id = i.producto_id
        ${productosStatsQueryFilter}
      `;
      const productosStats = await pool.query(productosStatsQuery, queryParams);

      // ✨ 5. Total de Clientes (Corregido con su filtro dinámico)
      const clientesTotales = await pool.query(`
        SELECT COUNT(id) as total FROM clientes ${clientesQueryFilter}
      `, queryParams);

      // 6. Últimas 5 Ventas Recientes
      const ultimasVentasQuery = `
        SELECT v.id, v.total, v.created_at, c.nombre_completo as cliente
        FROM ventas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        ${ventasQueryFilter}
        ORDER BY v.created_at DESC LIMIT 5
      `;
      const ultimasVentas = await pool.query(ultimasVentasQuery, queryParams);

      // 7. Top 5 Productos Más Vendidos
      const topProductosQuery = `
        SELECT p.nombre, SUM(dv.cantidad) as cantidad_vendida, SUM(dv.subtotal) as total_generado
        FROM detalle_venta dv
        JOIN ventas v ON dv.venta_id = v.id
        JOIN productos p ON dv.producto_id = p.id
        ${tp_queryFilter}
        GROUP BY p.id, p.nombre
        ORDER BY cantidad_vendida DESC LIMIT 5
      `;
      const topProductos = await pool.query(topProductosQuery, queryParams);

      // Empaquetamos todo
      res.json({
        ventasDelMes: parseFloat(ventasMes.rows[0].total),
        ventasHoy: parseFloat(ventasHoy.rows[0].total),
        comprasDelMes: parseFloat(comprasMes.rows[0].total),
        totalProductos: parseInt(productosStats.rows[0].total_productos),
        productosStockBajo: parseInt(productosStats.rows[0].stock_bajo),
        clientesTotales: parseInt(clientesTotales.rows[0].total),
        ultimasVentas: ultimasVentas.rows,
        topProductos: topProductos.rows,
        sucursalActual: sucursal_id ? sucursal_id : 'general'
      });

    } catch (error) {
      console.error("Error cargando Dashboard:", error);
      res.status(500).json({ error: 'Error al cargar los datos del panel de control' });
    }
  }
};

module.exports = dashboardController;