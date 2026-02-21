/**
 * Middleware requireModificador
 * Solo permite POST, PUT, DELETE a usuarios con Modificador (global) o Modificador_<módulo>
 * module: 'Inventario', 'Ventas', etc. (opcional; si no se pasa, solo verifica global)
 */
const requireModificador = (module) => {
  const fn = (req, res, next) => {
    const metodo = req.method.toUpperCase();
    if (metodo === 'GET') return next();

    const rol = req.user?.rol;
    const categorias = req.user?.categorias || [];

    if (rol === 'Administrador') return next();

    const tieneGlobal = Array.isArray(categorias) && categorias.includes('Modificador');
    const tieneModulo = module && Array.isArray(categorias) && categorias.includes(`Modificador_${module}`);
    const puede = tieneGlobal || tieneModulo;

    if (!puede) {
      return res.status(403).json({
        error: 'Acceso denegado: Se requiere permiso "Modificador" para esta acción'
      });
    }

    next();
  };
  return fn;
};

module.exports = requireModificador;
