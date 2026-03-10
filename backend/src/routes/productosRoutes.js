const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const verifyToken = require('../middlewares/authMiddleware');
const requireModificador = require('../middlewares/requireModificador');
const multer = require('multer');

// ✨ Usamos memoria RAM en lugar del disco duro
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(verifyToken);

router.get('/', productosController.listar);

// ✨ LA MAGIA: upload.any() para que no bloquee ningún nombre de archivo
router.post('/', requireModificador('Inventario'), upload.any(), productosController.crear);
router.post('/bulk', requireModificador('Inventario'), productosController.crearGranel);
router.put('/:id', requireModificador('Inventario'), upload.any(), productosController.actualizar);

router.delete('/:id', requireModificador('Inventario'), productosController.eliminar);

module.exports = router;