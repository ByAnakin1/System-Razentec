const { pool } = require('../config/db');

const UsuarioModel = {
  // Buscar un usuario por su email (incluye password_hash para login)
  findOneByEmail: async (email) => {
    const query = 'SELECT * FROM usuarios WHERE email = $1';
    const { rows } = await pool.query(query, [email]);
    return rows[0];
  },

  // Buscar usuario por ID (incluye password_hash para validaciones internas)
  findById: async (id, incluirPassword = false) => {
    const cols = incluirPassword ? '*' : 'id, empresa_id, nombre_completo, email, rol, categorias';
    const { rows } = await pool.query(`SELECT ${cols} FROM usuarios WHERE id = $1`, [id]);
    return rows[0];
  },

  // Listar usuarios de una empresa (sin passwords)
  findAllByEmpresa: async (empresaId) => {
    const query = `SELECT id, empresa_id, nombre_completo, email, rol, categorias FROM usuarios WHERE empresa_id = $1 ORDER BY nombre_completo`;
    const { rows } = await pool.query(query, [empresaId]);
    return rows;
  },

  // Crear miembro del equipo (misma empresa que el admin)
  create: async (empresaId, { nombre_completo, email, passwordHash, rol = 'Empleado', categorias = [] }) => {
    const query = `
      INSERT INTO usuarios (empresa_id, nombre_completo, email, password_hash, rol, categorias)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING id, empresa_id, nombre_completo, email, rol, categorias
    `;
    const catJson = JSON.stringify(Array.isArray(categorias) ? categorias : []);
    const { rows } = await pool.query(query, [empresaId, nombre_completo, email, passwordHash, rol, catJson]);
    return rows[0];
  },

  // Eliminar usuario (solo Admin, mismo empresa)
  delete: async (usuarioId, empresaId) => {
    const { rows } = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 AND empresa_id = $2 RETURNING id',
      [usuarioId, empresaId]
    );
    return rows[0];
  },

  // Actualizar perfil (nombre, email, rol)
  updatePerfil: async (usuarioId, empresaId, { nombre_completo, email, rol }) => {
    const updates = [];
    const values = [];
    let i = 1;
    if (nombre_completo !== undefined) { updates.push(`nombre_completo = $${i++}`); values.push(nombre_completo); }
    if (email !== undefined) { updates.push(`email = $${i++}`); values.push(email); }
    if (rol !== undefined) { updates.push(`rol = $${i++}`); values.push(rol); }
    if (updates.length === 0) return null;
    values.push(usuarioId, empresaId);
    const { rows } = await pool.query(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${i++} AND empresa_id = $${i} RETURNING id, empresa_id, nombre_completo, email, rol, categorias`,
      values
    );
    return rows[0];
  },

  // Actualizar permisos (rol y categorías)
  updatePermisos: async (usuarioId, empresaId, { rol, categorias }) => {
    const query = `
      UPDATE usuarios SET rol = $1, categorias = $2::jsonb
      WHERE id = $3 AND empresa_id = $4
      RETURNING id, empresa_id, nombre_completo, email, rol, categorias
    `;
    const catJson = JSON.stringify(Array.isArray(categorias) ? categorias : []);
    const { rows } = await pool.query(query, [rol, catJson, usuarioId, empresaId]);
    return rows[0];
  },

  // Crear una nueva empresa y su dueño (Transacción para que sea seguro)
  createEmpresaYUsuario: async (datosEmpresa, datosUsuario) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN'); // Iniciar transacción

      // 1. Crear la empresa
      const resEmpresa = await client.query(
        'INSERT INTO empresas (nombre, ruc) VALUES ($1, $2) RETURNING id',
        [datosEmpresa.nombre, datosEmpresa.ruc]
      );
      const empresaId = resEmpresa.rows[0].id;

      // 2. Crear el usuario administrador asociado a esa empresa (con rol y permisos completos)
      const categoriasAdmin = JSON.stringify(['Inventario', 'Ventas', 'Compras', 'Clientes', 'Proveedores', 'Usuarios', 'Modificador']);
      const resUsuario = await client.query(
        `INSERT INTO usuarios (empresa_id, nombre_completo, email, password_hash, rol, categorias) 
         VALUES ($1, $2, $3, $4, 'Administrador', $5::jsonb) RETURNING *`,
        [empresaId, datosUsuario.nombre, datosUsuario.email, datosUsuario.passwordHash, categoriasAdmin]
      );

      await client.query('COMMIT'); // Guardar cambios
      return resUsuario.rows[0];
    } catch (e) {
      await client.query('ROLLBACK'); // Si algo falla, deshacer todo
      throw e;
    } finally {
      client.release();
    }
  }
};

module.exports = UsuarioModel;