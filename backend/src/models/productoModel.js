const { pool } = require('../config/db');

const ProductoModel = {
// 1. LISTAR (Ahora trae el nombre de la categoría)
  findAllByEmpresa: async (empresaId, filtroEstado = 'activos') => {
    let condicionEstado = '';
    if (filtroEstado === 'activos') condicionEstado = 'AND p.estado = true';
    else if (filtroEstado === 'inactivos') condicionEstado = 'AND p.estado = false';

    const query = `
      SELECT 
        p.id, p.nombre, p.sku AS codigo, p.precio_base AS precio, p.estado, 
        p.categoria_id, c.nombre as categoria_nombre, -- <--- NUEVO
        COALESCE(SUM(i.stock_actual), 0) as stock
      FROM productos p
      LEFT JOIN inventario i ON p.id = i.producto_id
      LEFT JOIN categorias c ON p.categoria_id = c.id -- <--- JOIN CON CATEGORIAS
      WHERE p.empresa_id = $1 ${condicionEstado}
      GROUP BY p.id, c.nombre
      ORDER BY p.created_at DESC
    `;
    const { rows } = await pool.query(query, [empresaId]);
    return rows;
  },

  // 2. CREAR (Ahora recibe categoria_id)
  create: async (datos) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // (Lógica de Sucursal igual que antes...)
      let sucursalRes = await client.query('SELECT id FROM sucursales WHERE empresa_id = $1 LIMIT 1', [datos.empresa_id]);
      let sucursalId;
      if (sucursalRes.rows.length > 0) sucursalId = sucursalRes.rows[0].id;
      else {
        const nueva = await client.query("INSERT INTO sucursales (empresa_id, nombre, direccion) VALUES ($1, 'Principal', 'General') RETURNING id", [datos.empresa_id]);
        sucursalId = nueva.rows[0].id;
      }

      // INSERTAR PRODUCTO (Agregamos categoria_id)
      const prodRes = await client.query(
        `INSERT INTO productos (empresa_id, nombre, precio_base, sku, categoria_id) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, nombre, sku, precio_base`,
        [datos.empresa_id, datos.nombre, datos.precio, datos.codigo, datos.categoria_id || null] // <--- AQUÍ
      );
      const producto = prodRes.rows[0];

      // (Lógica de Stock igual que antes...)
      if (datos.stock && datos.stock > 0) {
        await client.query("INSERT INTO inventario (empresa_id, producto_id, sucursal_id, stock_actual) VALUES ($1, $2, $3, $4)", [datos.empresa_id, producto.id, sucursalId, datos.stock]);
        await client.query("INSERT INTO movimientos_almacen (empresa_id, producto_id, sucursal_id, tipo_movimiento, motivo, cantidad) VALUES ($1, $2, $3, 'ENTRADA', 'Inicial', $4)", [datos.empresa_id, producto.id, sucursalId, datos.stock]);
      }

      await client.query('COMMIT');
      return { ...producto, stock: datos.stock || 0 };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // 3. EDITAR (Agregamos categoria_id)
  update: async (id, datos) => {
    const query = `
      UPDATE productos
      SET nombre = $1, precio_base = $2, sku = $3, categoria_id = $4
      WHERE id = $5 AND empresa_id = $6
      RETURNING *
    `;
    const { rows } = await pool.query(query, [datos.nombre, datos.precio, datos.codigo, datos.categoria_id || null, id, datos.empresa_id]);
    return rows[0];
  },

  // 4. ELIMINADO LÓGICO (Soft Delete)
  delete: async (id, empresaId) => {
    // Cambiamos estado a FALSE en lugar de borrar la fila
    const query = 'UPDATE productos SET estado = false WHERE id = $1 AND empresa_id = $2 RETURNING id';
    const { rows } = await pool.query(query, [id, empresaId]);
    return rows[0];
  }
};

module.exports = ProductoModel;