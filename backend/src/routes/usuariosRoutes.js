const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const jwt = require('jsonwebtoken');

// 1. Integración directa del middleware para evitar errores de rutas no encontradas
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(403).json({ error: 'Acceso denegado: Falta el token' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: 'Acceso denegado: Token malformado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next(); 
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// 2. Proteger todas las rutas de usuarios
router.use(verifyToken);

// 3. Definición de endpoints unificados
router.get('/', usuariosController.listar);
router.post('/', usuariosController.crear);
router.put('/:id', usuariosController.actualizarPerfil); // Este maneja perfil, permisos y contraseña
router.delete('/:id', usuariosController.eliminar);

module.exports = router;