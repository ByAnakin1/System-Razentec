const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const jwt = require('jsonwebtoken');

// ✨ MIDDLEWARE 1: Verificar Token (Integrado aquí para evitar el error de carpetas)
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

// ✨ MIDDLEWARE 2: Solo deja pasar si eres tú (SuperAdmin)
const verifySuperAdmin = (req, res, next) => {
  if (req.user.rol !== 'SuperAdmin') {
    return res.status(403).json({ error: 'ZONA RESTRINGIDA: Solo el dueño del SaaS puede hacer esto.' });
  }
  next();
};

// Rutas de administración SaaS
router.get('/', verifyToken, verifySuperAdmin, tenantController.getEmpresas);
router.post('/', verifyToken, verifySuperAdmin, tenantController.crearEmpresa);
router.put('/:id/estado', verifyToken, verifySuperAdmin, tenantController.toggleEstadoEmpresa);

module.exports = router;