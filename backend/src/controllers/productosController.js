const ProductoModel = require('../models/productoModel');

const productosController = {
  // GET: Listar productos
  listar: async (req, res) => {
    try {
      const empresaId = req.user.empresa_id; // ¡Magia! Viene del token
      const productos = await ProductoModel.findAllByEmpresa(empresaId);
      res.json(productos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener productos' });
    }
  },

  // POST: Crear producto
  crear: async (req, res) => {
    try {
      const { nombre, precio, stock, codigo } = req.body;
      const empresaId = req.user.empresa_id;

      if (!nombre || !precio) {
        return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
      }

      const nuevoProducto = await ProductoModel.create({
        empresa_id: empresaId,
        nombre,
        precio,
        stock: stock || 0,
        codigo: codigo || null
      });

      res.status(201).json(nuevoProducto);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear producto' });
    }
  }
};

module.exports = productosController;