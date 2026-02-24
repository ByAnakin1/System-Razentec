const { pool } = require('../config/db');

// 1. Obtener Historial de Ventas
const getVentas = async (req, res) => {
  try {
    const query = `
      SELECT v.id, v.created_at, v.total, c.nombre_completo AS cliente_nombre, u.email AS cajero_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      ORDER BY v.created_at DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ message: 'Error al obtener el historial de ventas' });
  }
};

// 2. Crear Nueva Venta (POS)
const crearVenta = async (req, res) => {
  const { empresa_id, usuario_id, cliente_id, total, productos } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    // PROTECCIÓN 1 y 2
    const idEmpresa = (typeof empresa_id === 'string' && empresa_id.length === 36) ? empresa_id : null;
    const idUsuario = (typeof usuario_id === 'string' && usuario_id.length === 36) ? usuario_id : null;
    const idCliente = (cliente_id && cliente_id !== '') ? parseInt(cliente_id) : null; 
    
    // Insertamos la Venta limpia
    const insertVenta = `
      INSERT INTO ventas (empresa_id, cliente_id, usuario_id, total) 
      VALUES ($1, $2, $3, $4) RETURNING id
    `;
    const resVenta = await client.query(insertVenta, [idEmpresa, idCliente, idUsuario, total]);
    const ventaId = resVenta.rows[0].id;

    // Insertar los Detalles de la venta
    const insertDetalle = `
      INSERT INTO detalle_venta (venta_id, producto_id, cantidad, precio_unitario, subtotal) 
      VALUES ($1, $2, $3, $4, $5)
    `;
    
    for (const item of productos) {
      const cantidad = parseInt(item.cantidad) || 1;
      const precio = parseFloat(item.precio) || 0;
      await client.query(insertDetalle, [ventaId, item.id, cantidad, precio, cantidad * precio]);
    }

    await client.query('COMMIT');
    res.status(201).json({ id: ventaId, message: 'Venta registrada' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("============= ERROR EN LA BASE DE DATOS =============");
    console.error(error); 
    res.status(500).json({ message: 'Error al registrar la venta', error: error.message });
  } finally {
    client.release();
  }
};

// 3. Ver Boleta (Detalle)
const getDetalleVenta = async (req, res) => {
  const { id } = req.params;
  try {
    const ventaRes = await pool.query(`
      SELECT v.id, v.created_at, v.total, c.nombre_completo AS cliente_nombre, c.documento_identidad, u.email AS cajero_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      WHERE v.id = $1
    `, [id]);

    if (ventaRes.rows.length === 0) return res.status(404).json({ message: 'Venta no encontrada' });

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
};

// 4. Eliminar Venta
const eliminarVenta = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // PROTECCIÓN: Asegurarnos de que el ID sea un número exacto
    const ventaId = parseInt(id);

    // 1. Borramos los productos de la boleta
    await client.query('DELETE FROM detalle_venta WHERE venta_id = $1', [ventaId]);
    
    // 2. Borramos la boleta
    await client.query('DELETE FROM ventas WHERE id = $1', [ventaId]);
    
    await client.query('COMMIT');
    res.json({ message: 'Venta eliminada correctamente' });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("============= ERROR AL ELIMINAR VENTA =============");
    console.error(error); 
    res.status(500).json({ message: 'Error al eliminar la venta' });
  } finally {
    client.release();
  }
};

module.exports = { getVentas, crearVenta, getDetalleVenta, eliminarVenta };