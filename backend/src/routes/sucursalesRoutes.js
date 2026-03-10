const express = require('express');
const router = express.Router();
const sucursalesController = require('../controllers/sucursalesController');
const verifyToken = require('../middlewares/authMiddleware'); // ✅ Ahora usamos el central
const requireModificador = require('../middlewares/requireModificador');

router.use(verifyToken);

// 🟢 Lectura
router.get('/', sucursalesController.listar);

// 🔴 Escritura (Crear o borrar sucursales es sumamente delicado)
router.post('/', requireModificador('Sucursales'), sucursalesController.crear);
router.delete('/:id', requireModificador('Sucursales'), sucursalesController.eliminar);

module.exports = router;