const audit = (accion_personalizada, modulo_personalizado, tabla_afectada = null) => {
  return (req, res, next) => {
    // 🛑 APAGADO DE EMERGENCIA 🛑
    // Hemos neutralizado este middleware porque generaba logs feos (JSON crudo).
    // Ahora toda la auditoría se maneja de forma limpia y manual desde los controladores
    // usando la función registrarLog().
    
    next(); // Simplemente deja pasar la petición sin guardar nada
  };
};

module.exports = { audit };