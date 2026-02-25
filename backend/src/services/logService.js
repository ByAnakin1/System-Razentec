const { pool } = require('../config/db');

const registrarLog = async (usuario_id, empresa_id, accion, modulo, detalles) => {
  try {
    await pool.query(
      'INSERT INTO logs_actividad (usuario_id, empresa_id, accion, modulo, detalles) VALUES ($1, $2, $3, $4, $5)',
      [usuario_id, empresa_id, accion, modulo, detalles]
    );
  } catch (error) {
    console.error("❌ Error interno al guardar auditoría:", error.message);
  }
};

module.exports = { registrarLog };