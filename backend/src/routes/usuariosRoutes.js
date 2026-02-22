const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'Acceso denegado' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

router.use(verifyToken);

router.get('/', usuariosController.listar);
router.post('/', usuariosController.crear);
router.post('/verificar-admin', usuariosController.verificarAdminPassword);

// RUTAS DE PERFIL PROPIO (El empleado actual)
router.get('/me', usuariosController.obtenerMiPerfil);
router.put('/me', usuariosController.actualizarMiAvatar);

// RUTAS DE ADMINISTRACIÓN (Editar a otros)
router.put('/:id/personales', usuariosController.actualizarDatosPersonales);
router.put('/:id', usuariosController.actualizarPerfil);
router.delete('/:id', usuariosController.eliminar);

module.exports = router;