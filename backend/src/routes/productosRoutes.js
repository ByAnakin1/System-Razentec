const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const verifyToken = require('../middlewares/authMiddleware');
const requireModificador = require('../middlewares/requireModificador');
const { audit } = require('../middlewares/auditMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✨ CORRECCIÓN 1: Asegurarnos de que la ruta apunte a la carpeta uploads en la raíz del backend
const uploadDir = path.join(__dirname, '../../uploads/');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de Multer: Dónde y cómo guardar los archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir) 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.use(verifyToken);

router.get('/', audit('GET', '/productos', 'productos'), productosController.listar);

// ✨ CORRECCIÓN 2: Agregamos "upload.single('imagen_archivo')" ANTES de tus controladores
router.post('/', requireModificador('Inventario'), upload.single('imagen_archivo'), audit('POST', '/productos', 'productos'), productosController.crear);
router.post('/bulk', requireModificador('Inventario'), audit('POST', '/productos/bulk', 'productos'), productosController.crearGranel);
router.put('/:id', requireModificador('Inventario'), upload.single('imagen_archivo'), audit('PUT', '/productos', 'productos'), productosController.actualizar);

router.delete('/:id', requireModificador('Inventario'), audit('DELETE', '/productos', 'productos'), productosController.eliminar);

module.exports = router;