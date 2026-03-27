const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const tenantController = {
  // 1. Ver todas las empresas (Ahora trae el email del admin)
  getEmpresas: async (req, res) => {
    try {
      const query = `
        SELECT 
            e.id, e.nombre, e.ruc, e.estado, e.created_at,
            u.email AS admin_email
        FROM empresas e
        LEFT JOIN usuarios u ON u.empresa_id = e.id AND u.rol = 'Administrador'
        ORDER BY e.created_at DESC
      `;
      const result = await pool.query(query);
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

      // C. Crear un empleado para el admin
      const insertEmpleado = `INSERT INTO empleados (empresa_id, nombre_completo, correo_corporativo) VALUES ($1, $2, $3) RETURNING id`;
      const resEmpleado = await client.query(insertEmpleado, [nuevaEmpresaId, admin_nombre, admin_email]);
      const nuevoEmpleadoId = resEmpleado.rows[0].id;

      // D. Crear la cuenta de usuario Administrador de esa empresa
      const insertUsuario = `
        INSERT INTO usuarios (empresa_id, empleado_id, email, password_hash, rol, area_cargo) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(insertUsuario, [nuevaEmpresaId, nuevoEmpleadoId, admin_email, passwordHash, 'Administrador', 'Gerente General']);

      await client.query('COMMIT'); // Guardamos todo

      res.status(201).json({ message: 'Empresa y Administrador creados con éxito', empresa_id: nuevaEmpresaId });
    } catch (error) {
      await client.query('ROLLBACK'); // Si algo falla, deshacemos todo
      console.error(error);
      if (error.code === '23505') { 
        return res.status(400).json({ error: 'El RUC o el correo ya están registrados en el sistema.' });
      }
      res.status(500).json({ error: 'Error interno al crear el inquilino' });
    } finally {
      client.release();
    }
  },

  // ✨ 3. NUEVO: Actualizar Empresa y Credenciales del Administrador
  actualizarEmpresa: async (req, res) => {
    const { id } = req.params; // UUID de la empresa
    const { nombre_empresa, ruc, admin_email, admin_password } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // A. Actualizar nombre y ruc de la empresa
      await client.query(
        'UPDATE empresas SET nombre = $1, ruc = $2 WHERE id = $3',
        [nombre_empresa, ruc, id]
      );

      // B. Buscar el usuario administrador principal de esta empresa
      const userRes = await client.query(
        "SELECT id, empleado_id FROM usuarios WHERE empresa_id = $1 AND rol = 'Administrador' LIMIT 1",
        [id]
      );

      if (userRes.rows.length > 0) {
        const adminUser = userRes.rows[0];

        // C. Actualizar correo si fue modificado
        if (admin_email) {
          await client.query('UPDATE usuarios SET email = $1 WHERE id = $2', [admin_email, adminUser.id]);
          // Actualizamos también la tabla empleados para mantener sincronía
          await client.query('UPDATE empleados SET correo_corporativo = $1 WHERE id = $2', [admin_email, adminUser.empleado_id]);
        }

        // D. Actualizar contraseña solo si el SuperAdmin escribió una nueva
        if (admin_password && admin_password.trim() !== '') {
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash(admin_password, salt);
          await client.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [passwordHash, adminUser.id]);
        }
      }

      await client.query('COMMIT');
      res.json({ message: 'Cliente actualizado correctamente' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error("Error al actualizar empresa:", error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Ese correo o RUC ya está en uso por otra empresa.' });
      }
      res.status(500).json({ error: 'Error al actualizar los datos del cliente.' });
    } finally {
      client.release();
    }
  },

  // 4. Suspender o Activar a una empresa
  toggleEstadoEmpresa: async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; 
    try {
      await pool.query('UPDATE empresas SET estado = $1 WHERE id = $2', [estado, id]);
      res.json({ message: `Empresa ${estado ? 'activada' : 'suspendida'} correctamente` });
    } catch (error) {
      res.status(500).json({ error: 'Error al cambiar estado de la empresa' });
    }
  }
};

module.exports = tenantController;