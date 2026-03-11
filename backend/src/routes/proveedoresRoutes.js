const express = require('express');
const router = express.Router();
const proveedoresController = require('../controllers/proveedoresController');
const verifyToken = require('../middlewares/authMiddleware'); 
const requireModificador = require('../middlewares/requireModificador');

router.use(verifyToken);

// 🟢 Lectura
router.get('/', proveedoresController.listar);

// 🔴 Escritura
router.post('/', requireModificador('Proveedores'), proveedoresController.crear);
router.put('/:id', requireModificador('Proveedores'), proveedoresController.actualizar);
router.delete('/:id', requireModificador('Proveedores'), proveedoresController.eliminar);

module.exports = router;