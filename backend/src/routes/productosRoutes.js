const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const verifyToken = require('../middlewares/authMiddleware');
const requireModificador = require('../middlewares/requireModificador');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads/');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadDir) },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.use(verifyToken);

// 🚀 Rutas limpias (Sin audit automático)
router.get('/', productosController.listar);
router.post('/', requireModificador('Inventario'), upload.single('imagen_archivo'), productosController.crear);
router.post('/bulk', requireModificador('Inventario'), productosController.crearGranel);
router.put('/:id', requireModificador('Inventario'), upload.single('imagen_archivo'), productosController.actualizar);
router.delete('/:id', requireModificador('Inventario'), productosController.eliminar);

module.exports = router;