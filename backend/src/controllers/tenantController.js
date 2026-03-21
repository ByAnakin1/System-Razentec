const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const tenantController = {
  // 1. Ver todas las empresas que te alquilan el sistema
  getEmpresas: async (req, res) => {
    try {
      const result = await pool.query('SELECT id, nombre, ruc, estado, created_at FROM empresas ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener la lista de empresas' });
    }
  },

  // 2. Registrar un nuevo cliente (Empresa + Su primer Admin)
  crearEmpresa: async (req, res) => {
    const { nombre_empresa, ruc, admin_email, admin_password, admin_nombre } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN'); // Iniciamos transacción segura

      // A. Crear la empresa
      const insertEmpresa = `INSERT INTO empresas (nombre, ruc, estado) VALUES ($1, $2, true) RETURNING id`;
      const resEmpresa = await client.query(insertEmpresa, [nombre_empresa, ruc]);
      const nuevaEmpresaId = resEmpresa.rows[0].id;

      // B. Encriptar la contraseña del nuevo dueño del local
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(admin_password, salt);

      // C. Crear un empleado fantasma para el admin (ya que tu BD lo pide en algunas consultas)
      const insertEmpleado = `INSERT INTO empleados (empresa_id, nombre_completo, correo_corporativo) VALUES ($1, $2, $3) RETURNING id`;
      const resEmpleado = await client.query(insertEmpleado, [nuevaEmpresaId, admin_nombre, admin_email]);
      const nuevoEmpleadoId = resEmpleado.rows[0].id;

      // D. Crear la cuenta de usuario Administrador de esa empresa
      const insertUsuario = `
        INSERT INTO usuarios (empresa_id, empleado_id, email, password_hash, rol, area_cargo) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      // Le damos rol "Administrador" para que tenga poder total dentro de SU empresa
      await client.query(insertUsuario, [nuevaEmpresaId, nuevoEmpleadoId, admin_email, passwordHash, 'Administrador', 'Gerente General']);

      await client.query('COMMIT'); // Guardamos todo

      res.status(201).json({ message: 'Empresa y Administrador creados con éxito', empresa_id: nuevaEmpresaId });
    } catch (error) {
      await client.query('ROLLBACK'); // Si algo falla, deshacemos todo
      console.error(error);
      if (error.code === '23505') { // Código de error unique violation en Postgres
        return res.status(400).json({ error: 'El RUC o el correo ya están registrados en el sistema.' });
      }
      res.status(500).json({ error: 'Error interno al crear el inquilino' });
    } finally {
      client.release();
    }
  },

  // 3. Suspender o Activar a una empresa (Si no te pagan el mes)
  toggleEstadoEmpresa: async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; // true = activo, false = suspendido
    try {
      await pool.query('UPDATE empresas SET estado = $1 WHERE id = $2', [estado, id]);
      res.json({ message: `Empresa ${estado ? 'activada' : 'suspendida'} correctamente` });
    } catch (error) {
      res.status(500).json({ error: 'Error al cambiar estado de la empresa' });
    }
  }
};

module.exports = tenantController;