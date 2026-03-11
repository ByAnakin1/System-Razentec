import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Users, Search, Plus, Edit, Trash2, X, AlertTriangle, Eye, Store } from 'lucide-react';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [sucursales, setSucursales] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDelete, setModalDelete] = useState(null);
  const [modalDetalles, setModalDetalles] = useState(null); 
  
  const [formData, setFormData] = useState({ id: null, nombre_completo: '', documento_identidad: '', email: '', telefono: '', direccion: '', sucursal_id: '' });
  const [errores, setErrores] = useState({});

  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);
  const esVistaGlobal = sucursalActiva?.id === 'ALL';

  // ✨ LECTURA SÍNCRONA Y SEGURA DEL ROL
  const esAdmin = JSON.parse(localStorage.getItem('usuario') || '{}').rol === 'Administrador';

  const fetchClientes = async () => {
    const currentSucursal = JSON.parse(localStorage.getItem('sucursalActiva'));
    if (!currentSucursal) {
      setClientes([]); setLoading(false); return;
    }

    setLoading(true);
    try {
      const res = await api.get('/clientes');
      setClientes(res.data);
      try {
        const sucRes = await api.get('/sucursales');
        setSucursales(sucRes.data);
      } catch(e){}
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchClientes(); 
    const handleSucursalCambiada = () => {
      setSucursalActiva(JSON.parse(localStorage.getItem('sucursalActiva')));
      fetchClientes(); 
    };
    window.addEventListener('sucursalCambiada', handleSucursalCambiada);
    return () => window.removeEventListener('sucursalCambiada', handleSucursalCambiada);
  }, []);

  const validarFormulario = () => {
    let nuevosErrores = {};
    if (!formData.nombre_completo.trim()) nuevosErrores.nombre_completo = "El nombre es obligatorio.";
    if (formData.documento_identidad && formData.documento_identidad.length !== 8) nuevosErrores.documento_identidad = "El DNI debe tener exactamente 8 dígitos.";
    if (formData.telefono && formData.telefono.length !== 9) nuevosErrores.telefono = "El número de teléfono debe tener exactamente 9 dígitos.";
    
    // ✨ VALIDACIÓN EXTRA: Si está en global, obliga a elegir sucursal
    if (esVistaGlobal && !formData.sucursal_id) nuevosErrores.sucursal_id = "Debes asignar una sucursal.";

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    try {
      if (formData.id) await api.put(`/clientes/${formData.id}`, formData);
      else await api.post('/clientes', formData);
      setModalOpen(false);
      fetchClientes();
    } catch (error) { 
      alert(error.response?.data?.error || "Error al guardar el cliente. Revisa la consola."); 
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/clientes/${modalDelete.id}`);
      setModalDelete(null); fetchClientes();
    } catch (error) { alert(error.response?.data?.error || "Error al eliminar"); setModalDelete(null); }
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) || 
    (c.documento_identidad || '').includes(busqueda)
  );

  const openModal = (cliente = null) => {
    if (cliente) {
      setFormData({...cliente, sucursal_id: cliente.sucursal_id || ''});
    } else {
      setFormData({ id: null, nombre_completo: '', documento_identidad: '', email: '', telefono: '', direccion: '', sucursal_id: esVistaGlobal ? '' : sucursalActiva?.id || '' });
    }
    setErrores({}); setModalOpen(true);
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2 text-gray-800"><Users className="text-blue-600"/> Cartera de Clientes</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {esVistaGlobal ? 'Administrando cartera global (Todos los locales)' : `Viendo clientes de: ${sucursalActiva?.nombre || '...'}`}
          </p>
        </div>
        
        {sucursalActiva && (
          <div className="flex w-full md:w-auto gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
              <input type="text" placeholder="Buscar por nombre o DNI..." className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <button onClick={() => openModal()} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all flex-shrink-0">
              <Plus size={18}/> Nuevo Cliente
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4 border-b border-gray-100">Nombre / Razón Social</th>
              <th className="px-6 py-4 border-b border-gray-100">Documento (DNI)</th>
              {esAdmin && <th className="px-6 py-4 border-b border-gray-100">Ubicación</th>}
              <th className="px-6 py-4 border-b border-gray-100">Contacto</th>
              <th className="px-6 py-4 border-b border-gray-100 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <tr><td colSpan={esAdmin?"5":"4"} className="text-center py-10 text-gray-500 font-medium">Cargando...</td></tr> : 
             !sucursalActiva ? <tr><td colSpan={esAdmin?"5":"4"} className="text-center py-10 text-red-500 font-medium bg-red-50">⚠️ No se ha detectado sucursal.</td></tr> :
             clientesFiltrados.length === 0 ? <tr><td colSpan={esAdmin?"5":"4"} className="text-center py-10 text-gray-400 italic">No hay clientes registrados en esta sede.</td></tr> :
             clientesFiltrados.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{c.nombre_completo}</td>
                <td className="px-6 py-4 text-slate-600 font-medium">{c.documento_identidad || '---'}</td>
                
                {esAdmin && (
                  <td className="px-6 py-4">
                     <span className={`text-[10px] font-bold px-2 py-1 rounded ${c.sucursal_id ? 'text-blue-700 bg-blue-50 border border-blue-100' : 'text-red-700 bg-red-50 border border-red-100'}`}>
                       {c.sucursal_id ? c.sucursal_nombre : '⚠️ Sin Sucursal (Editar)'}
                     </span>
                  </td>
                )}

                <td className="px-6 py-4">
                  <p className="text-xs text-slate-600 mb-0.5">{c.telefono || 'Sin teléfono'}</p>
                  <p className="text-[10px] text-slate-400">{c.email || 'Sin correo'}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => setModalDetalles(c)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors mr-2"><Eye size={16}/></button>
                  <button onClick={() => openModal(c)} className="p-2 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors mr-2"><Edit size={16}/></button>
                  <button onClick={() => setModalDelete(c)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalDetalles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl border border-white/50 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2"><Users className="text-blue-600"/> Ficha del Cliente</h2>
              <button onClick={() => setModalDetalles(null)} className="text-gray-400 hover:text-gray-800 bg-gray-100 p-1.5 rounded-full"><X size={20}/></button>
            </div>
            <div className="space-y-4">
               <div><label className="text-[10px] font-bold text-gray-500 uppercase block">Nombre</label><p className="text-lg font-black text-gray-800">{modalDetalles.nombre_completo}</p></div>
               <div><label className="text-[10px] font-bold text-gray-500 uppercase block">DNI</label><p className="font-medium text-gray-700">{modalDetalles.documento_identidad || 'N/A'}</p></div>
               <div><label className="text-[10px] font-bold text-gray-500 uppercase block">Pertenece a:</label>
                 <div className="mt-1 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 font-bold text-sm">
                   <Store size={14}/> {modalDetalles.sucursal_id ? modalDetalles.sucursal_nombre : '⚠️ Requiere Asignación'}
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/50 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
              <h2 className="text-xl font-extrabold text-gray-800">{formData.id ? 'Editar Cliente' : 'Registrar Cliente'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-100 p-2 rounded-full"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Nombre Completo *</label>
                <input required className={`w-full border p-3 rounded-xl focus:ring-2 outline-none font-medium mt-1 ${errores.nombre_completo ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'}`} value={formData.nombre_completo} onChange={e => { setFormData({...formData, nombre_completo: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')}); if (errores.nombre_completo) setErrores({...errores, nombre_completo: null}); }} />
                {errores.nombre_completo && <p className="text-[10px] text-red-500 mt-1 font-bold">{errores.nombre_completo}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">DNI</label>
                  <input className={`w-full border p-3 rounded-xl focus:ring-2 outline-none font-medium mt-1 tracking-wider ${errores.documento_identidad ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'}`} value={formData.documento_identidad} onChange={e => { setFormData({...formData, documento_identidad: e.target.value.replace(/\D/g, '').slice(0, 8)}); if (errores.documento_identidad) setErrores({...errores, documento_identidad: null}); }} />
                  {errores.documento_identidad && <p className="text-[10px] text-red-500 mt-1 font-bold leading-tight">{errores.documento_identidad}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Teléfono</label>
                  <input className={`w-full border p-3 rounded-xl focus:ring-2 outline-none font-medium mt-1 tracking-wider ${errores.telefono ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'}`} value={formData.telefono} onChange={e => { setFormData({...formData, telefono: e.target.value.replace(/\D/g, '').slice(0, 9)}); if (errores.telefono) setErrores({...errores, telefono: null}); }} />
                  {errores.telefono && <p className="text-[10px] text-red-500 mt-1 font-bold leading-tight">{errores.telefono}</p>}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Dirección</label>
                <input className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium mt-1" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
              </div>

              {/* ✨ SELECTOR SIEMPRE VISIBLE PARA ADMIN */}
              {esAdmin && (
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Asignar a Sucursal *</label>
                  <select className={`w-full border p-3 rounded-xl outline-none font-bold text-gray-700 bg-white focus:ring-2 ${errores.sucursal_id ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'}`} value={formData.sucursal_id} onChange={e => {setFormData({...formData, sucursal_id: e.target.value}); if(errores.sucursal_id) setErrores({...errores, sucursal_id: null})}}>
                    <option value="">-- Selecciona una Sucursal --</option>
                    {sucursales.map(suc => <option key={suc.id} value={suc.id}>{suc.nombre}</option>)}
                  </select>
                  {errores.sucursal_id && <p className="text-[10px] text-red-500 mt-1 font-bold leading-tight">{errores.sucursal_id}</p>}
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors mt-6">Guardar Cliente</button>
            </form>
          </div>
        </div>
      )}

      {modalDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-fade-in-up">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 border-4 border-red-100 mb-6 text-red-500"><AlertTriangle size={32}/></div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">¿Eliminar Cliente?</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Borrarás a <b>{modalDelete.nombre_completo}</b>. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setModalDelete(null)} className="flex-1 border-2 border-gray-200 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/30">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
export default Clientes;