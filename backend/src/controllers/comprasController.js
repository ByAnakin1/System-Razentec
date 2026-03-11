const { pool } = require('../config/db');
const { registrarLog } = require('../services/logService');

const comprasController = {
  listar: async (req, res) => {
    try {
      // ✨ LEEMOS LA SUCURSAL DESDE EL INTERCEPTOR DEL FRONTEND
      const sucursalId = req.headers['x-sucursal-id']; 
      
      let query = `
        SELECT 
          c.id, c.comprobante, c.total, c.estado, c.created_at,
          p.razon_social as proveedor_nombre,
          s.nombre as sucursal_nombre
        FROM compras c
        LEFT JOIN proveedores p ON c.proveedor_id = p.id
        LEFT JOIN sucursales s ON c.sucursal_id = s.id
        WHERE c.empresa_id = $1
      `;
      const params = [req.user.empresa_id];

      // ✨ SI EL USUARIO NO ESTÁ EN VISTA GLOBAL, FILTRAMOS SUS COMPRAS
      if (sucursalId) {
        query += ` AND c.sucursal_id = $2`;
        params.push(sucursalId);
      }

      query += ` ORDER BY c.created_at DESC`;

      const { rows } = await pool.query(query, params);
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al listar las compras' });
    }
  },

  crear: async (req, res) => {
    const client = await pool.connect();
    try {
      const { proveedor_id, comprobante, total, detalles } = req.body;
      
      // ✨ OBTENEMOS LA SUCURSAL DONDE SE ESTÁ REGISTRANDO LA COMPRA
      const sucursalId = req.headers['x-sucursal-id'] || req.body.sucursal_id;

      if (!sucursalId) {
        return res.status(400).json({ error: 'No se ha detectado una sucursal activa para ingresar el stock.' });
      }

      if (!detalles || detalles.length === 0) {
        return res.status(400).json({ error: 'La compra debe tener al menos un producto' });
      }

      await client.query('BEGIN'); // 🚀 INICIAMOS LA TRANSACCIÓN

      // 1. Insertar la Cabecera de la Compra
      const compraRes = await client.query(
        'INSERT INTO compras (empresa_id, proveedor_id, sucursal_id, usuario_id, comprobante, total, estado) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [req.user.empresa_id, proveedor_id || null, sucursalId, req.user.id, comprobante || 'S/C', total, 'COMPLETADO']
      );
      const nuevaCompraId = compraRes.rows[0].id;

      // 2. Procesar cada producto (Detalles, Inventario y Movimientos)
      for (const item of detalles) {
        // A. Insertar en detalle_compra
        await client.query(
          'INSERT INTO detalle_compra (compra_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)',
          [nuevaCompraId, item.producto_id, item.cantidad, item.precio_unitario, item.subtotal]
        );

        // B. Actualizar Inventario (Sumar Stock) ✨ AHORA BUSCA LA SUCURSAL ESPECÍFICA
        const checkInv = await client.query(
          'SELECT id FROM inventario WHERE producto_id = $1 AND sucursal_id = $2 AND (empresa_id = $3 OR empresa_id IS NULL)', 
          [item.producto_id, sucursalId, req.user.empresa_id]
        );
        
        if (checkInv.rows.length > 0) {
          // Si el producto ya tiene registro de inventario EN ESTE LOCAL, lo sumamos
          await client.query(
            'UPDATE inventario SET stock_actual = stock_actual + $1 WHERE producto_id = $2 AND sucursal_id = $3 AND (empresa_id = $4 OR empresa_id IS NULL)', 
            [item.cantidad, item.producto_id, sucursalId, req.user.empresa_id]
          );
        } else {
          // Si por alguna razón no existía en inventario de ESE local, lo creamos
          await client.query(
            'INSERT INTO inventario (empresa_id, producto_id, sucursal_id, stock_actual, punto_reposicion) VALUES ($1, $2, $3, $4, $5)', 
            [req.user.empresa_id, item.producto_id, sucursalId, item.cantidad, 5]
          );
        }

        // C. Registrar el Movimiento en el Historial de Almacén
        await client.query(
          'INSERT INTO movimientos_almacen (empresa_id, producto_id, sucursal_id, usuario_id, tipo_movimiento, motivo, cantidad) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [req.user.empresa_id, item.producto_id, sucursalId, req.user.id, 'ENTRADA', `Compra (Comp: ${comprobante || 'S/C'})`, item.cantidad]
        );
      }

      await client.query('COMMIT'); // ✅ GUARDAMOS TODO DEFINITIVAMENTE

      // Obtenemos el nombre de la sucursal para que la auditoría quede súper clara
      const sucRes = await pool.query('SELECT nombre FROM sucursales WHERE id = $1', [sucursalId]);
      const nombreSuc = sucRes.rows[0]?.nombre || 'local seleccionado';

      await registrarLog(req.user.id, req.user.empresa_id, 'CREAR', 'Compras', `Registró una nueva compra por S/ ${total} para el ${nombreSuc} (Comp: ${comprobante || 'S/C'})`);
      res.status(201).json({ message: 'Compra registrada y stock actualizado con éxito' });

    } catch (error) {
      await client.query('ROLLBACK'); // ❌ SI ALGO FALLA, DESHACEMOS TODO PARA NO ARRUINAR EL STOCK
      console.error('Error en transacción de compra:', error);
      res.status(500).json({ error: 'Error al procesar la compra' });
    } finally {
      client.release();
    }
  },

  obtenerPorId: async (req, res) => {
    try {
      const { id } = req.params;
      const sucursalId = req.headers['x-sucursal-id'];

      // 1. Obtener la Cabecera de la Compra
      let queryCompra = `
        SELECT 
          c.id, c.comprobante, c.total, c.estado, c.created_at,
          p.razon_social as proveedor_nombre, p.ruc as proveedor_ruc, p.telefono as proveedor_telefono,
          s.nombre as sucursal_nombre
        FROM compras c
        LEFT JOIN proveedores p ON c.proveedor_id = p.id
        LEFT JOIN sucursales s ON c.sucursal_id = s.id
        WHERE c.id = $1 AND c.empresa_id = $2
      `;
      const params = [id, req.user.empresa_id];

      // Protegemos que un usuario de la sucursal "A" no pueda abrir el detalle de una compra de la sucursal "B"
      if (sucursalId) {
        queryCompra += ` AND c.sucursal_id = $3`;
        params.push(sucursalId);
      }

      const resultCompra = await pool.query(queryCompra, params);

      if (resultCompra.rows.length === 0) {
        return res.status(404).json({ error: 'Compra no encontrada o no tienes permisos para verla' });
      }

      const compra = resultCompra.rows[0];

      // 2. Obtener los Detalles (Productos comprados)
      const queryDetalles = `
        SELECT 
          dc.cantidad, dc.precio_unitario, dc.subtotal,
          prod.nombre as producto_nombre
        FROM detalle_compra dc
        JOIN productos prod ON dc.producto_id = prod.id
        WHERE dc.compra_id = $1
      `;
      const resultDetalles = await pool.query(queryDetalles, [id]);

      // 3. Enviar todo junto al frontend
      res.json({
        compra: compra,
        detalles: resultDetalles.rows
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener el detalle de la compra' });
    }
  }
};

module.exports = comprasController;