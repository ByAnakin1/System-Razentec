const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const verifyToken = require('../middlewares/authMiddleware');
const requireModificador = require('../middlewares/requireModificador');
const { audit } = require('../middlewares/auditMiddleware');

router.use(verifyToken);

router.get('/', audit('GET', '/productos', 'productos'), productosController.listar);
router.post('/', requireModificador('Inventario'), audit('POST', '/productos', 'productos'), productosController.crear);
router.put('/:id', requireModificador('Inventario'), audit('PUT', '/productos', 'productos'), productosController.actualizar);
router.delete('/:id', requireModificador('Inventario'), audit('DELETE', '/productos', 'productos'), productosController.eliminar);

module.exports = router;