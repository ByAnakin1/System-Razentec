const { Pool } = require('pg');
require('dotenv').config();

// Verificación de seguridad básica
if (!process.env.DATABASE_URL) {
  console.error('❌ Error fatal: DATABASE_URL no está definida en el archivo .env');
  process.exit(1);
}

// Configuración del Pool con SSL forzado para Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // <--- ¡ESTO ES OBLIGATORIO PARA SUPABASE!
  }
});

// Eventos de conexión
pool.on('connect', () => {
  console.log('✅ Conexión establecida con la base de datos Supabase');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el cliente de base de datos', err);
  process.exit(-1);
});

// Función para probar la conexión
const connectDB = async () => {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    console.log(`📡 Base de datos respondiendo. Hora del servidor: ${res.rows[0].now}`);
    client.release();
  } catch (err) {
    console.error('❌ Error al conectar con la base de datos:', err.message);
    // No matamos el proceso aquí para que puedas ver el error en consola sin que se cierre todo
  }
};

module.exports = { pool, connectDB };