const ProductoModel = require('../models/productoModel');

const productosController = {
  // GET: Listar productos con filtro
  listar: async (req, res) => {
    try {
      const empresaId = req.user.empresa_id;
      // Leemos el parametro ?estado=... de la URL (por defecto 'activos')
      const { estado } = req.query; 
      
      const productos = await ProductoModel.findAllByEmpresa(empresaId, estado || 'activos');
      res.json(productos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener productos' });
    }
  },

// POST: Crear
  crear: async (req, res) => {
    try {
      const { nombre, precio, stock, codigo, categoria_id } = req.body; // <--- Agregamos categoria_id
      const empresaId = req.user.empresa_id;
      if (!nombre || !precio) return res.status(400).json({ error: 'Faltan datos' });

      const nuevo = await ProductoModel.create({ 
        empresa_id: empresaId, nombre, precio, stock, codigo, categoria_id 
      });
      res.status(201).json(nuevo);
    } catch (error) {
      console.error(error); // Útil para ver errores en consola
      res.status(500).json({ error: 'Error al crear' });
    }
  },

  // PUT: Actualizar
  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, precio, codigo, categoria_id } = req.body; // <--- Agregamos
      
      const updated = await ProductoModel.update(id, { 
        empresa_id: req.user.empresa_id, nombre, precio, codigo, categoria_id 
      });
      
      if (!updated) return res.status(404).json({ error: 'No encontrado' });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar' });
    }
  },
  
  // DELETE: Eliminar (Lógico)
  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await ProductoModel.delete(id, req.user.empresa_id);
      if (!result) return res.status(404).json({ error: 'No encontrado' });
      res.json({ message: 'Eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar' });
    }
  }
};

module.exports = productosController;