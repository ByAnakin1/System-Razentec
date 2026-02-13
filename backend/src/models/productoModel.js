const { pool } = require('../config/db');

const ProductoModel = {
  // Obtener todos los productos DE UNA EMPRESA
  findAllByEmpresa: async (empresaId) => {
    // Seleccionamos precio_base y lo devolvemos como 'precio' para que el frontend entienda
    const query = `
      SELECT id, nombre, sku AS codigo, precio_base AS precio, estado 
      FROM productos 
      WHERE empresa_id = $1 
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(query, [empresaId]);
    return rows;
  },

  // Crear un producto nuevo
  create: async (datos) => {
    const query = `
      INSERT INTO productos (empresa_id, nombre, precio_base, sku)
      VALUES ($1, $2, $3, $4)
      RETURNING id, nombre, sku, precio_base
    `;
    
    const values = [
      datos.empresa_id, 
      datos.nombre, 
      datos.precio, // El dato que viene del Postman
      datos.codigo  // El dato que viene del Postman
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
  }
};

module.exports = ProductoModel;