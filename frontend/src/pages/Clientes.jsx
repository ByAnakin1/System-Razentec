import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Users, Search, Plus, Edit, Trash2, X, AlertTriangle, Eye, Store, UserCircle, Phone, MapPin, CreditCard, CheckCircle } from 'lucide-react';

const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

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
        <p className="text-[11px] md:text-sm text-gray-500 dark:text-blue-300/70 font-extrabold px-1 uppercase tracking-widest transition-colors">
           {esVistaGlobal ? 'Cartera Global de Clientes' : `Cartera Local: ${sucursalActiva?.nombre || 'Ninguna'}`}
        </p>

        {sucursalActiva && (
          <div className="flex w-full sm:w-auto gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-blue-400/70" size={16}/>
              <input 
                type="text" 
                placeholder="Buscar por nombre o DNI..." 
                className="w-full bg-white/80 dark:bg-blue-950/50 backdrop-blur-md border border-gray-200/80 dark:border-white/10 pl-9 pr-3 py-2.5 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 font-bold text-gray-800 dark:text-white transition-all shadow-sm" 
                value={busqueda} 
                onChange={(e) => setBusqueda(e.target.value)} 
              />
            </div>
            <button onClick={() => openModal()} className="bg-blue-600/90 dark:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-black flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 border border-transparent dark:border-white/10 hover:bg-blue-700 transition-all flex-shrink-0 active:scale-95 text-xs md:text-sm backdrop-blur-md">
              <Plus size={16}/> <span className="hidden md:inline">Nuevo Cliente</span><span className="md:hidden">Nuevo</span>
            </button>
          </div>
        )}
      </div>

      {/* ✨ VISTA TÁCTIL (MÓVIL Y TABLET - LIQUID GLASS) ✨ */}
      <div className="lg:hidden flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-blue-300/70 transition-colors">
             <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
             <p className="text-[10px] font-extrabold uppercase tracking-widest">Cargando clientes...</p>
          </div>
        ) : !sucursalActiva ? (
          <div className="text-center py-10 text-xs font-bold text-red-500 bg-red-50/80 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-500/20 backdrop-blur-md transition-colors">
            ⚠️ Sin sucursal asignada.
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="text-center py-16 bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] border border-gray-100/50 dark:border-white/5 shadow-sm flex flex-col items-center transition-colors">
            <UserCircle size={48} className="text-gray-300 dark:text-slate-600 mb-3" strokeWidth={1.5}/>
            <p className="text-sm font-black text-gray-600 dark:text-white">No se encontraron clientes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {clientesFiltrados.map((c) => (
              <div key={c.id} className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-xl rounded-[1.5rem] border border-gray-100/50 dark:border-white/5 p-4 shadow-sm relative group overflow-hidden transition-colors">
                 <div className="flex justify-between items-start mb-3 border-b border-dashed border-gray-200/50 dark:border-slate-700 pb-3 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-500/20 flex items-center justify-center shrink-0 backdrop-blur-md transition-colors">
                          <span className="font-black text-lg uppercase">{c.nombre_completo.charAt(0)}</span>
                       </div>
                       <div>
                         <p className="font-black text-gray-800 dark:text-white text-sm md:text-base leading-tight line-clamp-2 transition-colors">{c.nombre_completo}</p>
                         <p className="text-[9px] md:text-[10px] font-extrabold text-gray-400 dark:text-slate-400 flex items-center gap-1 mt-0.5 tracking-wider uppercase transition-colors"><CreditCard size={10}/> DNI: {c.documento_identidad || 'S/C'}</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-gray-100/50 dark:border-white/5 mb-3 grid grid-cols-2 gap-2 backdrop-blur-md transition-colors">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Phone size={12} className="text-emerald-500 shrink-0"/>
                      <span className="text-[10px] md:text-[11px] font-bold text-gray-600 dark:text-slate-300 truncate transition-colors">{c.telefono || 'Sin celular'}</span>
                    </div>
                    {esAdmin && (
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Store size={12} className={c.sucursal_id ? "text-purple-400 shrink-0" : "text-red-400 shrink-0"}/>
                        <span className={`text-[9px] font-black uppercase tracking-wider truncate px-1.5 py-0.5 rounded border backdrop-blur-md transition-colors ${c.sucursal_id ? "text-purple-700 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-900/30 border-purple-200/50 dark:border-purple-500/20" : "text-red-600 dark:text-red-400 bg-red-100/50 dark:bg-red-900/30 border-red-200/50 dark:border-red-500/20"}`}>
                          {c.sucursal_id ? c.sucursal_nombre : 'Sin asignar'}
                        </span>
                      </div>
                    )}
                 </div>

                 <div className="flex gap-2">
                   <button onClick={() => setModalDetalles(c)} className="flex-1 py-2.5 bg-slate-50/80 dark:bg-slate-800/80 border border-transparent dark:border-white/5 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors backdrop-blur-md active:scale-95">
                     <Eye size={14}/>
                   </button>
                   <button onClick={() => openModal(c)} className="flex-1 py-2.5 bg-blue-50/80 dark:bg-blue-900/30 border border-transparent dark:border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center justify-center transition-colors backdrop-blur-md active:scale-95">
                     <Edit size={14}/>
                   </button>
                   <button onClick={() => setModalDelete(c)} className="flex-1 py-2.5 bg-red-50/80 dark:bg-red-900/30 border border-transparent dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors backdrop-blur-md active:scale-95">
                     <Trash2 size={14}/>
                   </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✨ VISTA PC: Tabla (Liquid Glass) ✨ */}
      <div className="hidden lg:block bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/80 dark:border-white/5 overflow-hidden transition-colors duration-300">
        <div className={`overflow-x-auto ${hideScrollbar}`}>
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 dark:bg-blue-950/30 text-slate-500 dark:text-blue-300 uppercase font-extrabold tracking-widest text-[10px] border-b border-gray-200/50 dark:border-white/5 transition-colors">
              <tr>
                <th className="px-6 py-5">Cliente</th>
                <th className="px-6 py-5">Documento (DNI)</th>
                <th className="px-6 py-5">Contacto</th>
                {esAdmin && <th className="px-6 py-5">Sede Asignada</th>}
                <th className="px-6 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50 dark:divide-white/5 relative">
              {loading ? <tr><td colSpan={esAdmin?"5":"4"} className="text-center py-12 text-gray-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest transition-colors">Cargando directorio...</td></tr> : 
               !sucursalActiva ? <tr><td colSpan={esAdmin?"5":"4"} className="text-center py-12 text-red-500 font-bold transition-colors">⚠️ Sin sucursal asignada.</td></tr> :
               clientesFiltrados.length === 0 ? <tr><td colSpan={esAdmin?"5":"4"} className="text-center py-12 font-medium text-gray-400 dark:text-slate-500 transition-colors">No hay clientes registrados.</td></tr> :
               clientesFiltrados.map((c) => (
                <tr key={c.id} className="hover:bg-white/40 dark:hover:bg-blue-900/10 transition-colors duration-200 group">
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-xl border border-blue-100/50 dark:border-blue-500/20 bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-md text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm uppercase transition-colors">
                          {c.nombre_completo.charAt(0)}
                       </div>
                       <span className="font-bold text-slate-800 dark:text-white transition-colors">{c.nombre_completo}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-blue-300/70 tracking-widest uppercase transition-colors">{c.documento_identidad || '---'}</td>
                  <td className="px-6 py-4">
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-0.5 flex items-center gap-1.5 transition-colors"><Phone size={12} className="text-emerald-500"/> {c.telefono || '---'}</p>
                    {c.email && <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate w-40 transition-colors uppercase tracking-widest">{c.email}</p>}
                  </td>
                  
                  {esAdmin && (
                    <td className="px-6 py-4">
                       <span className={`text-[9px] font-black px-2 py-1 rounded-md flex items-center gap-1 w-max uppercase tracking-wider backdrop-blur-md border transition-colors ${c.sucursal_id ? 'text-purple-700 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-900/30 border-purple-100/50 dark:border-purple-500/20' : 'text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/30 border-red-100/50 dark:border-red-500/20'}`}>
                         <Store size={10}/> {c.sucursal_id ? c.sucursal_nombre : 'Sin Asignar'}
                       </span>
                    </td>
                  )}

                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1.5 transition-opacity">
                      <button onClick={() => setModalDetalles(c)} className="p-2 text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/80 border border-transparent dark:border-white/5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors backdrop-blur-md active:scale-95" title="Detalles"><Eye size={14}/></button>
                      <button onClick={() => openModal(c)} className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 border border-transparent dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors backdrop-blur-md active:scale-95" title="Editar"><Edit size={14}/></button>
                      <button onClick={() => setModalDelete(c)} className="p-2 text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/30 border border-transparent dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors backdrop-blur-md active:scale-95" title="Eliminar"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✨ MODAL DETALLES DEL CLIENTE (LIQUID GLASS) ✨ */}
      {modalDetalles && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md transition-colors animate-fade-in">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl p-6 sm:p-8 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full sm:max-w-sm shadow-2xl border border-white/50 dark:border-white/10 animate-fade-in-up pb-8 transition-colors">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>
            
            <div className="flex justify-between items-center mb-6 border-b border-gray-100/50 dark:border-white/5 pb-4 transition-colors">
              <h2 className="text-lg md:text-xl font-black text-gray-800 dark:text-white flex items-center gap-2"><UserCircle className="text-blue-600 dark:text-blue-400"/> Ficha del Cliente</h2>
              <button onClick={() => setModalDetalles(null)} className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors border border-transparent dark:border-white/5"><X size={18}/></button>
            </div>
            
            <div className="space-y-4">
               <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100/50 dark:border-white/5 backdrop-blur-md transition-colors">
                 <label className="text-[9px] md:text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest block mb-1 transition-colors">Nombre / Razón Social</label>
                 <p className="text-base md:text-lg font-black text-gray-800 dark:text-white leading-tight transition-colors">{modalDetalles.nombre_completo}</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100/50 dark:border-white/5 backdrop-blur-md transition-colors">
                   <label className="text-[9px] md:text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest block mb-1 transition-colors">Documento (DNI)</label>
                   <p className="text-[11px] md:text-xs font-black text-gray-700 dark:text-slate-200 transition-colors">{modalDetalles.documento_identidad || 'No Registrado'}</p>
                 </div>
                 <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100/50 dark:border-white/5 backdrop-blur-md transition-colors">
                   <label className="text-[9px] md:text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest block mb-1 transition-colors">Teléfono</label>
                   <p className="text-[11px] md:text-xs font-black text-gray-700 dark:text-slate-200 transition-colors">{modalDetalles.telefono || 'No Registrado'}</p>
                 </div>
               </div>

               <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100/50 dark:border-white/5 backdrop-blur-md transition-colors">
                 <label className="text-[9px] md:text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest block mb-1 transition-colors">Dirección / Referencia</label>
                 <p className="text-[11px] md:text-xs font-black text-gray-700 dark:text-slate-200 transition-colors">{modalDetalles.direccion || 'No Registrada'}</p>
               </div>

               <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100/50 dark:border-white/5 backdrop-blur-md transition-colors">
                 <label className="text-[9px] md:text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest block mb-2 transition-colors">Afiliación a Sede</label>
                 <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border backdrop-blur-md font-black text-[10px] md:text-xs uppercase tracking-wider transition-colors ${modalDetalles.sucursal_id ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100/50 dark:border-blue-500/20' : 'bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100/50 dark:border-red-500/20'}`}>
                   <Store size={14}/> {modalDetalles.sucursal_id ? modalDetalles.sucursal_nombre : '⚠️ Requiere Asignación'}
                 </div>
               </div>
            </div>
            
            <button onClick={() => setModalDetalles(null)} className="w-full mt-6 bg-gray-100/80 dark:bg-slate-800/80 border border-transparent dark:border-white/5 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-300 py-3.5 rounded-xl font-extrabold transition-colors text-sm backdrop-blur-md active:scale-95">Cerrar Ficha</button>
          </div>
        </div>
      )}

      {/* ✨ MODAL CREAR / EDITAR CLIENTE (LIQUID GLASS) ✨ */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md transition-colors animate-fade-in">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl p-6 sm:p-8 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full sm:max-w-md shadow-2xl border border-white/50 dark:border-white/10 animate-fade-in-up flex flex-col max-h-[90vh] transition-colors">
            
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>
            
            <div className="flex justify-between items-center mb-6 border-b border-gray-100/50 dark:border-white/5 pb-4 shrink-0 transition-colors">
              <h2 className="text-lg md:text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                {formData.id ? <Edit className="text-blue-600 dark:text-blue-400" size={20}/> : <Plus className="text-blue-600 dark:text-blue-400" size={20}/>}
                {formData.id ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors border border-transparent dark:border-white/5"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className={`space-y-4 overflow-y-auto ${hideScrollbar} pb-4 px-1`}>
              <div>
                <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest block mb-1.5 transition-colors">Nombre Completo *</label>
                <input required className={`w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border p-3.5 rounded-xl focus:bg-white dark:focus:bg-blue-950 focus:ring-2 outline-none font-bold text-gray-800 dark:text-white text-xs md:text-sm transition-all shadow-sm ${errores.nombre_completo ? 'border-red-400 dark:border-red-500/50 focus:ring-red-500/20' : 'border-gray-200/80 dark:border-white/10 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400'}`} value={formData.nombre_completo} onChange={e => { setFormData({...formData, nombre_completo: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')}); if (errores.nombre_completo) setErrores({...errores, nombre_completo: null}); }} placeholder="Ej: Juan Pérez" autoFocus/>
                {errores.nombre_completo && <p className="text-[9px] text-red-500 dark:text-red-400 mt-1.5 font-bold uppercase tracking-wider">{errores.nombre_completo}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest block mb-1.5 transition-colors">DNI</label>
                  <input type="text" inputMode="numeric" className={`w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border p-3.5 rounded-xl focus:bg-white dark:focus:bg-blue-950 focus:ring-2 outline-none font-bold text-gray-800 dark:text-white tracking-wider text-xs md:text-sm transition-all shadow-sm ${errores.documento_identidad ? 'border-red-400 dark:border-red-500/50 focus:ring-red-500/20' : 'border-gray-200/80 dark:border-white/10 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400'}`} value={formData.documento_identidad} onChange={e => { setFormData({...formData, documento_identidad: e.target.value.replace(/\D/g, '').slice(0, 8)}); if (errores.documento_identidad) setErrores({...errores, documento_identidad: null}); }} placeholder="8 dígitos" />
                  {errores.documento_identidad && <p className="text-[9px] text-red-500 dark:text-red-400 mt-1.5 font-bold uppercase tracking-wider leading-tight">{errores.documento_identidad}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest block mb-1.5 transition-colors">Celular</label>
                  <input type="text" inputMode="numeric" className={`w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border p-3.5 rounded-xl focus:bg-white dark:focus:bg-blue-950 focus:ring-2 outline-none font-bold text-gray-800 dark:text-white tracking-wider text-xs md:text-sm transition-all shadow-sm ${errores.telefono ? 'border-red-400 dark:border-red-500/50 focus:ring-red-500/20' : 'border-gray-200/80 dark:border-white/10 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400'}`} value={formData.telefono} onChange={e => { setFormData({...formData, telefono: e.target.value.replace(/\D/g, '').slice(0, 9)}); if (errores.telefono) setErrores({...errores, telefono: null}); }} placeholder="9 dígitos" />
                  {errores.telefono && <p className="text-[9px] text-red-500 dark:text-red-400 mt-1.5 font-bold uppercase tracking-wider leading-tight">{errores.telefono}</p>}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest block mb-1.5 transition-colors">Dirección (Opcional)</label>
                <input className="w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border border-gray-200/80 dark:border-white/10 p-3.5 rounded-xl focus:bg-white dark:focus:bg-blue-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none font-bold text-gray-700 dark:text-white text-xs md:text-sm transition-all shadow-sm" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} placeholder="Ej: Av. Central 123"/>
              </div>

              {esAdmin && (
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest block mb-1.5 mt-4 transition-colors">Afiliar a Sede *</label>
                  <select className={`w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border p-3.5 rounded-xl focus:bg-white dark:focus:bg-blue-950 outline-none font-bold text-gray-700 dark:text-slate-200 text-xs md:text-sm transition-all shadow-sm ${errores.sucursal_id ? 'border-red-400 dark:border-red-500/50 focus:ring-2 focus:ring-red-500/20' : 'border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400'}`} value={formData.sucursal_id} onChange={e => {setFormData({...formData, sucursal_id: e.target.value}); if(errores.sucursal_id) setErrores({...errores, sucursal_id: null})}}>
                    <option value="">-- Selecciona una Sede --</option>
                    {sucursales.map(suc => <option key={suc.id} value={suc.id}>{suc.nombre}</option>)}
                  </select>
                  {errores.sucursal_id && <p className="text-[9px] text-red-500 dark:text-red-400 mt-1.5 font-bold uppercase tracking-wider leading-tight">{errores.sucursal_id}</p>}
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-gray-100/50 dark:border-white/5 mt-6 transition-colors">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3.5 border border-gray-200/80 dark:border-white/5 bg-white/50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-300 rounded-xl font-extrabold hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm backdrop-blur-md shadow-sm active:scale-95">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600/90 dark:bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 text-sm flex items-center justify-center gap-1.5 border border-transparent dark:border-white/10 backdrop-blur-md"><CheckCircle size={16}/> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✨ MODAL ELIMINAR (LIQUID GLASS) ✨ */}
      {modalDelete && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md transition-colors animate-fade-in">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl p-6 sm:p-8 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full sm:max-w-sm text-center shadow-2xl border border-white/50 dark:border-white/10 animate-fade-in-up pb-8 transition-colors">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
            <div className="mx-auto w-16 h-16 bg-red-50/80 dark:bg-red-900/30 border border-red-100/50 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4 backdrop-blur-md shadow-sm transition-colors">
              <AlertTriangle size={28}/>
            </div>
            <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2 transition-colors">¿Eliminar Cliente?</h3>
            <p className="text-xs md:text-sm text-gray-500 dark:text-blue-200/70 mb-8 font-medium leading-relaxed transition-colors">
              Borrarás a <strong className="text-gray-800 dark:text-blue-100 font-black">"{modalDelete.nombre_completo}"</strong> de la base de datos. Esta acción es irreversible.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalDelete(null)} className="flex-1 py-3.5 bg-gray-100/80 dark:bg-slate-800/80 border border-transparent dark:border-white/5 text-gray-700 dark:text-slate-300 rounded-xl font-extrabold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-sm backdrop-blur-md shadow-sm active:scale-95">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-3.5 bg-red-600/90 text-white rounded-xl font-black hover:bg-red-600 transition-all shadow-lg shadow-red-600/20 border border-red-500/50 text-sm active:scale-95">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
export default Clientes;