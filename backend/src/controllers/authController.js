const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// ✨ IMPORTAMOS EL SERVICIO DE LOGS
const { registrarLog } = require('../services/logService');

const parseCategoriasSeguras = (cat) => {
  if (!cat) return [];
  try {
    if (Array.isArray(cat)) return cat;
    if (typeof cat === 'string') {
      let parsed = JSON.parse(cat);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed); 
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.error("Error limpiando permisos:", e);
  }
  return [];
};

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
      const validPassword = await bcrypt.compare(password, usuario.password_hash);
      if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas' });

      const catsLimpias = parseCategoriasSeguras(usuario.categorias);

      const token = jwt.sign(
        { id: usuario.id, empresa_id: usuario.empresa_id, rol: usuario.rol, categorias: catsLimpias },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      // ✨ REGISTRO DE AUDITORÍA: LOGIN
      await registrarLog(
        usuario.id, 
        usuario.empresa_id, 
        'LOGIN', 
        'Sistema', 
        'El usuario inició sesión en el sistema.'
      );

      res.json({
        token,
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre_completo || 'Usuario',
          area_cargo: usuario.area_cargo,
          email: usuario.email,
          rol: usuario.rol,
          categorias: catsLimpias, 
          avatar: usuario.avatar,
          dni: usuario.dni,
          telefono: usuario.telefono,
          correo_personal: usuario.correo_personal
        }
      });
    } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
    }
  },

  me: async (req, res) => {
    try {
      const query = `
        SELECT u.id, u.email, u.rol, u.categorias, u.area_cargo, 
               e.nombre_completo as nombre, e.avatar, e.dni, e.telefono, e.correo_personal 
        FROM usuarios u
        LEFT JOIN empleados e ON u.empleado_id = e.id
        WHERE u.id = $1
      `;
      const { rows } = await pool.query(query, [req.user.id]);
      
      if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

      const usuario = rows[0];
      if (!usuario.nombre) usuario.nombre = 'Usuario';
      
      usuario.categorias = parseCategoriasSeguras(usuario.categorias);
      
      res.json(usuario);
    } catch (error) {
      console.error("Error en auth/me:", error);
      res.status(500).json({ error: 'Error al obtener datos de sesión' });
    }
  },

  // ✨ NUEVA FUNCIÓN: LOGOUT
  logout: async (req, res) => {
    try {
      // REGISTRO DE AUDITORÍA: LOGOUT
      await registrarLog(
        req.user.id, 
        req.user.empresa_id, 
        'LOGOUT', 
        'Sistema', 
        'El usuario cerró su sesión manualmente.'
      );
      res.json({ message: 'Cierre de sesión registrado' });
    } catch (error) {
      res.status(500).json({ error: 'Error al cerrar sesión' });
    }
  }
};

module.exports = authController;