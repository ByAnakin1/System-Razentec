require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==========================================
// 📌 RUTAS DE LA API
// ==========================================
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/usuarios', require('./src/routes/usuariosRoutes'));
app.use('/api/empleados', require('./src/routes/empleadosRoutes'));
app.use('/api/productos', require('./src/routes/productosRoutes')); 
app.use('/api/categorias', require('./src/routes/categoriasRoutes'));
app.use('/api/auditoria', require('./src/routes/auditoriaRoutes'));

// MÓDULOS DE NEGOCIO
app.use('/api/ventas', require('./src/routes/ventasRoutes'));
app.use('/api/clientes', require('./src/routes/clientesRoutes'));
app.use('/api/sucursales', require('./src/routes/sucursalesRoutes')); // ✨ ESTA LÍNEA SOLUCIONA EL ERROR AL GUARDAR

// ==========================================
// 📌 MANEJO INTELIGENTE DE PUERTOS
// ==========================================
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️ El puerto ${PORT} está ocupado (fantasma). Abriendo en el puerto ${PORT + 1}...`);
    app.listen(PORT + 1, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT + 1}`);
    });
  } else {
    console.error(err);
  }
});