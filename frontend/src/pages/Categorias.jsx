import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Plus, Edit, Trash2, X, Tags, AlertTriangle, Eye, Store } from 'lucide-react';

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [sucursales, setSucursales] = useState([]); // ✨ LISTA DE SUCURSALES
  const [puedeModificar, setPuedeModificar] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [modalDetalles, setModalDetalles] = useState(false); // ✨ NUEVO MODAL PARA EL OJITO
  
  // ✨ AÑADIMOS SUCURSAL AL ESTADO DEL FORMULARIO
  const [formData, setFormData] = useState({ id: null, nombre: '', sucursal_id: '' });
  const [catSeleccionada, setCatSeleccionada] = useState(null);

  // ✨ ESTADO GLOBAL
  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);
  const esVistaGlobal = sucursalActiva?.id === 'ALL';

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
    // SEMÁFORO
    const currentSucursal = JSON.parse(localStorage.getItem('sucursalActiva'));
    if (!currentSucursal) {
      setCategorias([]);
      setLoading(false);
      return; 
    }

    setLoading(true);
    try {
      const res = await api.get('/categorias?estado=activos');
      setCategorias(res.data);
      try {
        const resSuc = await api.get('/sucursales');
        setSucursales(resSuc.data);
      } catch(e){}
    } catch (error) {
      console.error("Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    const handleSucursalCambiada = () => {
      setSucursalActiva(JSON.parse(localStorage.getItem('sucursalActiva')));
      fetchData(); 
    };
    window.addEventListener('sucursalCambiada', handleSucursalCambiada);
    return () => window.removeEventListener('sucursalCambiada', handleSucursalCambiada);
  }, []);

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setFormData({ id: cat.id, nombre: cat.nombre, sucursal_id: cat.sucursal_id || '' });
    } else {
      // Si es nuevo y no está en global, lo pre-asigna a la sucursal actual
      setFormData({ id: null, nombre: '', sucursal_id: esVistaGlobal ? '' : sucursalActiva?.id || '' });
    }
    setModalOpen(true);
  };

  const handleOpenDetalles = (cat) => {
    setCatSeleccionada(cat);
    setModalDetalles(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/categorias/${formData.id}`, { nombre: formData.nombre, sucursal_id: formData.sucursal_id });
      } else {
        await api.post('/categorias', { nombre: formData.nombre, sucursal_id: formData.sucursal_id });
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2 text-gray-800"><Tags className="text-blue-600" /> Categorías de Productos</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            {esVistaGlobal ? 'Administrando etiquetas globales de la empresa.' : `Administrando etiquetas de: ${sucursalActiva?.nombre || '...'}`}
          </p>
        </div>
        {puedeModificar && sucursalActiva && (
          <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all hover:-translate-y-0.5 whitespace-nowrap w-full md:w-auto justify-center">
            <Plus size={18} /> Nueva Categoría
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 uppercase font-bold tracking-wider text-[11px]">
            <tr>
              <th className="px-6 py-4">Nombre de Categoría</th>
              {esVistaGlobal && <th className="px-6 py-4">Sucursal</th>} {/* ✨ Columna extra si es Global */}
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <tr><td colSpan={esVistaGlobal ? "3" : "2"} className="text-center py-8 font-medium">Cargando...</td></tr> : 
             !sucursalActiva ? <tr><td colSpan={esVistaGlobal ? "3" : "2"} className="text-center py-10 text-gray-400 font-medium bg-red-50">⚠️ No se ha detectado sucursal autorizada.</td></tr> :
             categorias.length === 0 ? <tr><td colSpan={esVistaGlobal ? "3" : "2"} className="text-center py-8 font-medium text-gray-400">No hay categorías en esta vista.</td></tr> :
             categorias.map((cat) => (
              <tr key={cat.id} className="hover:bg-blue-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-2"><Tags size={16} className="text-gray-400"/> {cat.nombre}</td>
                
                {/* ✨ MOSTRAR ETIQUETA DE SUCURSAL SI ESTAMOS EN MODO GLOBAL */}
                {esVistaGlobal && (
                  <td className="px-6 py-4">
                     <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded">
                       {cat.sucursal_nombre || 'No Asignada (Global)'}
                     </span>
                  </td>
                )}

                <td className="px-6 py-4">
                  <div className="flex justify-center gap-3">
                    {/* ✨ OJITO PARA VER DETALLES */}
                    <button onClick={() => handleOpenDetalles(cat)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Ver Detalles"><Eye size={16}/></button>
                    
                    {puedeModificar ? (
                      <>
                        <button onClick={() => handleOpenModal(cat)} className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"><Edit size={16}/></button>
                        <button onClick={() => { setCatSeleccionada(cat); setModalEliminar(true); }} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={16}/></button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✨ NUEVO: MODAL DE DETALLES CON EL OJITO */}
      {modalDetalles && catSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl border border-white/50 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2"><Tags className="text-blue-600"/> Detalles</h2>
              <button onClick={() => setModalDetalles(false)} className="text-gray-400 hover:text-gray-800 bg-gray-100 p-1.5 rounded-full"><X size={20}/></button>
            </div>
            <div className="space-y-4">
               <div>
                 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Nombre de la Categoría</label>
                 <p className="text-lg font-black text-gray-800">{catSeleccionada.nombre}</p>
               </div>
               <div>
                 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Pertenece a:</label>
                 <div className="mt-1 inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-100 font-bold text-sm">
                   <Store size={14}/> {catSeleccionada.sucursal_nombre || 'Categoría Global'}
                 </div>
               </div>
            </div>
            <button onClick={() => setModalDetalles(false)} className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-xl font-bold transition-colors">Cerrar</button>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all p-4">
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
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Nombre *</label>
                <input placeholder="Ej: Laptops, Herramientas..." value={formData.nombre} onChange={e=>setFormData({...formData, nombre: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800" required autoFocus/>
              </div>

              {/* ✨ SELECTOR DE SUCURSAL PARA CREAR/EDITAR (Solo útil si eres Admin en vista Global) */}
              {esVistaGlobal && (
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Asignar a Sucursal</label>
                  <select className="w-full border border-gray-200 p-3 rounded-xl outline-none font-bold text-gray-700 bg-white focus:ring-2 focus:ring-blue-500" value={formData.sucursal_id} onChange={e => setFormData({...formData, sucursal_id: e.target.value})}>
                    <option value="">-- Sin asignar (Global) --</option>
                    {sucursales.map(suc => <option key={suc.id} value={suc.id}>{suc.nombre}</option>)}
                  </select>
                </div>
              )}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center border border-white/50 animate-fade-in-up">
            <div className="mx-auto w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={32}/></div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">¿Eliminar Categoría?</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">Se eliminará la categoría <strong>"{catSeleccionada?.nombre}"</strong> de la base de datos. Los productos que la usan se quedarán sin categoría.</p>
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