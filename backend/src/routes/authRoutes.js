const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'Acceso denegado: Falta el token' });
  
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next(); 
  } catch (error) { 
    return res.status(401).json({ error: 'Token inválido o expirado' }); 
  }
};

router.post('/login', authController.login);
router.get('/me', verifyToken, authController.me);

// ✨ NUEVA RUTA PARA REGISTRAR LA SALIDA
router.post('/logout', verifyToken, authController.logout);

module.exports = router;