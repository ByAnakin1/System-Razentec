const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const verifyToken = require('../middlewares/authMiddleware');
const requireModificador = require('../middlewares/requireModificador');
const multer = require('multer');

// ✨ Usamos memoria RAM para enviar directo a Supabase
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(verifyToken);

// Rutas sin audit automático para evitar los logs feos
router.get('/', productosController.listar);
router.post('/', requireModificador('Inventario'), upload.single('imagen_archivo'), productosController.crear);
router.post('/bulk', requireModificador('Inventario'), productosController.crearGranel);
router.put('/:id', requireModificador('Inventario'), upload.single('imagen_archivo'), productosController.actualizar);
router.delete('/:id', requireModificador('Inventario'), productosController.eliminar);

module.exports = router;