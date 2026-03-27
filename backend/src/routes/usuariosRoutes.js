const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const verifyToken = require('../middlewares/authMiddleware'); // ✅ Ahora usamos el central
const requireModificador = require('../middlewares/requireModificador');

router.use(verifyToken);

// 🟢 Lectura general
router.get('/', usuariosController.listar);

// 🔴 Crear credenciales y verificar Admin
router.post('/', requireModificador('Usuarios'), usuariosController.crear);
router.post('/verificar-admin', usuariosController.verificarAdminPassword);

// 🟢 RUTAS DE PERFIL PROPIO (Cualquier empleado logueado puede editar su propia foto/perfil)
router.get('/me', usuariosController.obtenerMiPerfil);
router.put('/me', usuariosController.actualizarMiAvatar);
router.put('/perfil', verifyToken, usuariosController.actualizarMiPropioPerfil);

// 🔴 RUTAS DE ADMINISTRACIÓN (Editar a otras personas)
router.put('/:id/personales', requireModificador('Usuarios'), usuariosController.actualizarDatosPersonales);
router.put('/:id', requireModificador('Usuarios'), usuariosController.actualizarPerfil);
router.delete('/:id', requireModificador('Usuarios'), usuariosController.eliminar);

module.exports = router;