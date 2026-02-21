/**
 * Script de seed: Sincroniza admin@razentec.com y crea usuarios de prueba
 * Ejecutar: node scripts/seedUsuariosPrueba.js
 */
require('dotenv').config();
const { pool } = require('../src/config/db');
const bcrypt = require('bcryptjs');

const PASSWORD_DEFECTO = '123456';
const USUARIOS_PRUEBA = [
  {
    nombre_completo: 'Supervisor Ver',
    email: 'supervisor_ver@razentec.com',
    rol: 'Supervisor',
    categorias: ['Inventario', 'Ventas']
  },
  {
    nombre_completo: 'Supervisor Mod',
    email: 'supervisor_mod@razentec.com',
    rol: 'Supervisor',
    categorias: ['Inventario', 'Ventas', 'Modificador']
  },
  {
    nombre_completo: 'Vendedor',
    email: 'vendedor@razentec.com',
    rol: 'Empleado',
    categorias: ['Ventas']
  }
];

const run = async () => {
  try {
    const client = await pool.connect();

    // 1. Obtener empresa_id del admin
    const adminRes = await client.query(
      "SELECT id, empresa_id FROM usuarios WHERE email = 'admin@razentec.com'"
    );
    if (adminRes.rows.length === 0) {
      console.error('❌ admin@razentec.com no existe. Regístralo primero.');
      client.release();
      process.exit(1);
    }
    const admin = adminRes.rows[0];
    const empresaId = admin.empresa_id;

    // 2. Sincronizar admin: rol Administrador, todas las categorías Y CONTRASEÑA
    const saltAdmin = await bcrypt.genSalt(10);
    const passwordHashAdmin = await bcrypt.hash(PASSWORD_DEFECTO, saltAdmin);

    await client.query(
      `UPDATE usuarios 
       SET rol = 'Administrador', 
           password_hash = $1,
           categorias = '["Inventario", "Ventas", "Compras", "Clientes", "Proveedores", "Usuarios", "Modificador"]'::jsonb
       WHERE email = 'admin@razentec.com'`,
      [passwordHashAdmin]
    );
    console.log('✅ admin@razentec.com sincronizado (Contraseña resetada a 123456)');

    // 3. Crear usuarios de prueba
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(PASSWORD_DEFECTO, salt);

    for (const u of USUARIOS_PRUEBA) {
      const existente = await client.query('SELECT id FROM usuarios WHERE email = $1', [u.email]);
      const catJson = JSON.stringify(u.categorias);

      if (existente.rows.length > 0) {
        await client.query(
          `UPDATE usuarios SET rol = $1, categorias = $2::jsonb WHERE email = $3`,
          [u.rol, catJson, u.email]
        );
        console.log(`✅ ${u.email} actualizado`);
      } else {
        await client.query(
          `INSERT INTO usuarios (empresa_id, nombre_completo, email, password_hash, rol, categorias)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
          [empresaId, u.nombre_completo, u.email, passwordHash, u.rol, catJson]
        );
        console.log(`✅ ${u.email} creado (clave: ${PASSWORD_DEFECTO})`);
      }
    }

    client.release();
    console.log('\n✅ Seed completado. empresa_id central:', empresaId);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
