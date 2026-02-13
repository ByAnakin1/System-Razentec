const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const { connectDB } = require('./src/config/db');

const routes = require('./src/routes/index');

const app = express();

// --- MIDDLEWARES (El orden importa MUCHO aquí) ---
app.use(cors());
app.use(express.json()); // <--- ¡ESTO DEBE IR PRIMERO!
app.use(morgan('dev'));

// --- RUTAS ---
app.use('/api', routes); // <--- Las rutas van DESPUÉS de express.json()

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
};

startServer();