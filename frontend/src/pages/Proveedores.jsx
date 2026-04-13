import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Plus, Edit, Trash2, X, AlertTriangle, Search, CheckCircle, Building2, Eye, Store, Phone, Mail, MapPin } from 'lucide-react';

const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [sucursales, setSucursales] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('activos');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [modalDetalles, setModalDetalles] = useState(null); 
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({ id: null, razon_social: '', ruc: '', telefono: '', email: '', direccion: '', sucursal_id: '' });
  const [formErrors, setFormErrors] = useState({});
  const [provToDelete, setProvToDelete] = useState(null);

  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);
  const esVistaGlobal = sucursalActiva?.id === 'ALL';

  const [usuarioActual, setUsuarioActual] = useState(JSON.parse(localStorage.getItem('usuario') || '{}'));
  const esAdmin = usuarioActual.rol === 'Administrador';

  const getCategoriasSeguras = () => {
    try {
      let cat = usuarioActual?.categorias;
      if (typeof cat === 'string') cat = JSON.parse(cat);
      if (typeof cat === 'string') cat = JSON.parse(cat); 
      return Array.isArray(cat) ? cat : [];
    } catch(e) { return []; }
  };

  const tienePermisoEditar = esAdmin || getCategoriasSeguras().includes('Modificador') || getCategoriasSeguras().includes('Modificador_Proveedores');

  const showToast = (type, message) => { setToast({ type, message }); setTimeout(() => setToast(null), 3500); };

  const fetchData = async () => {
    const currentSucursal = JSON.parse(localStorage.getItem('sucursalActiva'));
    if (!currentSucursal) { setProveedores([]); setLoading(false); return; }

    setLoading(true);
    try {
      const res = await api.get(`/proveedores?estado=${filtroEstado}`);
      setProveedores(Array.isArray(res.data) ? res.data : []);
      try {
        const sucRes = await api.get('/sucursales');
        setSucursales(sucRes.data);
      } catch(e){}
    } catch (error) { showToast('error', 'Error al cargar los proveedores.'); setProveedores([]); } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchData(); 
    const handleSucursalCambiada = () => {
      setSucursalActiva(JSON.parse(localStorage.getItem('sucursalActiva')));
      fetchData(); 
    };
    window.addEventListener('sucursalCambiada', handleSucursalCambiada);
    return () => window.removeEventListener('sucursalCambiada', handleSucursalCambiada);
  }, [filtroEstado]);

  // ✨ FIX: Cerrar modales con ESC ✨
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        setModalDetalles(null);
        setDeleteModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  // ✨ FIX: Cerrar al dar clic afuera ✨
  const handleOverlayClick = (e, closeFunc) => {
    if (e.target === e.currentTarget) closeFunc();
  };

  const filtrados = proveedores.filter(prov => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (prov.razon_social && prov.razon_social.toLowerCase().includes(term)) || (prov.ruc && prov.ruc.includes(term));
  });

  const openModal = (prov = null) => {
    setFormErrors({});
    if (prov) {
      setIsEditing(true);
      setFormData({ id: prov.id, razon_social: prov.razon_social ?? '', ruc: prov.ruc ?? '', telefono: prov.telefono ?? '', email: prov.email ?? '', direccion: prov.direccion ?? '', sucursal_id: prov.sucursal_id || '' });
    } else {
      setIsEditing(false);
      setFormData({ id: null, razon_social: '', ruc: '', telefono: '', email: '', direccion: '', sucursal_id: esVistaGlobal ? '' : sucursalActiva?.id || '' });
    }
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.razon_social.trim()) errors.razon_social = 'La razón social es obligatoria';
    if (formData.ruc && !/^\d{11}$/.test(formData.ruc.trim())) errors.ruc = 'El RUC debe tener exactamente 11 números';
    if (formData.telefono && !/^\d{9}$/.test(formData.telefono.trim())) errors.telefono = 'El teléfono debe tener exactamente 9 números';
    if (esVistaGlobal && !formData.sucursal_id) errors.sucursal_id = 'Debes asignar una sucursal';
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Formato de correo inválido';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = { ...formData, razon_social: formData.razon_social.trim(), ruc: formData.ruc.trim() || null, telefono: formData.telefono.trim() || null, email: formData.email.trim() || null, direccion: formData.direccion.trim() || null };

    try {
      if (isEditing) { await api.put(`/proveedores/${formData.id}`, payload); showToast('success', 'Proveedor actualizado correctamente'); } 
      else { await api.post('/proveedores', payload); showToast('success', 'Proveedor creado con éxito'); }
      setIsModalOpen(false); fetchData(); 
    } catch (error) { showToast('error', error.response?.data?.error || 'Ocurrió un error inesperado'); }
  };
  
  const handleDelete = async () => {
    if (!provToDelete) return;
    try { await api.delete(`/proveedores/${provToDelete.id}`); showToast('success', 'Proveedor movido a la papelera'); setDeleteModalOpen(false); fetchData(); } catch (error) { showToast('error', 'Error al eliminar'); }
  };

  return (
    <Layout title="Proveedores" moduleIcon={<Building2/>}>
      {toast && (
        <div className={`fixed top-4 right-4 md:top-auto md:bottom-10 md:right-10 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-white animate-fade-in-down md:animate-fade-in-up backdrop-blur-xl border border-white/20 transition-colors ${toast.type === 'success' ? 'bg-emerald-600/95' : 'bg-red-600/95'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <p className="font-bold text-xs md:text-sm tracking-wide">{toast.message}</p>
        </div>
      )}

      {/* ✨ CABECERA ✨ */}
      <div className="flex flex-col gap-3 mb-4 md:mb-6">
        
        {/* Fila 1: Título y Botón Principal */}
        <div className="flex justify-between items-center">
          <p className="text-[11px] md:text-sm text-gray-500 dark:text-blue-300/70 font-extrabold px-1 uppercase tracking-widest transition-colors">
             {esVistaGlobal ? 'Directorio Global' : `Directorio de: ${sucursalActiva?.nombre || 'Ninguna'}`}
          </p>
          {sucursalActiva && tienePermisoEditar && (
            <button onClick={() => openModal()} className="bg-blue-600/90 dark:bg-blue-600 text-white px-4 py-2 md:py-2.5 rounded-xl font-black flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 hover:bg-blue-700 transition-all active:scale-95 text-xs md:text-sm shrink-0 border border-transparent dark:border-white/10 backdrop-blur-md">
              <Plus size={16} /> <span className="hidden sm:inline">Nuevo Proveedor</span><span className="sm:hidden">Nuevo</span>
            </button>
          )}
        </div>

        {/* Fila 2: Buscador y Filtro */}
        {sucursalActiva && (
          <div className="flex gap-2 w-full">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-blue-400/70 transition-colors" size={16} />
               <input type="text" placeholder="Buscar por Razón Social o RUC..." className="w-full bg-white/80 dark:bg-blue-950/50 backdrop-blur-md border border-gray-200/80 dark:border-white/10 pl-9 pr-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-blue-950 focus:border-blue-500 dark:focus:border-blue-400 font-bold text-gray-800 dark:text-white text-xs md:text-sm transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             </div>
             <select className="bg-white/80 dark:bg-blue-950/50 backdrop-blur-md border border-gray-200/80 dark:border-white/10 px-3 py-2.5 rounded-xl outline-none focus:bg-white dark:focus:bg-blue-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 font-bold text-gray-700 dark:text-slate-200 text-xs md:text-sm shadow-sm shrink-0 transition-all" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
               <option value="activos">Activos</option>
               <option value="inactivos">Papelera</option>
               <option value="todos">Todos</option>
             </select>
          </div>
        )}
      </div>

      {/* ✨ VISTA TÁCTIL (Móvil y Tablet - LIQUID GLASS) ✨ */}
      <div className="lg:hidden flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-blue-300/70 transition-colors">
             <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
             <p className="text-[10px] font-extrabold uppercase tracking-widest transition-colors">Cargando proveedores...</p>
          </div>
        ) : !sucursalActiva ? (
          <div className="text-center py-10 text-xs font-bold text-red-500 bg-red-50/80 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-500/20 backdrop-blur-md transition-colors">
            ⚠️ Sin sucursal asignada.
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] border border-gray-100/50 dark:border-white/5 shadow-sm flex flex-col items-center transition-colors">
            <Building2 size={48} className="text-gray-300 dark:text-slate-600 mb-3" strokeWidth={1.5}/>
            <p className="text-sm font-black text-gray-600 dark:text-white transition-colors">No se encontraron proveedores</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {filtrados.map((prov) => (
              <div key={prov.id} className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-xl rounded-[1.5rem] border border-gray-100/50 dark:border-white/5 p-4 shadow-sm relative group overflow-hidden transition-colors">
                 <div className="flex justify-between items-start mb-3 border-b border-dashed border-gray-200/50 dark:border-slate-700 pb-3 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/50 dark:border-blue-500/20 backdrop-blur-md transition-colors">
                          <span className="font-black text-lg uppercase">{prov.razon_social.charAt(0)}</span>
                       </div>
                       <div>
                         <p className="font-black text-gray-800 dark:text-white text-sm leading-tight line-clamp-2 transition-colors">{prov.razon_social}</p>
                         <p className="text-[9px] md:text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 flex items-center gap-1 mt-0.5 uppercase tracking-widest transition-colors">RUC: {prov.ruc || 'S/C'}</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-gray-100/50 dark:border-white/5 mb-3 grid grid-cols-2 gap-2 backdrop-blur-md transition-colors">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Phone size={12} className="text-emerald-500 shrink-0"/>
                      <span className="text-[10px] font-bold text-gray-600 dark:text-slate-300 truncate transition-colors">{prov.telefono || 'Sin celular'}</span>
                    </div>
                    {esAdmin && (
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Store size={12} className={prov.sucursal_id ? "text-purple-500 shrink-0" : "text-red-400 shrink-0"}/>
                        <span className={`text-[9px] font-black uppercase tracking-wider truncate px-1.5 py-0.5 rounded border backdrop-blur-md transition-colors ${prov.sucursal_id ? "text-purple-700 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-900/30 border-purple-200/50 dark:border-purple-500/20" : "text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/30 border-red-200/50 dark:border-red-500/20"}`}>
                          {prov.sucursal_id ? prov.sucursal_nombre : 'Sin asignar'}
                        </span>
                      </div>
                    )}
                 </div>

                 <div className="flex gap-2">
                   <button onClick={() => setModalDetalles(prov)} className="flex-1 py-2.5 bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 border border-transparent dark:border-white/5 flex items-center justify-center transition-colors backdrop-blur-md active:scale-95">
                     <Eye size={14}/>
                   </button>
                   {tienePermisoEditar && (
                     <>
                       <button onClick={() => openModal(prov)} className="flex-1 py-2.5 bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-transparent dark:border-blue-500/20 rounded-lg font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center justify-center transition-colors backdrop-blur-md active:scale-95">
                         <Edit size={14}/>
                       </button>
                       {prov.estado && (
                         <button onClick={() => {setProvToDelete(prov); setDeleteModalOpen(true);}} className="flex-1 py-2.5 bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-transparent dark:border-red-500/20 rounded-lg flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors backdrop-blur-md active:scale-95">
                           <Trash2 size={14}/>
                         </button>
                       )}
                     </>
                   )}
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✨ VISTA PC: Tabla (LIQUID GLASS) ✨ */}
      <div className="hidden lg:block bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/80 dark:border-white/5 overflow-hidden transition-colors duration-300">
        <div className={`overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)] ${hideScrollbar}`}>
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 dark:bg-blue-950/30 text-slate-500 dark:text-blue-300 uppercase font-extrabold tracking-widest text-[10px] sticky top-0 z-10 border-b border-gray-200/50 dark:border-white/5 backdrop-blur-md transition-colors">
              <tr>
                <th className="px-6 py-5">Razón Social</th>
                <th className="px-6 py-5">RUC</th>
                {esAdmin && <th className="px-6 py-5">Ubicación</th>}
                <th className="px-6 py-5">Contacto</th>
                <th className="px-6 py-5">Email & Dirección</th>
                <th className="px-6 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50 dark:divide-white/5 relative">
              {loading ? <tr><td colSpan={esAdmin?"6":"5"} className="text-center py-12 text-gray-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest transition-colors">Cargando directorio...</td></tr> : 
               !sucursalActiva ? <tr><td colSpan={esAdmin?"6":"5"} className="text-center py-12 text-red-500 font-bold transition-colors">⚠️ Sin sucursal asignada.</td></tr> :
               filtrados.length === 0 ? <tr><td colSpan={esAdmin?"6":"5"} className="text-center py-12 font-medium text-gray-400 dark:text-slate-500 transition-colors">No hay proveedores registrados.</td></tr> : 
               filtrados.map((prov) => (
                <tr key={prov.id} className="hover:bg-white/40 dark:hover:bg-blue-900/10 transition-colors duration-200 group">
                  <td className="px-6 py-4 font-black text-gray-800 dark:text-white transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-500/20 flex items-center justify-center font-black text-sm uppercase backdrop-blur-md transition-colors">
                         {prov.razon_social.charAt(0)}
                      </div>
                      <span className="truncate max-w-[200px]" title={prov.razon_social}>{prov.razon_social}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="bg-white/50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-300 px-2.5 py-1 rounded-md text-[10px] font-bold border border-gray-200/50 dark:border-white/5 tracking-wider backdrop-blur-md transition-colors">{prov.ruc || 'S/D'}</span></td>
                  
                  {esAdmin && (
                    <td className="px-6 py-4">
                       <span className={`text-[9px] font-black px-2 py-1 rounded-md flex items-center gap-1 w-max uppercase tracking-wider backdrop-blur-md border transition-colors ${prov.sucursal_id ? 'text-purple-700 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-900/30 border-purple-100/50 dark:border-purple-500/20' : 'text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/30 border-red-100/50 dark:border-red-500/20'}`}>
                         <Store size={10}/> {prov.sucursal_id ? prov.sucursal_nombre : 'Sin Asignar'}
                       </span>
                    </td>
                  )}

                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mt-3 transition-colors"><Phone size={12} className="text-emerald-500"/> {prov.telefono || '---'}</td>
                  <td className="px-6 py-4">
                    <p className="truncate text-blue-600 dark:text-blue-400 text-[11px] font-extrabold mb-0.5 max-w-[150px] uppercase tracking-wider transition-colors">{prov.email || 'Sin correo'}</p>
                    <p className="truncate text-gray-400 dark:text-slate-400 text-[10px] font-bold max-w-[150px] transition-colors" title={prov.direccion}>{prov.direccion || 'Sin dirección'}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1.5 transition-opacity">
                      <button onClick={() => setModalDetalles(prov)} className="p-2 text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent dark:border-white/5 backdrop-blur-md active:scale-95" title="Ver Detalles"><Eye size={14} /></button>
                      {tienePermisoEditar && (
                        <>
                          <button onClick={() => openModal(prov)} className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-transparent dark:border-blue-500/20 backdrop-blur-md active:scale-95" title="Editar"><Edit size={14} /></button>
                          {prov.estado && <button onClick={() => {setProvToDelete(prov); setDeleteModalOpen(true);}} className="p-2 text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors border border-transparent dark:border-red-500/20 backdrop-blur-md active:scale-95" title="Eliminar"><Trash2 size={14} /></button>}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✨ MODAL DETALLES (Bottom Sheet - Liquid Glass) ✨ */}
      {modalDetalles && (
        <div onMouseDown={(e) => handleOverlayClick(e, () => setModalDetalles(null))} className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md transition-colors animate-fade-in">
          {/* ✨ FIX: Ancho máximo ajustado para que no sea gigante en PC */}
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl p-6 sm:p-8 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full sm:max-w-md shadow-2xl border border-white/50 dark:border-white/10 animate-fade-in-up pb-8 transition-colors">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>
            <div className="flex justify-between items-center mb-5 border-b border-gray-100/50 dark:border-white/5 pb-4 transition-colors">
              <h2 className="text-lg md:text-xl font-black text-gray-800 dark:text-white flex items-center gap-2"><Building2 className="text-blue-600 dark:text-blue-400"/> Ficha Proveedor</h2>
              <button onClick={() => setModalDetalles(null)} className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors border border-transparent dark:border-white/5"><X size={18}/></button>
            </div>
            
            <div className="space-y-4">
               <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100/50 dark:border-white/5 backdrop-blur-md transition-colors">
                 <label className="text-[9px] md:text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest block mb-1 transition-colors">Razón Social</label>
                 <p className="text-base md:text-lg font-black text-gray-800 dark:text-white leading-tight transition-colors">{modalDetalles.razon_social}</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100/50 dark:border-white/5 backdrop-blur-md transition-colors">
                   <label className="text-[9px] md:text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest block mb-1 transition-colors">RUC</label>
                   <p className="text-[11px] md:text-xs font-black text-gray-700 dark:text-slate-200 transition-colors">{modalDetalles.ruc || 'N/A'}</p>
                 </div>
                 <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100/50 dark:border-white/5 backdrop-blur-md transition-colors">
                   <label className="text-[9px] md:text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest block mb-1 transition-colors">Teléfono</label>
                   <p className="text-[11px] md:text-xs font-black text-gray-700 dark:text-slate-200 flex items-center gap-1 transition-colors"><Phone size={12} className="text-emerald-500"/> {modalDetalles.telefono || 'N/A'}</p>
                 </div>
               </div>

               <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100/50 dark:border-white/5 backdrop-blur-md transition-colors">
                 <label className="text-[9px] md:text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest block mb-1 transition-colors">Correo Electrónico</label>
                 <p className="text-[11px] md:text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-1 transition-colors"><Mail size={12}/> {modalDetalles.email || 'N/A'}</p>
               </div>

               <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100/50 dark:border-white/5 backdrop-blur-md transition-colors">
                 <label className="text-[9px] md:text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest block mb-1 transition-colors">Dirección Físicia</label>
                 <p className="text-[11px] md:text-xs font-black text-gray-700 dark:text-slate-200 flex items-start gap-1 transition-colors"><MapPin size={12} className="mt-0.5 shrink-0 text-red-500 dark:text-red-400"/> {modalDetalles.direccion || 'N/A'}</p>
               </div>

               <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100/50 dark:border-white/5 backdrop-blur-md transition-colors">
                 <label className="text-[9px] md:text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest block mb-2 transition-colors">Afiliación a Sede</label>
                 <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-black text-[10px] md:text-xs uppercase tracking-wider backdrop-blur-md transition-colors ${modalDetalles.sucursal_id ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100/50 dark:border-blue-500/20' : 'bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100/50 dark:border-red-500/20'}`}>
                   <Store size={14}/> {modalDetalles.sucursal_id ? modalDetalles.sucursal_nombre : '⚠️ Requiere Asignación'}
                 </div>
               </div>
            </div>
            
            <button onClick={() => setModalDetalles(null)} className="w-full mt-6 bg-gray-100/80 dark:bg-slate-800/80 border border-transparent dark:border-white/5 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-300 py-3.5 rounded-xl font-extrabold transition-colors text-sm backdrop-blur-md active:scale-95">Cerrar Ficha</button>
          </div>
        </div>
      )}

      {/* ✨ MODAL CREAR / EDITAR PROVEEDOR (LIQUID GLASS) ✨ */}
      {isModalOpen && (
        <div onMouseDown={(e) => handleOverlayClick(e, () => setIsModalOpen(false))} className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md transition-colors animate-fade-in">
          {/* ✨ FIX: Ancho máximo ajustado y padding interno balanceado */}
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl p-6 sm:p-8 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full sm:max-w-md shadow-2xl border border-white/50 dark:border-white/10 animate-fade-in-up flex flex-col max-h-[90vh] transition-colors">
            
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>
            
            <div className="flex justify-between items-center mb-6 border-b border-gray-100/50 dark:border-white/5 pb-4 shrink-0 transition-colors">
               <h2 className="text-lg md:text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                 {isEditing ? <Edit className="text-blue-600 dark:text-blue-400" size={20}/> : <Building2 className="text-blue-600 dark:text-blue-400" size={20}/>} 
                 {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
               </h2>
               <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors border border-transparent dark:border-white/5"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className={`space-y-4 overflow-y-auto ${hideScrollbar} pb-4 px-1`}>
              <div>
                <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest block mb-1.5 transition-colors">Razón Social / Nombre *</label>
                <input className={`w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border p-3.5 rounded-xl focus:bg-white dark:focus:bg-blue-950 focus:ring-2 outline-none font-bold text-gray-800 dark:text-white text-xs md:text-sm transition-all shadow-sm ${formErrors.razon_social ? 'border-red-400 dark:border-red-500/50 focus:ring-red-500/20' : 'border-gray-200/80 dark:border-white/10 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400'}`} value={formData.razon_social ?? ''} onChange={(e) => {setFormData({...formData, razon_social: e.target.value}); if (formErrors.razon_social) setFormErrors({...formErrors, razon_social: null}); }} autoFocus/>
                {formErrors.razon_social && <p className="text-[9px] text-red-500 dark:text-red-400 mt-1.5 font-bold uppercase tracking-wider">{formErrors.razon_social}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest block mb-1.5 transition-colors">RUC</label>
                  <input type="text" inputMode="numeric" className={`w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border p-3.5 rounded-xl focus:bg-white dark:focus:bg-blue-950 focus:ring-2 outline-none font-bold text-gray-800 dark:text-white tracking-wider text-xs md:text-sm transition-all shadow-sm ${formErrors.ruc ? 'border-red-400 dark:border-red-500/50 focus:ring-red-500/20' : 'border-gray-200/80 dark:border-white/10 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400'}`} value={formData.ruc ?? ''} onChange={(e) => { setFormData({...formData, ruc: e.target.value.replace(/\D/g, '').slice(0, 11)}); if (formErrors.ruc) setFormErrors({...formErrors, ruc: null}); }} placeholder="11 dígitos"/>
                  {formErrors.ruc && <p className="text-[9px] text-red-500 dark:text-red-400 mt-1.5 font-bold uppercase tracking-wider leading-tight">{formErrors.ruc}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest block mb-1.5 transition-colors">Teléfono</label>
                  <input type="text" inputMode="numeric" className={`w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border p-3.5 rounded-xl focus:bg-white dark:focus:bg-blue-950 focus:ring-2 outline-none font-bold text-gray-800 dark:text-white tracking-wider text-xs md:text-sm transition-all shadow-sm ${formErrors.telefono ? 'border-red-400 dark:border-red-500/50 focus:ring-red-500/20' : 'border-gray-200/80 dark:border-white/10 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400'}`} value={formData.telefono ?? ''} onChange={(e) => { setFormData({...formData, telefono: e.target.value.replace(/\D/g, '').slice(0, 9)}); if (formErrors.telefono) setFormErrors({...formErrors, telefono: null}); }} placeholder="9 dígitos"/>
                  {formErrors.telefono && <p className="text-[9px] text-red-500 dark:text-red-400 mt-1.5 font-bold uppercase tracking-wider leading-tight">{formErrors.telefono}</p>}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest block mb-1.5 transition-colors">Correo Electrónico</label>
                <input type="email" className={`w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border p-3.5 rounded-xl focus:bg-white dark:focus:bg-blue-950 focus:ring-2 outline-none font-bold text-gray-800 dark:text-white text-xs md:text-sm transition-all shadow-sm ${formErrors.email ? 'border-red-400 dark:border-red-500/50 focus:ring-red-500/20' : 'border-gray-200/80 dark:border-white/10 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400'}`} value={formData.email ?? ''} onChange={(e) => {setFormData({...formData, email: e.target.value}); if (formErrors.email) setFormErrors({...formErrors, email: null}); }} placeholder="ejemplo@empresa.com"/>
                {formErrors.email && <p className="text-[9px] text-red-500 dark:text-red-400 mt-1.5 font-bold uppercase tracking-wider leading-tight">{formErrors.email}</p>}
              </div>
              
              <div>
                <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest block mb-1.5 transition-colors">Dirección Física</label>
                <input className="w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border border-gray-200/80 dark:border-white/10 p-3.5 rounded-xl focus:bg-white dark:focus:bg-blue-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none font-bold text-gray-700 dark:text-white text-xs md:text-sm transition-all shadow-sm" value={formData.direccion ?? ''} onChange={(e) => setFormData({...formData, direccion: e.target.value})} placeholder="Av. Central 123"/>
              </div>

              {esAdmin && (
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest block mb-1.5 mt-4 transition-colors">Afiliar a Sede *</label>
                  <select className={`w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border p-3.5 rounded-xl focus:bg-white dark:focus:bg-blue-950 outline-none font-bold text-gray-700 dark:text-slate-200 text-xs md:text-sm transition-all shadow-sm ${formErrors.sucursal_id ? 'border-red-400 dark:border-red-500/50 focus:ring-2 focus:ring-red-500/20' : 'border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400'}`} value={formData.sucursal_id} onChange={e => {setFormData({...formData, sucursal_id: e.target.value}); if(formErrors.sucursal_id) setFormErrors({...formErrors, sucursal_id: null})}}>
                    <option value="">-- Selecciona una Sede --</option>
                    {sucursales.map(suc => <option key={suc.id} value={suc.id}>{suc.nombre}</option>)}
                  </select>
                  {formErrors.sucursal_id && <p className="text-[9px] text-red-500 dark:text-red-400 mt-1.5 font-bold uppercase tracking-wider leading-tight">{formErrors.sucursal_id}</p>}
                </div>
              )}

              <div className="flex gap-3 pt-6 border-t border-gray-100/50 dark:border-white/5 mt-6 transition-colors">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 border border-gray-200/80 dark:border-white/5 bg-white/50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-300 rounded-xl font-extrabold hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm backdrop-blur-md shadow-sm active:scale-95">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600/90 dark:bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 text-sm flex items-center justify-center gap-1.5 border border-transparent dark:border-white/10 backdrop-blur-md"><CheckCircle size={16}/> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* ✨ MODAL ELIMINAR (LIQUID GLASS) ✨ */}
      {deleteModalOpen && provToDelete && (
        <div onMouseDown={(e) => handleOverlayClick(e, () => setDeleteModalOpen(false))} className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md transition-colors animate-fade-in">
          <div className="bg-white/90 dark:bg-blue-950/90 backdrop-blur-3xl p-6 sm:p-8 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full sm:max-w-sm text-center shadow-2xl border border-white/50 dark:border-white/10 animate-fade-in-up pb-8 transition-colors">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
            <div className="mx-auto flex items-center justify-center h-16 w-16 bg-red-50/80 dark:bg-red-900/30 border border-red-100/50 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-full mb-4 backdrop-blur-md shadow-sm transition-colors">
              <AlertTriangle size={28}/>
            </div>
            <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2 transition-colors">¿Eliminar Proveedor?</h3>
            <p className="text-xs md:text-sm text-gray-500 dark:text-blue-200/70 mb-8 font-medium leading-relaxed transition-colors">
              Desactivarás a <strong className="text-gray-800 dark:text-blue-100 font-black">"{provToDelete.razon_social}"</strong> de la base de datos.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-3.5 bg-gray-100/80 dark:bg-slate-800/80 border border-transparent dark:border-white/5 text-gray-700 dark:text-slate-300 rounded-xl font-extrabold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-sm backdrop-blur-md shadow-sm active:scale-95">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-3.5 bg-red-600/90 text-white rounded-xl font-black hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-600/20 border border-red-500/50 text-sm">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
export default Proveedores;