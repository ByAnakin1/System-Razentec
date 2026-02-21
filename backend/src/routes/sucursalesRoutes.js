const express = require('express');
const router = express.Router();
const sucursalesController = require('../controllers/sucursalesController');
const verifyToken = require('../middlewares/authMiddleware');
const requireModificador = require('../middlewares/requireModificador');
const { audit } = require('../middlewares/auditMiddleware');

router.use(verifyToken);

router.get('/', audit('GET', '/sucursales', 'sucursales'), sucursalesController.listar);
router.post('/', requireModificador(), audit('POST', '/sucursales', 'sucursales'), sucursalesController.create);

module.exports = router;