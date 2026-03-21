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

const bcrypt = require('bcryptjs');
const { pool } = require('../config/db'); // Asegúrate de que la ruta a tu BD sea la correcta

// ✨ RUTA TEMPORAL PARA REPARAR LA CONTRASEÑA DEL ADMIN ✨
router.get('/reparar-admin', async (req, res) => {
  try {
    // 1. Encriptamos '123456' usando tu propio servidor
    const salt = await bcrypt.genSalt(10);
    const hashReal = await bcrypt.hash('123456', salt);

    // 2. Actualizamos al SuperAdmin en la base de datos
    await pool.query(
      "UPDATE usuarios SET password_hash = $1 WHERE email = 'admin@razen.tec'",
      [hashReal]
    );

    res.send("✅ ¡Contraseña reparada con éxito! Ya puedes ir al Login e ingresar con la clave: 123456");
  } catch (error) {
    console.error(error);
    res.status(500).send("Hubo un error: " + error.message);
  }
});