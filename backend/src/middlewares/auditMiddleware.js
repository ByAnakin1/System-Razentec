const { pool } = require('../config/db');

/**
 * Middleware de auditoría: registra acciones en logs_actividad
 * Uso: router.get('/ruta', verifyToken, audit('GET', '/modulo', 'tabla'), controller.method)
 * Se ejecuta al finalizar la respuesta (res.on('finish')) para capturar el status correcto.
 */
const audit = (accion, modulo, tablaAfectada) => (req, res, next) => {
  req.audit = { accion, modulo, tablaAfectada: tablaAfectada || modulo };

  res.on('finish', () => {
    if (!req.user || res.statusCode < 200 || res.statusCode >= 300) return;

    const { empresa_id, id: usuarioId } = req.user;
    const { accion: a, modulo: mod, tablaAfectada: tabla } = req.audit;
    let registroId = req.params?.id ? parseInt(req.params.id, 10) : null;
    if (isNaN(registroId)) registroId = null;

    const detalles = {};
    if ((a === 'POST' || a === 'PUT' || a === 'DELETE') && req.body && Object.keys(req.body).length) {
      detalles.payload = req.body;
    }

    pool.query(
      `INSERT INTO logs_actividad (empresa_id, usuario_id, accion, modulo, tabla_afectada, registro_id, detalles)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [empresa_id, usuarioId, a, mod, tabla, registroId, JSON.stringify(detalles)]
    ).catch(err => console.error('Error registrando log:', err.message));
  });

  next();
};

module.exports = { audit };
