const { pool } = require('../config/db');

/**
 * Middleware requireModificador Inteligente
 * Consulta la base de datos en tiempo real para evitar problemas con Tokens desactualizados.
 */
const requireModificador = (moduleName) => {
  return async (req, res, next) => {
    const metodo = req.method.toUpperCase();
    
    // 🟢 Si solo quiere VER (GET), el guardia abre la puerta. 
    // (El controlador se encargará de mostrarle solo los de su sucursal)
    if (metodo === 'GET') return next();

    try {
      // 1. Buscamos los permisos REALES y ACTUALIZADOS en la Base de Datos
      const { rows } = await pool.query('SELECT rol, categorias FROM usuarios WHERE id = $1', [req.user.id]);
      
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Usuario no encontrado en el sistema.' });
      }

      const usuarioDB = rows[0];

      // 2. Si es Administrador, tiene poder absoluto
      if (usuarioDB.rol === 'Administrador') return next();

      // 3. Parseamos el JSON de permisos de forma segura
      let permisos = [];
      if (usuarioDB.categorias) {
        try {
          permisos = typeof usuarioDB.categorias === 'string' ? JSON.parse(usuarioDB.categorias) : usuarioDB.categorias;
          if (typeof permisos === 'string') permisos = JSON.parse(permisos); // Doble validación
        } catch (e) {
          permisos = [];
        }
      }

      // 4. Verificamos si tiene la llave maestra (Modificador) o la llave del módulo (Modificador_Modulo)
      const tienePoderGlobal = Array.isArray(permisos) && permisos.includes('Modificador');
      const tienePoderModulo = moduleName && Array.isArray(permisos) && permisos.includes(`Modificador_${moduleName}`);

      if (tienePoderGlobal || tienePoderModulo) {
        return next(); // ✅ Tiene permiso, lo dejamos pasar a guardar/editar
      } else {
        return res.status(403).json({ error: `Acceso Denegado: No tienes permisos para Crear o Editar en el módulo ${moduleName}.` });
      }

    } catch (error) {
      console.error(`Error en el guardia de seguridad del módulo ${moduleName}:`, error);
      return res.status(500).json({ error: 'Error interno verificando permisos de seguridad.' });
    }
  };
};

module.exports = requireModificador;