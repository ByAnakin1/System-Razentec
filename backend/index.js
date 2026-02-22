require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json()); // Permite recibir JSON en el body

// ==========================================
// 📌 RUTAS DE LA API
// ==========================================
app.use('/api/auth', require('./src/routes/authRoutes')); // Autenticación y Login
app.use('/api/usuarios', require('./src/routes/usuariosRoutes')); // Gestión de credenciales y permisos

// ✨ AQUÍ AGREGAMOS LA NUEVA RUTA DE EMPLEADOS ✨
app.use('/api/empleados', require('./src/routes/empleadosRoutes')); 
// ==========================================

// Puerto y arranque del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});