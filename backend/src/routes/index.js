const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const productosRoutes = require('./productosRoutes');
const ventasRoutes = require('./ventasRoutes');
const sucursalesRoutes = require('./sucursalesRoutes');
const categoriasRoutes = require('./categoriasRoutes');
const usuariosRoutes = require('./usuariosRoutes');
const logsRoutes = require('./logsRoutes');

router.use('/auth', authRoutes);
router.use('/productos', productosRoutes);
router.use('/ventas', ventasRoutes);
router.use('/sucursales', sucursalesRoutes);
router.use('/categorias', categoriasRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/logs', logsRoutes);

module.exports = router;