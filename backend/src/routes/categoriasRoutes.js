const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categoriasController');
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

router.get('/', categoriasController.listar);
router.post('/', categoriasController.crear);
router.put('/:id', categoriasController.actualizar);
router.delete('/:id', categoriasController.eliminar);

module.exports = router;