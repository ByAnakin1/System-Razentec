const { pool } = require('../config/db');
const { registrarLog } = require('../services/logService');

const ventasController = {
  getVentas: async (req, res) => {
    try {
      const sucursalId = req.headers['x-sucursal-id'];

      let query = `
        SELECT v.id, v.created_at, v.total, c.nombre_completo AS cliente_nombre, e.nombre_completo AS cajero_nombre, s.nombre AS sucursal_nombre
        FROM ventas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        LEFT JOIN usuarios u ON v.usuario_id = u.id
        LEFT JOIN empleados e ON u.empleado_id = e.id
        LEFT JOIN sucursales s ON v.sucursal_id = s.id
        WHERE (v.empresa_id = $1)
      `;
      const params = [req.user.empresa_id];

      if (sucursalId) {
        query += ` AND v.sucursal_id = $2`;
        params.push(sucursalId);
      }

      query += ` ORDER BY v.created_at DESC`;

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener historial:", error);
      res.status(500).json({ message: 'Error al obtener el historial de ventas' });
    }
  },

  crearVenta: async (req, res) => {
    // ✨ RECIBE EL METODO_PAGO
    const { cliente_id, total, productos, sucursal_id, metodo_pago } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const idCliente = (cliente_id && cliente_id !== '') ? parseInt(cliente_id) : null; 
      
      // ✨ GUARDA EL METODO_PAGO
      const insertVenta = `
        INSERT INTO ventas (empresa_id, cliente_id, usuario_id, total, sucursal_id, metodo_pago) 
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
      `;
      const resVenta = await client.query(insertVenta, [req.user.empresa_id, idCliente, req.user.id, total, sucursal_id, metodo_pago || 'efectivo']);
      const ventaId = resVenta.rows[0].id;

      const insertDetalle = `
        INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) 
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      for (const item of productos) {
        const cantidad = parseInt(item.cantidad) || 1;
        const precio = parseFloat(item.precio || item.precio_base) || 0; 
        
        await client.query(insertDetalle, [ventaId, item.id, cantidad, precio, cantidad * precio]);
        
        await client.query(
          'UPDATE inventario SET stock_actual = stock_actual - $1 WHERE producto_id = $2 AND sucursal_id = $3 AND empresa_id = $4', 
          [cantidad, item.id, sucursal_id, req.user.empresa_id]
        );
      }

      await client.query('COMMIT');

      await registrarLog(
        req.user.id, req.user.empresa_id, 'CREAR', 'Ventas', 
        `Realizó una venta (Boleta #${ventaId}) por un total de S/ ${total} (${metodo_pago}).`
      );

      res.status(201).json({ id: ventaId, message: 'Venta registrada' });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error("============= ERROR EN LA BASE DE DATOS =============", error);
      res.status(500).json({ message: 'Error al registrar la venta', error: error.message });
    } finally {
      client.release();
    }
  },

  getDetalleVenta: async (req, res) => {
    const { id } = req.params;
    const sucursalId = req.headers['x-sucursal-id']; 

    try {
      let queryVenta = `
        SELECT v.id, v.created_at, v.total, v.metodo_pago, c.nombre_completo AS cliente_nombre, c.documento_identidad, e.nombre_completo AS cajero_nombre, s.nombre AS sucursal_nombre
        FROM ventas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        LEFT JOIN usuarios u ON v.usuario_id = u.id
        LEFT JOIN empleados e ON u.empleado_id = e.id
        LEFT JOIN sucursales s ON v.sucursal_id = s.id
        WHERE v.id = $1 AND v.empresa_id = $2
      `;
      const params = [id, req.user.empresa_id];

      if (sucursalId) {
        queryVenta += ` AND v.sucursal_id = $3`;
        params.push(sucursalId);
      }

      const ventaRes = await pool.query(queryVenta, params);

      if (ventaRes.rows.length === 0) return res.status(404).json({ message: 'Venta no encontrada o sin permisos' });

      const detallesRes = await pool.query(`
        SELECT dv.cantidad, dv.precio_unitario, dv.subtotal, p.nombre AS producto_nombre, p.sku
        FROM detalle_venta dv
        JOIN productos p ON dv.producto_id = p.id
        WHERE dv.venta_id = $1
      `, [id]);

      res.json({ ...ventaRes.rows[0], detalles: detallesRes.rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al obtener detalle' });
    }
  },

  eliminarVenta: async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      const ventaId = parseInt(id);

      const ventaInfo = await client.query('SELECT sucursal_id FROM ventas WHERE id = $1', [ventaId]);
      const sucursalId = ventaInfo.rows[0]?.sucursal_id;

      const detalles = await client.query('SELECT producto_id, cantidad FROM detalle_venta WHERE venta_id = $1', [ventaId]);
      
      for(const item of detalles.rows) {
        await client.query(
          'UPDATE inventario SET stock_actual = stock_actual + $1 WHERE producto_id = $2 AND sucursal_id = $3 AND (empresa_id = $4 OR empresa_id IS NULL)',
          [item.cantidad, item.producto_id, sucursalId, req.user.empresa_id]
        );
      }

      await client.query('DELETE FROM detalle_venta WHERE venta_id = $1', [ventaId]);
      await client.query('DELETE FROM ventas WHERE id = $1 AND empresa_id = $2', [ventaId, req.user.empresa_id]);
      
      await client.query('COMMIT');

      await registrarLog(
        req.user.id, req.user.empresa_id, 'ELIMINAR', 'Ventas', 
        `Anuló la venta (Boleta #${ventaId}) y se restauró el stock de los productos.`
      );

      res.json({ message: 'Venta eliminada correctamente' });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("============= ERROR AL ELIMINAR VENTA =============", error);
      res.status(500).json({ message: 'Error al eliminar la venta' });
    } finally {
      client.release();
    }
  }
};

module.exports = ventasController;