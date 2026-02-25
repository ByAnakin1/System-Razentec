const { pool } = require('../config/db');
const { registrarLog } = require('../services/logService');

const productosController = {
  listar: async (req, res) => {
    try {
      const { estado } = req.query; 
      // ✨ TRUCO: Enviamos "precio" y "precio_base", "stock" y "stock_actual"
      // Así tu módulo de Inventario y el de Ventas funcionarán perfectamente al mismo tiempo.
      let query = `
        SELECT 
          p.id, p.empresa_id, p.nombre, p.estado, p.categoria_id,
          p.precio_base as precio, p.precio_base, 
          p.sku as codigo, p.sku, 
          c.nombre as categoria_nombre,
          COALESCE((SELECT SUM(stock_actual) FROM inventario WHERE producto_id = p.id AND empresa_id = $1), 0) as stock,
          COALESCE((SELECT SUM(stock_actual) FROM inventario WHERE producto_id = p.id AND empresa_id = $1), 0) as stock_actual
        FROM productos p 
        LEFT JOIN categorias c ON p.categoria_id = c.id 
        WHERE p.empresa_id = $1
      `;
      const params = [req.user.empresa_id];

      if (estado === 'activos') {
        query += ' AND p.estado = true';
      } else if (estado === 'inactivos') {
        query += ' AND p.estado = false';
      }
      query += ' ORDER BY p.created_at DESC';

      const { rows } = await pool.query(query, params);
      res.json(rows);
    } catch (error) {
      console.error("Error listar productos:", error);
      res.status(500).json({ error: 'Error al obtener productos' });
    }
  },

  crear: async (req, res) => {
    try {
      const { nombre, precio, stock, codigo, categoria_id } = req.body;
      if (!nombre || !precio) return res.status(400).json({ error: 'Faltan datos requeridos' });

      const catIdValid = categoria_id && categoria_id.toString().trim() !== '' ? parseInt(categoria_id, 10) : null;
      const stockValid = stock ? parseInt(stock, 10) : 0;

      const insertProducto = await pool.query(
        'INSERT INTO productos (empresa_id, nombre, precio_base, sku, categoria_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [req.user.empresa_id, nombre, precio, codigo, catIdValid]
      );
      
      const nuevoProductoId = insertProducto.rows[0].id;

      await pool.query(
        'INSERT INTO inventario (empresa_id, producto_id, sucursal_id, stock_actual, punto_reposicion) VALUES ($1, $2, $3, $4, $5)',
        [req.user.empresa_id, nuevoProductoId, 1, stockValid, 5]
      );

      await registrarLog(req.user.id, req.user.empresa_id, 'CREAR', 'Inventario', `Registró el nuevo producto: "${nombre}" con stock de ${stockValid} un.`);
      res.status(201).json({ message: 'Producto creado con éxito' });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear producto' });
    }
  },

  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, precio, stock, codigo, categoria_id } = req.body; 
      
      const catIdValid = categoria_id && categoria_id.toString().trim() !== '' ? parseInt(categoria_id, 10) : null;
      const stockValid = stock ? parseInt(stock, 10) : 0;

      const updateProducto = await pool.query(
        'UPDATE productos SET nombre = $1, precio_base = $2, sku = $3, categoria_id = $4 WHERE id = $5 AND empresa_id = $6',
        [nombre, precio, codigo, catIdValid, id, req.user.empresa_id]
      );
      
      if (updateProducto.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });

      const checkInventario = await pool.query('SELECT id FROM inventario WHERE producto_id = $1 AND empresa_id = $2', [id, req.user.empresa_id]);

      if (checkInventario.rows.length > 0) {
        await pool.query('UPDATE inventario SET stock_actual = $1 WHERE producto_id = $2 AND empresa_id = $3', [stockValid, id, req.user.empresa_id]);
      } else {
        await pool.query('INSERT INTO inventario (empresa_id, producto_id, sucursal_id, stock_actual, punto_reposicion) VALUES ($1, $2, $3, $4, $5)', [req.user.empresa_id, id, 1, stockValid, 5]);
      }

      await registrarLog(req.user.id, req.user.empresa_id, 'ACTUALIZAR', 'Inventario', `Actualizó la información / stock del producto: "${nombre}".`);
      res.json({ message: 'Producto actualizado' });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar producto' });
    }
  },
  
  eliminar: async (req, res) => {
    try {
      const { id } = req.params;

      const prodData = await pool.query('SELECT nombre FROM productos WHERE id = $1 AND empresa_id = $2', [id, req.user.empresa_id]);
      const nombreProducto = prodData.rows.length > 0 ? prodData.rows[0].nombre : 'Producto Desconocido';

      const { rowCount } = await pool.query(
        'UPDATE productos SET estado = false WHERE id = $1 AND empresa_id = $2', 
        [id, req.user.empresa_id]
      );

      if (rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });

      await registrarLog(req.user.id, req.user.empresa_id, 'ELIMINAR', 'Inventario', `Envió a la papelera (desactivó) el producto: "${nombreProducto}".`);
      res.json({ message: 'Enviado a papelera' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar producto' });
    }
  }
};

module.exports = productosController;