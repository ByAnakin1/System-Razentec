const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

router.get('/', clientesController.getClientes); // 👇 Esta es la nueva
router.post('/', clientesController.crearCliente);

module.exports = router;