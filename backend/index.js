require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==========================================
// 📌 RUTAS DE LA API (TODAS CONECTADAS)
// ==========================================
app.use('/api/dashboard', require('./src/routes/dashboardRoutes')); 
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/usuarios', require('./src/routes/usuariosRoutes'));
app.use('/api/empleados', require('./src/routes/empleadosRoutes'));
app.use('/api/productos', require('./src/routes/productosRoutes')); 
app.use('/api/categorias', require('./src/routes/categoriasRoutes'));
app.use('/api/auditoria', require('./src/routes/auditoriaRoutes'));

// ✨ FIX: Montamos las rutas SaaS directamente en /api y corregimos la ruta del archivo ✨
app.use('/api', require('./src/routes/saas.routes'));

// MÓDULOS DE NEGOCIO
app.use('/api/ventas', require('./src/routes/ventasRoutes'));
app.use('/api/clientes', require('./src/routes/clientesRoutes'));
app.use('/api/sucursales', require('./src/routes/sucursalesRoutes')); 

// RUTAS RESTAURADAS:
app.use('/api/proveedores', require('./src/routes/proveedoresRoutes')); 
app.use('/api/compras', require('./src/routes/comprasRoutes')); 

// ✨ NUEVA RUTA PARA EL MODO DIOS (SAAS) ✨
app.use('/api/empresas', require('./src/routes/empresasRoutes')); 

// ==========================================
// 📌 INICIO DEL SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️ El puerto ${PORT} está ocupado. Abriendo en el puerto ${PORT + 1}...`);
    app.listen(PORT + 1, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT + 1}`);
    });
  } else {
    console.error(err);
  }
});