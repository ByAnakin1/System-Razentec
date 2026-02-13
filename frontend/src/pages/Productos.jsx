import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Plus, Edit, Trash2, X, AlertTriangle, Filter, Tag } from 'lucide-react';

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]); // <--- Lista para el Select
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('activos');
  
  // Estados Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  // Agregamos categoria_id al form
  const [formData, setFormData] = useState({ id: null, nombre: '', codigo: '', precio: '', stock: '', categoria_id: '' });
  const [productToDelete, setProductToDelete] = useState(null);

  // 1. Cargar Datos (Productos y Categorías)
  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get(`/productos?estado=${filtroEstado}`),
        api.get('/categorias?estado=activos') // Solo cargamos categorías activas para el select
      ]);
      setProductos(prodRes.data);
      setCategorias(catRes.data);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filtroEstado]);

  // Modal Abrir
  const openModal = (producto = null) => {
    if (producto) {
      setIsEditing(true);
      setFormData({ 
        id: producto.id, 
        nombre: producto.nombre, 
        codigo: producto.codigo, 
        precio: producto.precio, 
        stock: producto.stock,
        categoria_id: producto.categoria_id || '' // Cargar la categoría actual
      });
    } else {
      setIsEditing(false);
      setFormData({ id: null, nombre: '', codigo: '', precio: '', stock: '', categoria_id: '' });
    }
    setIsModalOpen(true);
  };

  // Guardar
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) await api.put(`/productos/${formData.id}`, formData);
      else await api.post('/productos', formData);
      
      setIsModalOpen(false);
      fetchData(); // Recargar tabla
    } catch (error) {
      alert("Error al guardar");
    }
  };

  // Eliminar
  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/productos/${productToDelete.id}`);
      setDeleteModalOpen(false);
      fetchData();
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  return (
    <Layout>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"/>
            <select 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none cursor-pointer"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="activos">Activos</option>
              <option value="inactivos">Papelera</option>
              <option value="todos">Todos</option>
            </select>
          </div>
          <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus size={20} /> Nuevo
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Categoría</th> {/* NUEVA COLUMNA */}
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Precio</th>
                <th className="px-6 py-3">Stock</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? <tr><td colSpan="7" className="text-center p-8">Cargando...</td></tr> : 
               productos.length === 0 ? <tr><td colSpan="7" className="text-center p-8">Vacío.</td></tr> :
               productos.map((prod) => (
                <tr key={prod.id} className={`hover:bg-gray-50 ${!prod.estado ? 'bg-gray-50 opacity-60' : ''}`}>
                  <td className="px-6 py-4 font-medium text-gray-900">{prod.nombre}</td>
                  
                  {/* CELDA CATEGORÍA */}
                  <td className="px-6 py-4">
                    {prod.categoria_nombre ? (
                      <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs font-semibold w-fit">
                        <Tag size={12}/> {prod.categoria_nombre}
                      </span>
                    ) : <span className="text-gray-400 text-xs">Sin Cat.</span>}
                  </td>

                  <td className="px-6 py-4">{prod.codigo || '-'}</td>
                  <td className="px-6 py-4 text-green-600 font-bold">S/ {parseFloat(prod.precio).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${prod.stock > 5 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                      {prod.stock} un.
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {prod.estado ? <span className="text-green-600 text-xs font-bold">Activo</span> : <span className="text-red-500 text-xs font-bold">Inactivo</span>}
                  </td>
                  <td className="px-6 py-4 flex justify-center gap-3">
                    <button onClick={() => openModal(prod)} className="text-blue-600"><Edit size={18} /></button>
                    {prod.estado && <button onClick={() => {setProductToDelete(prod); setDeleteModalOpen(true);}} className="text-red-500"><Trash2 size={18} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORMULARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* SELECTOR DE CATEGORÍA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select 
                  className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={formData.categoria_id}
                  onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                >
                  <option value="">Seleccione una categoría...</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" required value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={formData.codigo} onChange={(e) => setFormData({...formData, codigo: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                  <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" required value={formData.precio} onChange={(e) => setFormData({...formData, precio: e.target.value})} />
                </div>
              </div>

              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
                  <input type="number" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border text-gray-600 rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{isEditing ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* MODAL ELIMINAR (Igual que antes...) */}
      {deleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
           {/* ... (Contenido del modal borrar igual que el anterior) ... */}
           <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
              <h3 className="text-lg font-bold mb-4">¿Eliminar?</h3>
              <div className="flex gap-3">
                 <button onClick={() => setDeleteModalOpen(false)} className="flex-1 border px-4 py-2 rounded">No</button>
                 <button onClick={handleDelete} className="flex-1 bg-red-600 text-white px-4 py-2 rounded">Sí</button>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default Productos;