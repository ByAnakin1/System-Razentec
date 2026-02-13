const express = require('express');
const router = express.Router();
const sucursalesController = require('../controllers/sucursalesController');
const verifyToken = require('../middlewares/authMiddleware');

router.use(verifyToken); // Proteger rutas

router.post('/', sucursalesController.create);
router.get('/', sucursalesController.listar);

module.exports = router;