const express = require('express');
const router = express.Router();
const proveedoresController = require('../controllers/proveedoresController');

// 👇 CORRECCIÓN: Lo importamos exactamente igual que en productosRoutes.js (sin llaves)
const verifyToken = require('../middlewares/authMiddleware'); 
const { audit } = require('../middlewares/auditMiddleware');

// Aplicamos el middleware
router.use(verifyToken);

// Listar proveedores
router.get('/', audit('GET', '/proveedores', 'proveedores'), proveedoresController.listar);

// Crear proveedor
router.post('/', audit('POST', '/proveedores', 'proveedores'), proveedoresController.crear);

// Actualizar proveedor
router.put('/:id', audit('PUT', '/proveedores', 'proveedores'), proveedoresController.actualizar);

// Eliminar (desactivar) proveedor
router.delete('/:id', audit('DELETE', '/proveedores', 'proveedores'), proveedoresController.eliminar);

module.exports = router;