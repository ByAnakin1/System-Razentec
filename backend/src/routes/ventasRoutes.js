const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventasController');


router.get('/', ventasController.getVentas);
router.post('/', ventasController.crearVenta);
router.get('/:id/detalle', ventasController.getDetalleVenta);
router.delete('/:id', ventasController.eliminarVenta);

module.exports = router;