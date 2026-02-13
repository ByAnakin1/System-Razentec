const { pool } = require('../config/db');

const CategoriaModel = {
  // Listar con filtro (Igual que productos)
  findAllByEmpresa: async (empresaId, filtroEstado = 'activos') => {
    let condicion = '';
    if (filtroEstado === 'activos') condicion = 'AND estado = true';
    else if (filtroEstado === 'inactivos') condicion = 'AND estado = false';

    const query = `
      SELECT * FROM categorias 
      WHERE empresa_id = $1 ${condicion}
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(query, [empresaId]);
    return rows;
  },

  // Crear
  create: async (empresaId, nombre) => {
    const query = 'INSERT INTO categorias (empresa_id, nombre) VALUES ($1, $2) RETURNING *';
    const { rows } = await pool.query(query, [empresaId, nombre]);
    return rows[0];
  },

  // Editar
  update: async (id, empresaId, nombre) => {
    const query = 'UPDATE categorias SET nombre = $1 WHERE id = $2 AND empresa_id = $3 RETURNING *';
    const { rows } = await pool.query(query, [nombre, id, empresaId]);
    return rows[0];
  },

  // Eliminar Lógico (Soft Delete)
  delete: async (id, empresaId) => {
    const query = 'UPDATE categorias SET estado = false WHERE id = $1 AND empresa_id = $2 RETURNING id';
    const { rows } = await pool.query(query, [id, empresaId]);
    return rows[0];
  }
};

module.exports = CategoriaModel;