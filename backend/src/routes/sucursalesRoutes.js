const express = require('express');
const router = express.Router();
const sucursalesController = require('../controllers/sucursalesController');
const verifyToken = require('../middlewares/authMiddleware'); 
const requireModificador = require('../middlewares/requireModificador');

router.use(verifyToken);

// 🟢 Lectura
router.get('/', sucursalesController.listar);

// 🔴 Escritura (Crear, Actualizar, Borrar)
router.post('/', requireModificador('Sucursales'), sucursalesController.crear);
// ✨ AÑADIMOS LA RUTA PUT PARA EDITAR ✨
router.put('/:id', requireModificador('Sucursales'), sucursalesController.actualizar);
router.delete('/:id', requireModificador('Sucursales'), sucursalesController.eliminar);

module.exports = router;