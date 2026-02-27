const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==========================================
// 📌 RUTAS DE LA API
// ==========================================
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/usuarios', require('./src/routes/usuariosRoutes'));
app.use('/api/empleados', require('./src/routes/empleadosRoutes'));
app.use('/api/productos', require('./src/routes/productosRoutes')); 
app.use('/api/categorias', require('./src/routes/categoriasRoutes'));
app.use('/api/auditoria', require('./src/routes/auditoriaRoutes'));
app.use('/api/proveedores', require('./src/routes/proveedoresRoutes'));
app.use('/api/compras', require('./src/routes/comprasRoutes')); 

// ✨ RUTAS DEL MÓDULO DE VENTAS (Conexión Frontend - Backend)
app.use('/api/ventas', require('./src/routes/ventasRoutes'));
app.use('/api/clientes', require('./src/routes/clientesRoutes'));

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