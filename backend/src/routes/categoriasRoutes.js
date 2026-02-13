const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoriasController');
const verifyToken = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', controller.listar);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);

module.exports = router;