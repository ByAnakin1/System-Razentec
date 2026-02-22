import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Plus, Edit, Trash2, X, Tags, AlertTriangle } from 'lucide-react';

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [puedeModificar, setPuedeModificar] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [formData, setFormData] = useState({ id: null, nombre: '' });
  const [catSeleccionada, setCatSeleccionada] = useState(null);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await api.get('/auth/me');
        const u = res.data;
        const cat = u.categorias || [];
        const puede = u.rol === 'Administrador' || cat.includes('Modificador') || cat.includes('Modificador_Categorias');
        setPuedeModificar(puede);
      } catch {
        setPuedeModificar(true);
      }
    };
    loadMe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categorias?estado=activos');
      setCategorias(res.data);
    } catch (error) {
      console.error("Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setFormData({ id: cat.id, nombre: cat.nombre });
    } else {
      setFormData({ id: null, nombre: '' });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/categorias/${formData.id}`, { nombre: formData.nombre });
      } else {
        await api.post('/categorias', { nombre: formData.nombre });
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      alert("Error al guardar la categoría");
    }
  };

  const handleDelete = async () => {
    if (!catSeleccionada) return;
    try {
      await api.delete(`/categorias/${catSeleccionada.id}`);
      setModalEliminar(false);
      fetchData();
    } catch (error) {
      alert("Error al eliminar. Verifique que no haya productos usando esta categoría.");
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2 text-gray-800"><Tags className="text-blue-600" /> Categorías de Productos</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Administra las etiquetas para organizar tu inventario.</p>
        </div>
        {puedeModificar && (
          <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all hover:-translate-y-0.5">
            <Plus size={18} /> Nueva Categoría
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 uppercase font-bold tracking-wider text-[11px]">
            <tr>
              <th className="px-6 py-4">Nombre de Categoría</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <tr><td colSpan="2" className="text-center py-8 font-medium">Cargando...</td></tr> : 
             categorias.length === 0 ? <tr><td colSpan="2" className="text-center py-8 font-medium text-gray-400">No hay categorías registradas.</td></tr> :
             categorias.map((cat) => (
              <tr key={cat.id} className="hover:bg-blue-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-2"><Tags size={16} className="text-gray-400"/> {cat.nombre}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-3">
                    {puedeModificar ? (
                      <>
                        <button onClick={() => handleOpenModal(cat)} className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"><Edit size={16}/></button>
                        <button onClick={() => { setCatSeleccionada(cat); setModalEliminar(true); }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={16}/></button>
                      </>
                    ) : <span className="text-xs text-gray-400 italic">Solo Lectura</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR / EDITAR */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl border border-white/50 animate-fade-in-up">
            <div className="flex justify-between mb-6 border-b border-gray-100 pb-3">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                {formData.id ? <Edit className="text-yellow-500"/> : <Plus className="text-blue-600"/>} 
                {formData.id ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Nombre</label>
                <input placeholder="Ej: Laptops, Herramientas..." value={formData.nombre} onChange={e=>setFormData({...formData, nombre: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" required autoFocus/>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="w-1/3 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="w-2/3 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {modalEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center border border-white/50 animate-fade-in-up">
            <div className="mx-auto w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={32}/></div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">¿Eliminar Categoría?</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">Se eliminará la categoría <strong>"{catSeleccionada?.nombre}"</strong>. Esta acción no borrará los productos que la usan, pero se quedarán sin categoría.</p>
            <div className="flex gap-3">
              <button onClick={() => setModalEliminar(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
export default Categorias;