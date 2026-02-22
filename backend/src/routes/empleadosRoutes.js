const express = require('express');
const router = express.Router();
const empleadosController = require('../controllers/empleadosController');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    next(); 
  } catch (error) { 
    return res.status(401).json({ error: 'Token inválido' }); 
  }
};

router.use(verifyToken);

router.get('/', empleadosController.listar);
router.post('/', empleadosController.crear);
router.put('/:id', empleadosController.actualizar);

// ¡Esta línea es la que previene el error "Router.use() requires a middleware function"!
module.exports = router;