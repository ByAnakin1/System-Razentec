// En tu routes/comprasRoutes.js
const express = require('express');
const router = express.Router();
const comprasController = require('../controllers/comprasController');
const authMiddleware = require('../middlewares/authMiddleware');
const verifyToken = authMiddleware.verifyToken || authMiddleware;
const { audit } = require('../middlewares/auditMiddleware');

router.use(verifyToken);

router.get('/', audit('GET', '/compras', 'compras'), comprasController.listar);
router.post('/', audit('POST', '/compras', 'compras'), comprasController.crear);
// ✨ NUEVA RUTA PARA VER EL DETALLE
router.get('/:id', audit('GET', '/compras/detalle', 'compras'), comprasController.obtenerPorId);

module.exports = router;