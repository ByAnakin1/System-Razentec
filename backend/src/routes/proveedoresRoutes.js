const express = require('express');
const router = express.Router();
const proveedoresController = require('../controllers/proveedoresController');
const verifyToken = require('../middlewares/authMiddleware'); 

// 🚀 Aplicamos seguridad a todas las rutas
router.use(verifyToken);

// 🚀 Rutas limpias (Sin el audit automático que genera los JSON feos)
router.get('/', proveedoresController.listar);
router.post('/', proveedoresController.crear);
router.put('/:id', proveedoresController.actualizar);
router.delete('/:id', proveedoresController.eliminar);

module.exports = router;