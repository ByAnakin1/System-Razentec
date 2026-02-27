const { pool } = require('../config/db');
const { registrarLog } = require('../services/logService');

const productosController = {
  listar: async (req, res) => {
    try {
      const { estado } = req.query; 
      let query = `
        SELECT 
          p.id, p.empresa_id, p.nombre, p.descripcion, p.imagen, p.estado, p.categoria_id,
          p.precio_base as precio, p.precio_base, 
          p.sku as codigo, p.sku, 
          c.nombre as categoria_nombre,
          COALESCE((SELECT SUM(stock_actual) FROM inventario WHERE producto_id = p.id AND empresa_id = $1), 0) as stock
        FROM productos p 
        LEFT JOIN categorias c ON p.categoria_id = c.id 
        WHERE p.empresa_id = $1
      `;
      const params = [req.user.empresa_id];

      if (estado === 'activos') query += ' AND p.estado = true';
      else if (estado === 'inactivos') query += ' AND p.estado = false';
      
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
      // ⚠️ Cambiamos req.body.imagen por req.body.imagen_url
      const { nombre, descripcion, imagen_url, precio, stock, codigo, categoria_id } = req.body;
      
      if (!nombre || nombre.trim() === '') return res.status(400).json({ error: 'El nombre es obligatorio.' });

      // Lógica de imagen
      let imagenFinal = null;
      if (req.file) {
        imagenFinal = `/uploads/${req.file.filename}`;
      } else if (imagen_url && imagen_url.trim() !== '') {
        imagenFinal = imagen_url; // Guarda el link
      }

      const catIdValid = categoria_id ? parseInt(categoria_id, 10) : null;
      const stockValid = stock ? parseInt(stock, 10) : 0;

      const insertProducto = await pool.query(
        'INSERT INTO productos (empresa_id, nombre, descripcion, imagen, precio_base, sku, categoria_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [req.user.empresa_id, nombre, descripcion || null, imagenFinal, precio, codigo, catIdValid]
      );
      
      const nuevoProductoId = insertProducto.rows[0].id;

      await pool.query(
        'INSERT INTO inventario (empresa_id, producto_id, sucursal_id, stock_actual, punto_reposicion) VALUES ($1, $2, $3, $4, $5)',
        [req.user.empresa_id, nuevoProductoId, 1, stockValid, 5]
      );

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

      if (!Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ error: 'El archivo JSON no contiene productos válidos.' });
      }

      await client.query('BEGIN'); // 🚀 Iniciamos transacción

      // Obtenemos la sucursal principal
      const sucursalRes = await client.query('SELECT id FROM sucursales WHERE empresa_id = $1 LIMIT 1', [req.user.empresa_id]);
      const sucursalId = sucursalRes.rows.length > 0 ? sucursalRes.rows[0].id : null;

      let insertados = 0;

      for (const prod of productos) {
        // Validación básica: Si no tiene nombre, lo saltamos
        if (!prod.nombre || prod.nombre.trim() === '') continue;

        const precio = parseFloat(prod.precio) || 0;
        const codigo = prod.codigo || null;
        const descripcion = prod.descripcion || null;
        const catIdValid = prod.categoria_id ? parseInt(prod.categoria_id, 10) : null;
        const stockValid = prod.stock ? parseInt(prod.stock, 10) : 0;
        const imagenFinal = prod.imagen_url || null;

        // 1. Insertar el Producto
        const insertProducto = await client.query(
          'INSERT INTO productos (empresa_id, nombre, descripcion, imagen, precio_base, sku, categoria_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
          [req.user.empresa_id, prod.nombre, descripcion, imagenFinal, precio, codigo, catIdValid]
        );
        
        const nuevoProductoId = insertProducto.rows[0].id;

        // 2. Insertar en Inventario
        await client.query(
          'INSERT INTO inventario (empresa_id, producto_id, sucursal_id, stock_actual, punto_reposicion) VALUES ($1, $2, $3, $4, $5)',
          [req.user.empresa_id, nuevoProductoId, sucursalId, stockValid, 5]
        );

        // 3. (Opcional) Registrar movimiento de entrada si hay stock
        if (stockValid > 0) {
          await client.query(
            'INSERT INTO movimientos_almacen (empresa_id, producto_id, sucursal_id, usuario_id, tipo_movimiento, motivo, cantidad) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [req.user.empresa_id, nuevoProductoId, sucursalId, req.user.id, 'ENTRADA', 'Importación masiva JSON', stockValid]
          );
        }

        insertados++;
      }

      await client.query('COMMIT'); // ✅ Confirmamos todos los productos
      await registrarLog(req.user.id, req.user.empresa_id, 'CREAR', 'Inventario', `Importó masivamente ${insertados} productos mediante JSON.`);
      
      res.status(201).json({ message: `Se importaron ${insertados} productos con éxito.` });

    } catch (error) {
      await client.query('ROLLBACK'); // ❌ Si algo falla, deshacemos todo
      console.error('Error importando JSON:', error);
      res.status(500).json({ error: 'Error al importar los productos del JSON' });
    } finally {
      client.release();
    }
  },

  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      // ⚠️ No recibimos "stock" aquí, para no sobrescribirlo accidentalmente
      const { nombre, descripcion, imagen_url, precio, codigo, categoria_id } = req.body; 
      
      if (!nombre || nombre.trim() === '') return res.status(400).json({ error: 'El nombre es obligatorio.' });

      // 1. Recuperar los datos actuales del producto para no borrar la imagen vieja si no la cambian
      const prodActual = await pool.query('SELECT imagen FROM productos WHERE id = $1 AND empresa_id = $2', [id, req.user.empresa_id]);
      if (prodActual.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });

      let imagenFinal = prodActual.rows[0].imagen; // Mantenemos la actual por defecto

      if (req.file) {
        imagenFinal = `/uploads/${req.file.filename}`;
      } else if (imagen_url !== undefined) {
        imagenFinal = imagen_url.trim() !== '' ? imagen_url : null;
      }

      const catIdValid = categoria_id ? parseInt(categoria_id, 10) : null;

      await pool.query(
        'UPDATE productos SET nombre = $1, descripcion = $2, imagen = $3, precio_base = $4, sku = $5, categoria_id = $6 WHERE id = $7 AND empresa_id = $8',
        [nombre, descripcion || null, imagenFinal, precio, codigo, catIdValid, id, req.user.empresa_id]
      );

      // ⚠️ ELIMINADA la actualización del "inventario". 
      // Si editas el nombre o la foto, el stock se mantiene intacto.

      res.json({ message: 'Producto actualizado correctamente' });
    } catch (error) {
      console.error(error);
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