const express = require('express');
const router = express.Router();
const comprasController = require('../controllers/comprasController');
const verifyToken = require('../middlewares/authMiddleware');
const requireModificador = require('../middlewares/requireModificador');

// 🚀 Verificación de identidad para todas las rutas
router.use(verifyToken);

// 🟢 Lectura (Permitido para todos los que puedan entrar al módulo)
router.get('/', comprasController.listar);
router.get('/:id', comprasController.obtenerPorId);

// 🔴 Escritura (Solo Admin o quienes tengan la etiqueta Modificador_Compras)
router.post('/', requireModificador('Compras'), comprasController.crear);

module.exports = router;