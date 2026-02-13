const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const productosRoutes = require('./productosRoutes');

// Aquí agruparemos todas las rutas
router.use('/auth', authRoutes);
router.use('/productos', productosRoutes);

module.exports = router;