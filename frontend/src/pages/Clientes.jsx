import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
// ✨ AQUÍ ESTÁ EL FIX: Agregué CheckCircle a los importes ✨
import { Users, Search, Plus, Edit, Trash2, X, AlertTriangle, Eye, Store, UserCircle, Phone, MapPin, CreditCard, CheckCircle } from 'lucide-react';

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
    if (formData.documento_identidad && formData.documento_identidad.length !== 8) nuevosErrores.documento_identidad = "El DNI debe tener 8 dígitos.";
    if (formData.telefono && formData.telefono.length !== 9) nuevosErrores.telefono = "El celular debe tener 9 dígitos.";
    
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
      alert(error.response?.data?.error || "Error al guardar el cliente."); 
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
    <Layout title="Clientes" moduleIcon={<Users/>}>
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 md:mb-6 gap-3">
        <p className="text-[11px] md:text-sm text-gray-500 font-bold px-1 uppercase tracking-wider">
           {esVistaGlobal ? 'Cartera Global de Clientes' : `Cartera Local: ${sucursalActiva?.nombre || 'Ninguna'}`}
        </p>

        {sucursalActiva && (
          <div className="flex w-full sm:w-auto gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
              <input 
                type="text" 
                placeholder="Buscar por nombre o DNI..." 
                className="w-full bg-white border border-gray-200 pl-9 pr-3 py-2.5 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-bold text-gray-800 transition-all shadow-sm" 
                value={busqueda} 
                onChange={(e) => setBusqueda(e.target.value)} 
              />
            </div>
            <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md hover:bg-blue-700 transition-all flex-shrink-0 active:scale-95 text-xs md:text-sm">
              <Plus size={16}/> <span className="hidden md:inline">Nuevo Cliente</span><span className="md:hidden">Nuevo</span>
            </button>
          </div>
        )}
      </div>

      {/* VISTA MÓVIL: TARJETAS DE CONTACTO */}
      <div className="md:hidden flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
             <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
             <p className="text-xs font-medium">Cargando clientes...</p>
          </div>
        ) : !sucursalActiva ? (
          <div className="text-center py-10 text-xs text-red-500 bg-red-50 rounded-2xl border border-red-100">
            ⚠️ Sin sucursal asignada.
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center">
            <UserCircle size={48} className="text-gray-200 mb-3" strokeWidth={1.5}/>
            <p className="text-sm font-bold text-gray-600">No se encontraron clientes</p>
          </div>
        ) : (
          clientesFiltrados.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm relative group overflow-hidden">
               <div className="flex justify-between items-start mb-3 border-b border-dashed border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <span className="font-black text-lg uppercase">{c.nombre_completo.charAt(0)}</span>
                     </div>
                     <div>
                       <p className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{c.nombre_completo}</p>
                       <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mt-0.5"><CreditCard size={10}/> DNI: {c.documento_identidad || 'S/C'}</p>
                     </div>
                  </div>
               </div>

               <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <Phone size={12} className="text-emerald-500 shrink-0"/>
                    <span className="text-[10px] font-bold text-gray-600 truncate">{c.telefono || 'Sin celular'}</span>
                  </div>
                  {esAdmin && (
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Store size={12} className={c.sucursal_id ? "text-purple-400 shrink-0" : "text-red-400 shrink-0"}/>
                      <span className={`text-[9px] font-bold truncate px-1.5 py-0.5 rounded ${c.sucursal_id ? "text-purple-700 bg-purple-100/50" : "text-red-600 bg-red-100/50"}`}>
                        {c.sucursal_id ? c.sucursal_nombre : 'Sin asignar'}
                      </span>
                    </div>
                  )}
               </div>

               <div className="flex gap-2">
                 <button onClick={() => setModalDetalles(c)} className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-100 flex items-center justify-center transition-colors">
                   <Eye size={16}/>
                 </button>
                 <button onClick={() => openModal(c)} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs hover:bg-blue-100 flex items-center justify-center transition-colors">
                   <Edit size={16}/>
                 </button>
                 <button onClick={() => setModalDelete(c)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors">
                   <Trash2 size={16}/>
                 </button>
               </div>
            </div>
          ))
        )}
      </div>

      {/* VISTA PC: TABLA DE CLIENTES */}
      <div className="hidden md:block bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold tracking-wider text-[10px] border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Documento (DNI)</th>
              <th className="px-6 py-4">Contacto</th>
              {esAdmin && <th className="px-6 py-4">Sede Asignada</th>}
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={esAdmin?"5":"4"} className="text-center py-12 text-gray-400 font-medium">Cargando directorio...</td></tr> : 
             !sucursalActiva ? <tr><td colSpan={esAdmin?"5":"4"} className="text-center py-12 text-red-500 font-medium">⚠️ Sin sucursal asignada.</td></tr> :
             clientesFiltrados.length === 0 ? <tr><td colSpan={esAdmin?"5":"4"} className="text-center py-12 italic text-gray-400">No hay clientes registrados.</td></tr> :
             clientesFiltrados.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                        {c.nombre_completo.charAt(0)}
                     </div>
                     <span className="font-bold text-slate-800">{c.nombre_completo}</span>
                   </div>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-gray-500 tracking-wider">{c.documento_identidad || '---'}</td>
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-slate-700 mb-0.5 flex items-center gap-1.5"><Phone size={12} className="text-emerald-500"/> {c.telefono || '---'}</p>
                  {c.email && <p className="text-[10px] font-bold text-slate-400 truncate w-40">{c.email}</p>}
                </td>
                
                {esAdmin && (
                  <td className="px-6 py-4">
                     <span className={`text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 w-max uppercase tracking-wider ${c.sucursal_id ? 'text-purple-700 bg-purple-50 border border-purple-100' : 'text-red-600 bg-red-50 border border-red-100'}`}>
                       <Store size={10}/> {c.sucursal_id ? c.sucursal_nombre : 'Sin Asignar'}
                     </span>
                  </td>
                )}

                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setModalDetalles(c)} className="p-1.5 text-slate-500 bg-slate-50 hover:bg-slate-200 rounded-lg transition-colors" title="Detalles"><Eye size={14}/></button>
                    <button onClick={() => openModal(c)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Editar"><Edit size={14}/></button>
                    <button onClick={() => setModalDelete(c)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Eliminar"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DETALLES DEL CLIENTE */}
      {modalDetalles && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-white p-6 sm:p-8 rounded-t-3xl sm:rounded-[2rem] w-full sm:max-w-sm shadow-2xl animate-fade-in-up pb-8">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>
            
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
              <h2 className="text-lg md:text-xl font-extrabold text-gray-800 flex items-center gap-2"><UserCircle className="text-blue-600"/> Ficha del Cliente</h2>
              <button onClick={() => setModalDetalles(null)} className="text-gray-400 hover:text-gray-800 bg-gray-50 p-1.5 rounded-full"><X size={18}/></button>
            </div>
            
            <div className="space-y-4">
               <div>
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Nombre / Razón Social</label>
                 <p className="text-base md:text-lg font-black text-gray-800 leading-tight">{modalDetalles.nombre_completo}</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Documento (DNI)</label>
                   <p className="text-sm font-bold text-gray-700">{modalDetalles.documento_identidad || 'No Registrado'}</p>
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Teléfono</label>
                   <p className="text-sm font-bold text-gray-700">{modalDetalles.telefono || 'No Registrado'}</p>
                 </div>
               </div>

               <div>
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Dirección / Referencia</label>
                 <p className="text-sm font-bold text-gray-700">{modalDetalles.direccion || 'No Registrada'}</p>
               </div>

               <div>
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Afiliación a Sede</label>
                 <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs ${modalDetalles.sucursal_id ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                   <Store size={14}/> {modalDetalles.sucursal_id ? modalDetalles.sucursal_nombre : '⚠️ Requiere Asignación'}
                 </div>
               </div>
            </div>
            
            <button onClick={() => setModalDetalles(null)} className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3.5 rounded-xl font-bold transition-colors text-sm">Cerrar Ficha</button>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR CLIENTE */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-white p-5 sm:p-8 rounded-t-3xl sm:rounded-[2rem] w-full sm:max-w-md shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
            
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>
            
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3 shrink-0">
              <h2 className="text-lg md:text-xl font-extrabold text-gray-800 flex items-center gap-2">
                {formData.id ? <Edit className="text-blue-600" size={20}/> : <Plus className="text-blue-600" size={20}/>}
                {formData.id ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-50 p-1.5 rounded-full"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto custom-scrollbar pb-4 px-1">
              <div>
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block mb-1">Nombre Completo *</label>
                <input required className={`w-full bg-slate-50 border p-3 rounded-xl focus:bg-white outline-none font-bold text-gray-800 text-sm transition-colors ${errores.nombre_completo ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`} value={formData.nombre_completo} onChange={e => { setFormData({...formData, nombre_completo: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')}); if (errores.nombre_completo) setErrores({...errores, nombre_completo: null}); }} placeholder="Ej: Juan Pérez" autoFocus/>
                {errores.nombre_completo && <p className="text-[10px] text-red-500 mt-1 font-bold">{errores.nombre_completo}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block mb-1">DNI</label>
                  <input className={`w-full bg-slate-50 border p-3 rounded-xl focus:bg-white outline-none font-bold text-gray-800 tracking-wider text-sm transition-colors [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errores.documento_identidad ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`} value={formData.documento_identidad} onChange={e => { setFormData({...formData, documento_identidad: e.target.value.replace(/\D/g, '').slice(0, 8)}); if (errores.documento_identidad) setErrores({...errores, documento_identidad: null}); }} placeholder="8 dígitos" type="number" />
                  {errores.documento_identidad && <p className="text-[9px] text-red-500 mt-1 font-bold leading-tight">{errores.documento_identidad}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block mb-1">Celular</label>
                  <input className={`w-full bg-slate-50 border p-3 rounded-xl focus:bg-white outline-none font-bold text-gray-800 tracking-wider text-sm transition-colors [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errores.telefono ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`} value={formData.telefono} onChange={e => { setFormData({...formData, telefono: e.target.value.replace(/\D/g, '').slice(0, 9)}); if (errores.telefono) setErrores({...errores, telefono: null}); }} placeholder="9 dígitos" type="number" />
                  {errores.telefono && <p className="text-[9px] text-red-500 mt-1 font-bold leading-tight">{errores.telefono}</p>}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block mb-1">Dirección (Opcional)</label>
                <input className="w-full bg-slate-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none font-bold text-gray-700 text-sm transition-colors" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} placeholder="Ej: Av. Central 123"/>
              </div>

              {esAdmin && (
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block mb-1 mt-2">Afiliar a Sede *</label>
                  <select className={`w-full bg-slate-50 border p-3 rounded-xl focus:bg-white outline-none font-bold text-gray-700 text-sm transition-colors ${errores.sucursal_id ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`} value={formData.sucursal_id} onChange={e => {setFormData({...formData, sucursal_id: e.target.value}); if(errores.sucursal_id) setErrores({...errores, sucursal_id: null})}}>
                    <option value="">-- Selecciona una Sede --</option>
                    {sucursales.map(suc => <option key={suc.id} value={suc.id}>{suc.nombre}</option>)}
                  </select>
                  {errores.sucursal_id && <p className="text-[9px] text-red-500 mt-1 font-bold leading-tight">{errores.sucursal_id}</p>}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors text-sm">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all text-sm flex items-center justify-center gap-1.5"><CheckCircle size={16}/> Guardar</button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {modalDelete && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-[2rem] p-6 md:p-8 w-full sm:max-w-sm text-center shadow-2xl animate-fade-in-up pb-8">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 border-4 border-red-100 mb-4 text-red-500 shadow-inner">
              <AlertTriangle size={32}/>
            </div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">¿Eliminar Cliente?</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed">
              Borrarás a <strong className="text-gray-800">"{modalDelete.nombre_completo}"</strong> de la base de datos. Esta acción es irreversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalDelete(null)} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors text-sm">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 text-sm">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
export default Clientes;