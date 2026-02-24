const { pool } = require('../config/db');

// 1. Obtener todos los clientes
const getClientes = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre_completo AS nombre, documento_identidad AS dni FROM clientes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener clientes" });
  }
};

// 2. Crear un cliente nuevo
const crearCliente = async (req, res) => {
  const { nombre, dni, empresa_id } = req.body;
  try {
    const idEmpresa = (typeof empresa_id === 'string' && empresa_id.length === 36) ? empresa_id : null;
    const query = `
      INSERT INTO clientes (empresa_id, nombre_completo, documento_identidad)
      VALUES ($1, $2, $3)
      RETURNING id, nombre_completo AS nombre, documento_identidad AS dni
    `;
    const result = await pool.query(query, [idEmpresa, nombre, dni]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Error al guardar el cliente" });
  }
};

module.exports = { getClientes, crearCliente };