const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const query = `
        SELECT u.id, u.empresa_id, u.email, u.password_hash, u.rol, u.categorias, u.area_cargo,
               e.nombre_completo, e.avatar, e.dni, e.telefono, e.correo_personal 
        FROM usuarios u
        LEFT JOIN empleados e ON u.empleado_id = e.id
        WHERE u.email = $1
      `;
      const { rows } = await pool.query(query, [email]);
      
      if (rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });
      const usuario = rows[0];
      if (!await bcrypt.compare(password, usuario.password_hash)) return res.status(401).json({ error: 'Credenciales inválidas' });

      const token = jwt.sign({ id: usuario.id, empresa_id: usuario.empresa_id, rol: usuario.rol, categorias: usuario.categorias }, process.env.JWT_SECRET, { expiresIn: '8h' });

      res.json({
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre_completo || 'Admin Principal',
          area_cargo: usuario.area_cargo,
          email: usuario.email, rol: usuario.rol, categorias: usuario.categorias, avatar: usuario.avatar,
          dni: usuario.dni, telefono: usuario.telefono, correo_personal: usuario.correo_personal
        }
      });
    } catch (error) { res.status(500).json({ error: 'Error en el servidor al iniciar sesión' }); }
  },

  me: async (req, res) => {
    try {
      const query = `
        SELECT u.id, u.email, u.rol, u.categorias, u.area_cargo, 
               e.nombre_completo as nombre, e.avatar, e.dni, e.telefono, e.correo_personal 
        FROM usuarios u LEFT JOIN empleados e ON u.empleado_id = e.id WHERE u.id = $1
      `;
      const { rows } = await pool.query(query, [req.user.id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

      const usuario = rows[0];
      if (!usuario.nombre) usuario.nombre = 'Admin Principal';
      res.json(usuario);
    } catch (error) { res.status(500).json({ error: 'Error al obtener datos de sesión' }); }
  }
};

module.exports = authController;