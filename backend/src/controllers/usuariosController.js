const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const ROLES_ASIGNABLES = ['Supervisor', 'Empleado'];
const MODULOS = ['Inventario', 'Ventas', 'Compras', 'Clientes', 'Proveedores', 'Usuarios'];

const usuariosController = {
  listar: async (req, res) => {
    try {
      const query = `
        SELECT u.id, u.email, u.rol, u.categorias, u.area_cargo, e.nombre_completo, e.avatar, e.dni, e.telefono, e.correo_personal 
        FROM usuarios u 
        JOIN empleados e ON u.empleado_id = e.id 
        WHERE u.empresa_id = $1
      `;
      const { rows } = await pool.query(query, [req.user.empresa_id]);
      res.json(rows);
    } catch (error) { res.status(500).json({ error: 'Error al listar usuarios' }); }
  },

  crear: async (req, res) => {
    try {
      const { empleado_id, area_cargo, email, password, rol, categorias, admin_password } = req.body;
      
      const adminRes = await pool.query('SELECT password_hash FROM usuarios WHERE id = $1', [req.user.id]);
      if (!await bcrypt.compare(admin_password, adminRes.rows[0].password_hash)) return res.status(401).json({ error: 'Contraseña de administrador incorrecta' });

      const hash = await bcrypt.hash(password, await bcrypt.genSalt(10));
      const catsJson = JSON.stringify(categorias || []);

      await pool.query(
        'INSERT INTO usuarios (empresa_id, empleado_id, area_cargo, email, password_hash, rol, categorias) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [req.user.empresa_id, empleado_id, area_cargo, email, hash, rol || 'Empleado', catsJson]
      );
      res.status(201).json({ message: 'Usuario creado exitosamente' });
    } catch (error) { res.status(500).json({ error: 'Error al crear credenciales.' }); }
  },

  obtenerMiPerfil: async (req, res) => {
    try {
      const query = `
        SELECT u.email, u.rol, u.categorias, u.area_cargo, e.nombre_completo as nombre, e.dni, e.telefono, e.correo_personal, e.avatar 
        FROM usuarios u JOIN empleados e ON u.empleado_id = e.id WHERE u.id = $1
      `;
      const { rows } = await pool.query(query, [req.user.id]);
      res.json(rows[0]);
    } catch (error) { res.status(500).json({ error: 'Error al cargar perfil' }); }
  },

  actualizarMiAvatar: async (req, res) => {
    try {
      const { avatar } = req.body;
      await pool.query('UPDATE empleados SET avatar = $1 WHERE id = (SELECT empleado_id FROM usuarios WHERE id = $2)', [avatar, req.user.id]);
      res.json({ message: 'Avatar guardado' });
    } catch (error) { res.status(500).json({ error: 'Error al guardar foto' }); }
  },

  actualizarPerfil: async (req, res) => {
    try {
      const { id } = req.params;
      const { email, rol, area_cargo, categorias, nueva_password, admin_password } = req.body;
      
      const adminRes = await pool.query('SELECT password_hash FROM usuarios WHERE id = $1', [req.user.id]);
      if (!await bcrypt.compare(admin_password, adminRes.rows[0].password_hash)) return res.status(401).json({ error: 'Contraseña incorrecta' });

      await pool.query('UPDATE usuarios SET email = $1, rol = $2, area_cargo = $3, categorias = $4 WHERE id = $5 AND empresa_id = $6', 
        [email, rol, area_cargo, JSON.stringify(categorias), id, req.user.empresa_id]);

      if (nueva_password) {
        const hash = await bcrypt.hash(nueva_password, await bcrypt.genSalt(10));
        await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hash, id]);
      }
      res.json({ message: 'Usuario actualizado' });
    } catch (error) { res.status(500).json({ error: 'Error al actualizar' }); }
  },

  actualizarDatosPersonales: async (req, res) => {
    try {
      const { id } = req.params;
      const { dni, telefono, correo_personal, admin_password } = req.body;
      const adminRes = await pool.query('SELECT password_hash FROM usuarios WHERE id = $1', [req.user.id]);
      if (!await bcrypt.compare(admin_password, adminRes.rows[0].password_hash)) return res.status(401).json({ error: 'Contraseña incorrecta' });

      await pool.query(
        `UPDATE empleados SET dni = $1, telefono = $2, correo_personal = $3 WHERE id = (SELECT empleado_id FROM usuarios WHERE id = $4 AND empresa_id = $5)`,
        [dni, telefono, correo_personal, id, req.user.empresa_id]
      );
      res.json({ message: 'Datos personales actualizados' });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
  },

  eliminar: async (req, res) => {
    try {
      if (req.params.id === req.user.id) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
      await pool.query('DELETE FROM usuarios WHERE id = $1 AND empresa_id = $2', [req.params.id, req.user.empresa_id]);
      res.json({ message: 'Eliminado' });
    } catch (error) { res.status(500).json({ error: 'Error al eliminar' }); }
  },

  verificarAdminPassword: async (req, res) => {
    try {
      const { admin_password } = req.body;
      const adminRes = await pool.query('SELECT password_hash FROM usuarios WHERE id = $1', [req.user.id]);
      if (!await bcrypt.compare(admin_password, adminRes.rows[0].password_hash)) return res.status(401).json({ error: 'Contraseña incorrecta' });
      res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Error' }); }
  }
};

module.exports = usuariosController;