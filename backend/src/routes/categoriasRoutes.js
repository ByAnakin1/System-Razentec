const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoriasController');
const verifyToken = require('../middlewares/authMiddleware');
const requireModificador = require('../middlewares/requireModificador');
const { audit } = require('../middlewares/auditMiddleware');

router.use(verifyToken);

router.get('/', audit('GET', '/categorias', 'categorias'), controller.listar);
router.post('/', requireModificador('Inventario'), audit('POST', '/categorias', 'categorias'), controller.crear);
router.put('/:id', requireModificador('Inventario'), audit('PUT', '/categorias', 'categorias'), controller.actualizar);
router.delete('/:id', requireModificador('Inventario'), audit('DELETE', '/categorias', 'categorias'), controller.eliminar);

module.exports = router;