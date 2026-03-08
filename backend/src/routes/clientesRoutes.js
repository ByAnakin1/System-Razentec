const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');
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
router.get('/', clientesController.listar);
router.post('/', clientesController.crear);
router.put('/:id', clientesController.actualizar);
router.delete('/:id', clientesController.eliminar);

module.exports = router;