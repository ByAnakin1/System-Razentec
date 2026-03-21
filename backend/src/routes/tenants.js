const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const verifyToken = require('../middlewares/verifyToken');

// Middleware: Solo deja pasar si eres tú (SuperAdmin)
const verifySuperAdmin = (req, res, next) => {
  if (req.user.rol !== 'SuperAdmin') {
    return res.status(403).json({ error: 'ZONA RESTRINGIDA: Solo el dueño del SaaS puede hacer esto.' });
  }
  next();
};

// Rutas base (la palabra '/empresas' se la daremos en el server.js)
router.get('/', verifyToken, verifySuperAdmin, tenantController.getEmpresas);
router.post('/', verifyToken, verifySuperAdmin, tenantController.crearEmpresa);
router.put('/:id/estado', verifyToken, verifySuperAdmin, tenantController.toggleEstadoEmpresa);

module.exports = router;