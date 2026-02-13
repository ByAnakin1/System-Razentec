const CategoriaModel = require('../models/categoriaModel');

const categoriasController = {
  listar: async (req, res) => {
    try {
      const { estado } = req.query;
      const lista = await CategoriaModel.findAllByEmpresa(req.user.empresa_id, estado);
      res.json(lista);
    } catch (error) {
      res.status(500).json({ error: 'Error al listar categorías' });
    }
  },

  crear: async (req, res) => {
    try {
      const { nombre } = req.body;
      if (!nombre) return res.status(400).json({ error: 'Nombre obligatorio' });
      
      const nueva = await CategoriaModel.create(req.user.empresa_id, nombre);
      res.status(201).json(nueva);
    } catch (error) {
      res.status(500).json({ error: 'Error al crear categoría' });
    }
  },

  actualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre } = req.body;
      const editada = await CategoriaModel.update(id, req.user.empresa_id, nombre);
      if (!editada) return res.status(404).json({ error: 'No encontrada' });
      res.json(editada);
    } catch (error) {
      res.status(500).json({ error: 'Error al editar' });
    }
  },

  eliminar: async (req, res) => {
    try {
      const { id } = req.params;
      const eliminada = await CategoriaModel.delete(id, req.user.empresa_id);
      if (!eliminada) return res.status(404).json({ error: 'No encontrada' });
      res.json({ message: 'Categoría eliminada' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar' });
    }
  }
};

module.exports = categoriasController;