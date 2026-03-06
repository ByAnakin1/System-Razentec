const express = require('express');
const router = express.Router();
const sucursalesController = require('../controllers/sucursalesController');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ error: 'Acceso denegado' });
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    next(); 
  } catch (error) { return res.status(401).json({ error: 'Token inválido' }); }
};

router.use(verifyToken);
router.get('/', sucursalesController.listar);
router.post('/', sucursalesController.crear);
router.delete('/:id', sucursalesController.eliminar);

module.exports = router;