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

// ✨ NUEVO: Limpiador seguro para el arreglo de sucursales (Evita crasheos)
const parseSucursalesSeguras = (suc) => {
  if (!suc) return [];
  try {
    if (Array.isArray(suc)) return suc;
    if (typeof suc === 'string') {
      let parsed = JSON.parse(suc);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed); 
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.error("Error limpiando sucursales:", e);
  }
  return [];
};

const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // ✨ INYECCIÓN: Agregamos emp.estado para saber si la empresa está suspendida
      const query = `
        SELECT u.id, u.empresa_id, u.email, u.password_hash, u.rol, u.categorias, u.area_cargo, u.sucursales_asignadas,
               e.nombre_completo, e.avatar, e.dni, e.telefono, e.correo_personal,
               emp.estado AS empresa_estado
        FROM usuarios u
        LEFT JOIN empleados e ON u.empleado_id = e.id
        LEFT JOIN empresas emp ON u.empresa_id = emp.id
        WHERE u.email = $1
      `;
      const { rows } = await pool.query(query, [email]);
      
      if (rows.length === 0) return res.status(401).json({ error: 'Credenciales inválidas' });
      
      const usuario = rows[0];

      // ✨ EL FIX DEL BLOQUEO (SaaS) ✨
      // Si la empresa existe y está suspendida (estado = false), lo rebotamos.
      if (usuario.empresa_estado === false && usuario.rol !== 'SuperAdmin') {
        return res.status(403).json({ error: 'ACCESO DENEGADO: El servicio de tu empresa se encuentra suspendido. Contacta a soporte.' });
      }

      const validPassword = await bcrypt.compare(password, usuario.password_hash);
      if (!validPassword) return res.status(401).json({ error: 'Credenciales inválidas' });

      const catsLimpias = parseCategoriasSeguras(usuario.categorias);
      const sucsLimpias = parseSucursalesSeguras(usuario.sucursales_asignadas);

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
          sucursales_asignadas: sucsLimpias, 
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
        SELECT u.id, u.email, u.rol, u.categorias, u.area_cargo, u.sucursales_asignadas,
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
      usuario.sucursales_asignadas = parseSucursalesSeguras(usuario.sucursales_asignadas);
      
      res.json(usuario);
    } catch (error) {
      console.error("Error en auth/me:", error);
      res.status(500).json({ error: 'Error al obtener datos de sesión' });
    }
  },

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