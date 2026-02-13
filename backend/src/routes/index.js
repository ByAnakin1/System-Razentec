const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const productosRoutes = require('./productosRoutes');
const sucursalesRoutes = require('./sucursalesRoutes');
const categoriasRoutes = require('./categoriasRoutes');

// Aquí agruparemos todas las rutas
router.use('/auth', authRoutes);
router.use('/productos', productosRoutes);
router.use('/sucursales', sucursalesRoutes);
router.use('/categorias', categoriasRoutes);

module.exports = router;