const UsuarioModel = require('../models/usuarioModel');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

// El rol de Administrador es único y ya no se puede asignar a otros
const ROLES_ASIGNABLES = ['Supervisor', 'Empleado'];
const MODULOS = ['Inventario', 'Ventas', 'Compras', 'Clientes', 'Proveedores', 'Usuarios'];
const CATEGORIAS = [...MODULOS, 'Modificador', ...MODULOS.map(m => `Modificador_${m}`)];

const validarCategorias = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.filter(c => CATEGORIAS.includes(c));
};

const usuariosController = {
  // GET /usuarios
  listar: async (req, res) => {
    try {
      const categorias = req.user.categorias || [];
      const tieneAcceso = req.user.rol === 'Administrador' || (Array.isArray(categorias) && categorias.includes('Usuarios'));
      if (!tieneAcceso) {
        return res.status(403).json({ error: 'Se requiere categoría Usuarios para ver el listado' });
      }
      const empresaId = req.user.empresa_id;
      const usuarios = await UsuarioModel.findAllByEmpresa(empresaId);
      res.json(usuarios);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al listar usuarios' });
    }
  },

  // POST /usuarios - Creación con Autorización de Admin y Permisos
  crear: async (req, res) => {
    try {
      const empresaId = req.user.empresa_id;
      const adminId = req.user.id;
      const { nombre_completo, email, password, rol = 'Empleado', categorias = [], admin_password } = req.body;

      if (req.user.rol !== 'Administrador') return res.status(403).json({ error: 'Solo Admin puede crear usuarios' });

      // 1. Autorización: Verificar contraseña del Administrador
      if (!admin_password) return res.status(400).json({ error: 'Debes ingresar tu contraseña de Administrador.' });
      
      const adminData = await UsuarioModel.findById(adminId, true);
      const passwordCorrecta = await bcrypt.compare(admin_password, adminData.password_hash);
      
      if (!passwordCorrecta) {
        return res.status(401).json({ error: 'Contraseña de Administrador incorrecta. Creación denegada.' });
      }

      if (!nombre_completo || !email || !password) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
      }

      const existente = await UsuarioModel.findOneByEmail(email);
      if (existente) return res.status(400).json({ error: 'Email ya en uso' });

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const nuevoUsuario = await UsuarioModel.create(empresaId, {
        nombre_completo,
        email,
        passwordHash,
        rol: ROLES_ASIGNABLES.includes(rol) ? rol : 'Empleado',
        categorias: validarCategorias(categorias)
      });

      res.status(201).json(nuevoUsuario);
    } catch (error) {
      console.error("Error al crear usuario:", error);
      res.status(500).json({ error: 'Error al crear usuario' });
    }
  },

  // PUT /usuarios/:id - Actualización completa
  actualizarPerfil: async (req, res) => {
    try {
      const { id } = req.params; 
      const empresaId = req.user.empresa_id;
      const adminId = req.user.id;
      
      const { nombre_completo, email, rol, categorias, nueva_password, admin_password } = req.body;

      if (req.user.rol !== 'Administrador') return res.status(403).json({ error: 'Solo Admin puede editar' });

      // 1. Verificar contraseña del Administrador
      if (!admin_password) return res.status(400).json({ error: 'Debes ingresar tu contraseña actual para confirmar los cambios' });
      
      const adminData = await UsuarioModel.findById(adminId, true);
      const passwordCorrecta = await bcrypt.compare(admin_password, adminData.password_hash);
      
      if (!passwordCorrecta) {
        return res.status(401).json({ error: 'Tu contraseña de Administrador es incorrecta. Edición denegada.' });
      }

      // 2. Verificar usuario destino
      const usuario = await UsuarioModel.findById(id);
      if (!usuario || usuario.empresa_id !== empresaId) return res.status(404).json({ error: 'Usuario no encontrado' });

      const rolValido = ROLES_ASIGNABLES.includes(rol) ? rol : usuario.rol;
      const categoriasValidas = Array.isArray(categorias) ? validarCategorias(categorias) : [];

      // 3. Actualizar Datos Básicos
      await UsuarioModel.updatePerfil(id, empresaId, {
        nombre_completo, email, rol: rolValido
      });

      // 4. Actualizar Permisos
      await UsuarioModel.updatePermisos(id, empresaId, {
        rol: rolValido, categorias: categoriasValidas
      });

      // 5. Cambiar Contraseña (si se escribió una nueva)
      if (nueva_password && nueva_password.trim() !== '') {
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(nueva_password, salt);
        await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2 AND empresa_id = $3', [newPasswordHash, id, empresaId]);
      }

      res.json({ message: 'Usuario actualizado con éxito' });
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      res.status(500).json({ error: 'Error al guardar los cambios' });
    }
  },

  // DELETE /usuarios/:id
  eliminar: async (req, res) => {
    try {
      const { id } = req.params; 
      const empresaId = req.user.empresa_id;

      if (req.user.rol !== 'Administrador') return res.status(403).json({ error: 'Solo Admin' });
      if (id === req.user.id) return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });

      const eliminado = await UsuarioModel.delete(id, empresaId);
      if (!eliminado) return res.status(404).json({ error: 'Usuario no encontrado' });

      res.json({ message: 'Usuario eliminado' });
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  }
};

module.exports = usuariosController;