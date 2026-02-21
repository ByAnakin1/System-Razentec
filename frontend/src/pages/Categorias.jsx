import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Plus, Edit, Trash2, X, AlertTriangle, Filter, Tag } from 'lucide-react';

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('activos');
  const [puedeModificar, setPuedeModificar] = useState(true);

  // Estados Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, nombre: '' });
  const [catToDelete, setCatToDelete] = useState(null);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await api.get('/auth/me');
        const u = res.data;
        const cat = u.categorias || [];
        setPuedeModificar(u.rol === 'Administrador' || (Array.isArray(cat) && cat.includes('Modificador')));
      } catch {
        setPuedeModificar(true);
      }
    };
    loadMe();
  }, []);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/categorias?estado=${filtroEstado}`);
      setCategorias(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategorias(); }, [filtroEstado]);

  // Guardar
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) await api.put(`/categorias/${formData.id}`, formData);
      else await api.post('/categorias', formData);
      setIsModalOpen(false);
      fetchCategorias();
    } catch (error) {
      alert("Error al guardar");
    }
  };

  // Eliminar
  const handleDelete = async () => {
    if (!catToDelete) return;
    try {
      await api.delete(`/categorias/${catToDelete.id}`);
      setDeleteModalOpen(false);
      fetchCategorias();
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  const openModal = (cat = null) => {
    if (cat) {
      setIsEditing(true);
      setFormData({ id: cat.id, nombre: cat.nombre });
    } else {
      setIsEditing(false);
      setFormData({ id: null, nombre: '' });
    }
    setIsModalOpen(true);
  };

  return (
    <Layout>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Tag size={24} className="text-blue-600"/> Categorías
        </h1>
        
        <div className="flex gap-3">
          <div className="relative">
            <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"/>
            <select 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 outline-none cursor-pointer"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="activos">Activas</option>
              <option value="inactivos">Papelera</option>
              <option value="todos">Todas</option>
            </select>
          </div>
          {puedeModificar && (
            <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <Plus size={20} /> Nueva
            </button>
          )}
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-4xl mx-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Nombre de Categoría</th>
              <th className="px-6 py-4 text-center">Estado</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? <tr><td colSpan="3" className="p-8 text-center">Cargando...</td></tr> : 
             categorias.length === 0 ? <tr><td colSpan="3" className="p-8 text-center">No hay categorías.</td></tr> :
             categorias.map((cat) => (
              <tr key={cat.id} className={`hover:bg-gray-50 ${!cat.estado ? 'bg-gray-50 opacity-60' : ''}`}>
                <td className="px-6 py-4 font-medium text-gray-900 text-base">{cat.nombre}</td>
                <td className="px-6 py-4 text-center">
                  {cat.estado ? 
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Activa</span> : 
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Inactiva</span>
                  }
                </td>
                <td className="px-6 py-4 flex justify-center gap-3">
                  {puedeModificar ? (
                    <>
                      <button onClick={() => openModal(cat)} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                      {cat.estado && (
                        <button onClick={() => {setCatToDelete(cat); setDeleteModalOpen(true);}} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400 text-xs">Solo lectura</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR/EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{isEditing ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input autoFocus type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" required value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border text-gray-600 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{isEditing ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BORRAR */}
      {deleteModalOpen && catToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600"><AlertTriangle size={24} /></div>
            <h3 className="text-lg font-bold text-gray-900">¿Eliminar Categoría?</h3>
            <p className="text-sm text-gray-500 mb-6">Se desactivará "{catToDelete.nombre}".</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Categorias;