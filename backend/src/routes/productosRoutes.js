const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const verifyToken = require('../middlewares/authMiddleware');

// Todas estas rutas están protegidas
router.use(verifyToken);

router.get('/', productosController.listar);
router.post('/', productosController.crear);

module.exports = router;