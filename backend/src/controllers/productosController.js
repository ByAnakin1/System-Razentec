const { pool } = require('../config/db');
const { registrarLog } = require('../services/logService');

const productosController = {
  listar: async (req, res) => {
    try {
      const { estado } = req.query; 
      const sucursalId = req.headers['x-sucursal-id'];

      let query = `
        SELECT 
          p.id, p.empresa_id, p.nombre, p.estado, p.categoria_id, p.descripcion, p.imagen,
          p.precio_base as precio, p.precio_base, 
          p.sku as codigo, p.sku, 
          c.nombre as categoria_nombre,
          (
            SELECT json_agg(json_build_object('sucursal_id', i.sucursal_id, 'sucursal_nombre', s.nombre, 'stock', i.stock_actual))
            FROM inventario i
            LEFT JOIN sucursales s ON i.sucursal_id = s.id
            WHERE i.producto_id = p.id
          ) as inventario_detalle
      `;

      const params = [req.user.empresa_id];

      // ✨ CORRECCIÓN VITAL: Añadimos la cláusula EXISTS
      if (sucursalId) {
        query += `
          , COALESCE((SELECT SUM(stock_actual) FROM inventario WHERE producto_id = p.id AND sucursal_id = $2), 0) as stock
          FROM productos p 
          LEFT JOIN categorias c ON p.categoria_id = c.id 
          WHERE (p.empresa_id = $1 OR p.empresa_id IS NULL)
          -- Esta línea obliga a ocultar el producto si no pertenece a la sucursal actual:
          AND EXISTS (SELECT 1 FROM inventario inv WHERE inv.producto_id = p.id AND inv.sucursal_id = $2)
        `;
        params.push(sucursalId);
      } else {
        query += `
          , COALESCE((SELECT SUM(stock_actual) FROM inventario WHERE producto_id = p.id AND (empresa_id = $1 OR empresa_id IS NULL)), 0) as stock
          FROM productos p 
          LEFT JOIN categorias c ON p.categoria_id = c.id 
          WHERE (p.empresa_id = $1 OR p.empresa_id IS NULL)
        `;
      }

      if (estado === 'activos') query += ' AND p.estado = true';
      else if (estado === 'inactivos') query += ' AND p.estado = false';
      
      query += ' ORDER BY p.created_at DESC';

      const { rows } = await pool.query(query, params);
      res.json(rows);
    } catch (error) { 
      console.error(error);
      res.status(500).json({ error: 'Error al obtener productos' }); 
    }
  },

  crear: async (req, res) => {
    try {
      const { nombre, descripcion, imagen_url, precio, codigo, categoria_id, stock_sucursales } = req.body;
      
      if (!nombre || nombre.trim() === '') return res.status(400).json({ error: 'El nombre es obligatorio.' });

      let imagenFinal = null;
      if (req.file) imagenFinal = `/uploads/${req.file.filename}`;
      else if (imagen_url && imagen_url.trim() !== '') imagenFinal = imagen_url;

      const catIdValid = categoria_id ? parseInt(categoria_id, 10) : null;
      
      const insertProducto = await pool.query(
        'INSERT INTO productos (empresa_id, nombre, descripcion, imagen, precio_base, sku, categoria_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [req.user.empresa_id, nombre, descripcion || null, imagenFinal, precio, codigo, catIdValid]
      );
      const nuevoProductoId = insertProducto.rows[0].id;

      const stockData = JSON.parse(stock_sucursales || '{}');
      for (const [sucursalId, cantidad] of Object.entries(stockData)) {
        const stockNum = parseInt(cantidad, 10);
        if (stockNum >= 0) { 
          await pool.query(
            'INSERT INTO inventario (empresa_id, producto_id, sucursal_id, stock_actual, punto_reposicion) VALUES ($1, $2, $3, $4, $5)',
            [req.user.empresa_id, nuevoProductoId, parseInt(sucursalId, 10), stockNum, 5]
          );
        }
      }

      await registrarLog(req.user.id, req.user.empresa_id, 'CREAR', 'Inventario', `Registró el nuevo producto: "${nombre}"`, nuevoProductoId);
      res.status(201).json({ message: 'Producto creado con éxito' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear producto' });
    }
  },

  crearGranel: async (req, res) => {
    const client = await pool.connect();
    try {
      const { productos } = req.body;
      if (!Array.isArray(productos) || productos.length === 0) return res.status(400).json({ error: 'JSON vacío.' });

      await client.query('BEGIN'); 
      const sucursalRes = await client.query('SELECT id FROM sucursales WHERE empresa_id = $1 LIMIT 1', [req.user.empresa_id]);
      const sucursalId = sucursalRes.rows.length > 0 ? sucursalRes.rows[0].id : null;
      let insertados = 0;

      for (const prod of productos) {
        if (!prod.nombre || prod.nombre.trim() === '') continue;
        const insertProducto = await client.query(
          'INSERT INTO productos (empresa_id, nombre, descripcion, imagen, precio_base, sku, categoria_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
          [req.user.empresa_id, prod.nombre, prod.descripcion, prod.imagen_url, parseFloat(prod.precio)||0, prod.codigo, prod.categoria_id ? parseInt(prod.categoria_id) : null]
        );
        const stock = prod.stock ? parseInt(prod.stock, 10) : 0;
        await client.query(
          'INSERT INTO inventario (empresa_id, producto_id, sucursal_id, stock_actual) VALUES ($1, $2, $3, $4)',
          [req.user.empresa_id, insertProducto.rows[0].id, sucursalId, stock]
        );
        insertados++;
      }
      await client.query('COMMIT'); 
      await registrarLog(req.user.id, req.user.empresa_id, 'CREAR', 'Inventario', `Importó ${insertados} productos JSON.`);
      res.status(201).json({ message: `Se importaron ${insertados} productos.` });
    } catch (error) {
      await client.query('ROLLBACK'); 
      res.status(500).json({ error: 'Error importando JSON' });
    } finally { client.release(); }
  },

  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, descripcion, imagen_url, precio, codigo, categoria_id, stock_sucursales } = req.body; 
      
      if (!nombre || nombre.trim() === '') return res.status(400).json({ error: 'El nombre es obligatorio.' });

      const prodActual = await pool.query('SELECT imagen FROM productos WHERE id = $1 AND (empresa_id = $2 OR empresa_id IS NULL)', [id, req.user.empresa_id]);
      if (prodActual.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });

      let imagenFinal = prodActual.rows[0].imagen; 
      if (req.file) imagenFinal = `/uploads/${req.file.filename}`;
      else if (imagen_url !== undefined) imagenFinal = imagen_url.trim() !== '' ? imagen_url : null;

      const catIdValid = categoria_id ? parseInt(categoria_id, 10) : null;

      await pool.query(
        'UPDATE productos SET nombre = $1, descripcion = $2, imagen = $3, precio_base = $4, sku = $5, categoria_id = $6 WHERE id = $7 AND (empresa_id = $8 OR empresa_id IS NULL)',
        [nombre, descripcion || null, imagenFinal, precio, codigo, catIdValid, id, req.user.empresa_id]
      );

      if (stock_sucursales) {
        const stockData = JSON.parse(stock_sucursales);
        for (const [sucursalId, cantidad] of Object.entries(stockData)) {
          const stockNum = parseInt(cantidad, 10);
          const checkInv = await pool.query('SELECT id FROM inventario WHERE producto_id = $1 AND sucursal_id = $2', [id, parseInt(sucursalId, 10)]);
          if (checkInv.rowCount > 0) {
            await pool.query('UPDATE inventario SET stock_actual = $1 WHERE producto_id = $2 AND sucursal_id = $3', [stockNum, id, parseInt(sucursalId, 10)]);
          } else {
            await pool.query(
              'INSERT INTO inventario (empresa_id, producto_id, sucursal_id, stock_actual, punto_reposicion) VALUES ($1, $2, $3, $4, $5)',
              [req.user.empresa_id, id, parseInt(sucursalId, 10), stockNum, 5]
            );
          }
        }
      }

      await registrarLog(req.user.id, req.user.empresa_id, 'EDITAR', 'Inventario', `Actualizó el producto: "${nombre}"`, id);
      res.json({ message: 'Producto actualizado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar producto' });
    }
  },

  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const { rowCount } = await pool.query('UPDATE productos SET estado = false WHERE id = $1 AND (empresa_id = $2 OR empresa_id IS NULL)', [id, req.user.empresa_id]);
      if (rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
      await registrarLog(req.user.id, req.user.empresa_id, 'ELIMINAR', 'Inventario', `Desactivó un producto.`);
      res.json({ message: 'Enviado a papelera' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
  }
};

module.exports = productosController;