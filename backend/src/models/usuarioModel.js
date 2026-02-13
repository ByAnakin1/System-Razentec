const { pool } = require('../config/db');

const UsuarioModel = {
  // Buscar un usuario por su email
  findOneByEmail: async (email) => {
    const query = 'SELECT * FROM usuarios WHERE email = $1';
    const { rows } = await pool.query(query, [email]);
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

      // 2. Crear el usuario administrador asociado a esa empresa
      const resUsuario = await client.query(
        `INSERT INTO usuarios (empresa_id, nombre_completo, email, password_hash) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [empresaId, datosUsuario.nombre, datosUsuario.email, datosUsuario.passwordHash]
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