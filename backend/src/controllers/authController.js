const UsuarioModel = require('../models/usuarioModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authController = {
  // LOGIN: Validar usuario y devolver token
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // 1. Buscar usuario
      const usuario = await UsuarioModel.findOneByEmail(email);
      if (!usuario) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // 2. Comparar contraseñas
      const esCorrecta = await bcrypt.compare(password, usuario.password_hash);
      if (!esCorrecta) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // 3. Generar Token (Guardamos ID usuario y ID empresa)
      const token = jwt.sign(
        { id: usuario.id, empresa_id: usuario.empresa_id },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({ message: 'Login exitoso', token, usuario: { nombre: usuario.nombre_completo, email: usuario.email } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error en el servidor' });
    }
  },

  // REGISTER: Crear nueva empresa y usuario (Solo para probar al inicio)
  register: async (req, res) => {
    try {

      console.log("📥 Datos recibidos del Postman:", req.body);
      const { nombre_empresa, ruc, nombre_usuario, email, password } = req.body;

      // Encriptar contraseña
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const nuevoUsuario = await UsuarioModel.createEmpresaYUsuario(
        { nombre: nombre_empresa, ruc },
        { nombre: nombre_usuario, email, passwordHash }
      );

      res.status(201).json({ message: 'Empresa registrada con éxito', usuario: nuevoUsuario.email });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al registrar empresa' });
    }
  }
};

module.exports = authController;