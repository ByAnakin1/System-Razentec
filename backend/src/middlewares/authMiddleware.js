const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // 1. Verificamos si envió el token (Bearer token...)
  if (!authHeader) {
    return res.status(403).json({ error: 'Acceso denegado: Falta el token' });
  }

  const token = authHeader.split(' ')[1]; // Quitamos la palabra "Bearer"

  if (!token) {
    return res.status(403).json({ error: 'Acceso denegado: Token malformado' });
  }

  try {
    // 2. Validamos el token con la firma secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. ¡IMPORTANTE! Guardamos los datos del usuario en la petición
    req.user = decoded; 
    
    next(); // Dejamos pasar a la siguiente función
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = verifyToken;