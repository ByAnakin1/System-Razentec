import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Plus, Edit, Trash2, X, AlertTriangle, Search, CheckCircle, Building2, Eye, Store, Phone, Mail, MapPin } from 'lucide-react';

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
        <div className={`fixed top-4 right-4 md:top-6 md:right-6 z-[100] flex items-center gap-3 px-5 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl shadow-2xl text-white animate-fade-in-down ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={20} className="md:w-6 md:h-6" /> : <AlertTriangle size={20} className="md:w-6 md:h-6" />}
          <p className="font-bold text-xs md:text-sm">{toast.message}</p>
        </div>
      )}

      {/* ✨ CABECERA ROBUSTA EN 2 FILAS (Evita que el iPad aplaste los textos) ✨ */}
      <div className="flex flex-col gap-3 mb-4 md:mb-6">
        
        {/* Fila 1: Título y Botón Principal */}
        <div className="flex justify-between items-center">
          <p className="text-[11px] md:text-sm text-gray-500 font-bold px-1 uppercase tracking-wider">
             {esVistaGlobal ? 'Directorio Global' : `Directorio de: ${sucursalActiva?.nombre || 'Ninguna'}`}
          </p>
          {sucursalActiva && tienePermisoEditar && (
            <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 md:py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md hover:bg-blue-700 transition-all active:scale-95 text-xs md:text-sm shrink-0">
              <Plus size={16} /> <span className="hidden sm:inline">Nuevo Proveedor</span><span className="sm:hidden">Nuevo</span>
            </button>
          )}
        </div>

        {/* Fila 2: Buscador y Filtro (Ocupando todo el ancho) */}
        {sucursalActiva && (
          <div className="flex gap-2 w-full">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input type="text" placeholder="Buscar por Razón Social o RUC..." className="w-full bg-white border border-gray-200 pl-9 pr-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-bold text-gray-800 text-xs md:text-sm transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             </div>
             <select className="bg-white border border-gray-200 px-3 py-2.5 rounded-xl outline-none font-bold text-gray-700 text-xs md:text-sm shadow-sm shrink-0" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
               <option value="activos">Activos</option>
               <option value="inactivos">Papelera</option>
               <option value="todos">Todos</option>
             </select>
          </div>
        )}
      </div>

      {/* ✨ VISTA TÁCTIL (Móvil y Tablet hasta breakpoint lg) ✨ */}
      <div className="lg:hidden flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
             <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
             <p className="text-xs font-medium">Cargando proveedores...</p>
          </div>
        ) : !sucursalActiva ? (
          <div className="text-center py-10 text-xs text-red-500 bg-red-50 rounded-2xl border border-red-100">
            ⚠️ Sin sucursal asignada.
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center">
            <Building2 size={48} className="text-gray-200 mb-3" strokeWidth={1.5}/>
            <p className="text-sm font-bold text-gray-600">No se encontraron proveedores</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {filtrados.map((prov) => (
              <div key={prov.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm relative group overflow-hidden">
                 <div className="flex justify-between items-start mb-3 border-b border-dashed border-gray-100 pb-3">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <span className="font-black text-lg uppercase">{prov.razon_social.charAt(0)}</span>
                       </div>
                       <div>
                         <p className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{prov.razon_social}</p>
                         <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mt-0.5">RUC: {prov.ruc || 'S/C'}</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Phone size={12} className="text-emerald-500 shrink-0"/>
                      <span className="text-[10px] font-bold text-gray-600 truncate">{prov.telefono || 'Sin celular'}</span>
                    </div>
                    {esAdmin && (
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Store size={12} className={prov.sucursal_id ? "text-purple-400 shrink-0" : "text-red-400 shrink-0"}/>
                        <span className={`text-[9px] font-bold truncate px-1.5 py-0.5 rounded ${prov.sucursal_id ? "text-purple-700 bg-purple-100/50" : "text-red-600 bg-red-100/50"}`}>
                          {prov.sucursal_id ? prov.sucursal_nombre : 'Sin asignar'}
                        </span>
                      </div>
                    )}
                 </div>

                 <div className="flex gap-2">
                   <button onClick={() => setModalDetalles(prov)} className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-100 flex items-center justify-center transition-colors">
                     <Eye size={16}/>
                   </button>
                   {tienePermisoEditar && (
                     <>
                       <button onClick={() => openModal(prov)} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs hover:bg-blue-100 flex items-center justify-center transition-colors">
                         <Edit size={16}/>
                       </button>
                       {prov.estado && (
                         <button onClick={() => {setProvToDelete(prov); setDeleteModalOpen(true);}} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors">
                           <Trash2 size={16}/>
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

      {/* ✨ VISTA PC: Tabla de Proveedores (Solo visible en pantallas grandes lg) ✨ */}
      <div className="hidden lg:block bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)] custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold tracking-wider text-[10px] sticky top-0 z-10 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Razón Social</th>
                <th className="px-6 py-4">RUC</th>
                {esAdmin && <th className="px-6 py-4">Ubicación</th>}
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Email & Dirección</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? <tr><td colSpan={esAdmin?"6":"5"} className="text-center py-12 text-gray-400 font-medium">Cargando directorio...</td></tr> : 
               !sucursalActiva ? <tr><td colSpan={esAdmin?"6":"5"} className="text-center py-12 text-red-500 font-medium">⚠️ Sin sucursal asignada.</td></tr> :
               filtrados.length === 0 ? <tr><td colSpan={esAdmin?"6":"5"} className="text-center py-12 italic text-gray-400">No hay proveedores registrados.</td></tr> : 
               filtrados.map((prov) => (
                <tr key={prov.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 font-bold text-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                         {prov.razon_social.charAt(0)}
                      </div>
                      <span className="truncate max-w-[200px]" title={prov.razon_social}>{prov.razon_social}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-[10px] font-bold border border-gray-200 tracking-wider">{prov.ruc || 'S/D'}</span></td>
                  
                  {esAdmin && (
                    <td className="px-6 py-4">
                       <span className={`text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 w-max uppercase tracking-wider ${prov.sucursal_id ? 'text-purple-700 bg-purple-50 border border-purple-100' : 'text-red-600 bg-red-50 border border-red-100'}`}>
                         <Store size={10}/> {prov.sucursal_id ? prov.sucursal_nombre : 'Sin Asignar'}
                       </span>
                    </td>
                  )}

                  <td className="px-6 py-4 font-bold text-slate-700 flex items-center gap-1.5 mt-2"><Phone size={12} className="text-emerald-500"/> {prov.telefono || '---'}</td>
                  <td className="px-6 py-4">
                    <p className="truncate text-blue-600 text-xs font-bold mb-0.5 max-w-[150px]">{prov.email || 'Sin correo'}</p>
                    <p className="truncate text-gray-400 text-[10px] font-medium max-w-[150px]" title={prov.direccion}>{prov.direccion || 'Sin dirección'}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {/* ✨ FIX: Botones SIEMPRE visibles en PC, sin efecto opacity-0 ✨ */}
                    <div className="flex justify-center gap-1.5 transition-opacity">
                      <button onClick={() => setModalDetalles(prov)} className="p-1.5 text-slate-500 bg-slate-50 hover:bg-slate-200 rounded-lg transition-colors" title="Ver Detalles"><Eye size={14} /></button>
                      {tienePermisoEditar && (
                        <>
                          <button onClick={() => openModal(prov)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Editar"><Edit size={14} /></button>
                          {prov.estado && <button onClick={() => {setProvToDelete(prov); setDeleteModalOpen(true);}} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Eliminar"><Trash2 size={14} /></button>}
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

      {/* MODAL DETALLES (Bottom Sheet Móvil) */}
      {modalDetalles && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-white p-6 sm:p-8 rounded-t-3xl sm:rounded-[2rem] w-full sm:max-w-sm shadow-2xl border border-white/50 animate-fade-in-up pb-8">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
              <h2 className="text-lg md:text-xl font-extrabold text-gray-800 flex items-center gap-2"><Building2 className="text-blue-600"/> Ficha Proveedor</h2>
              <button onClick={() => setModalDetalles(null)} className="text-gray-400 hover:text-gray-800 bg-gray-50 p-1.5 rounded-full"><X size={18}/></button>
            </div>
            <div className="space-y-4">
               <div>
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Razón Social</label>
                 <p className="text-base md:text-lg font-black text-gray-800 leading-tight">{modalDetalles.razon_social}</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">RUC</label>
                   <p className="text-sm font-bold text-gray-700">{modalDetalles.ruc || 'N/A'}</p>
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Teléfono</label>
                   <p className="text-sm font-bold text-gray-700 flex items-center gap-1"><Phone size={12} className="text-emerald-500"/> {modalDetalles.telefono || 'N/A'}</p>
                 </div>
               </div>
               <div>
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Correo Electrónico</label>
                 <p className="text-sm font-bold text-blue-600 flex items-center gap-1"><Mail size={12}/> {modalDetalles.email || 'N/A'}</p>
               </div>
               <div>
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Dirección Físicia</label>
                 <p className="text-sm font-bold text-gray-700 flex items-start gap-1"><MapPin size={12} className="mt-1 shrink-0 text-red-500"/> {modalDetalles.direccion || 'N/A'}</p>
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

      {/* MODAL CREAR / EDITAR PROVEEDOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-white p-5 sm:p-8 rounded-t-3xl sm:rounded-[2rem] w-full sm:max-w-lg shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>
            
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3 shrink-0">
               <h2 className="text-lg md:text-xl font-extrabold text-gray-800 flex items-center gap-2">{isEditing ? <Edit className="text-blue-600" size={20}/> : <Building2 className="text-blue-600" size={20}/>} {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
               <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-50 p-1.5 rounded-full"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto custom-scrollbar pb-4 px-1">
              <div>
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block mb-1">Razón Social / Nombre *</label>
                <input className={`w-full bg-slate-50 border p-3 rounded-xl focus:bg-white outline-none font-bold text-gray-800 text-sm transition-colors ${formErrors.razon_social ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`} value={formData.razon_social ?? ''} onChange={(e) => {setFormData({...formData, razon_social: e.target.value}); if (formErrors.razon_social) setFormErrors({...formErrors, razon_social: null}); }} autoFocus/>
                {formErrors.razon_social && <p className="text-[10px] text-red-500 mt-1 font-bold">{formErrors.razon_social}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block mb-1">RUC</label>
                  <input type="text" inputMode="numeric" className={`w-full bg-slate-50 border p-3 rounded-xl focus:bg-white outline-none font-bold text-gray-800 tracking-wider text-sm transition-colors ${formErrors.ruc ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`} value={formData.ruc ?? ''} onChange={(e) => { setFormData({...formData, ruc: e.target.value.replace(/\D/g, '').slice(0, 11)}); if (formErrors.ruc) setFormErrors({...formErrors, ruc: null}); }} placeholder="11 dígitos"/>
                  {formErrors.ruc && <p className="text-[9px] text-red-500 mt-1 font-bold leading-tight">{formErrors.ruc}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block mb-1">Teléfono</label>
                  <input type="text" inputMode="numeric" className={`w-full bg-slate-50 border p-3 rounded-xl focus:bg-white outline-none font-bold text-gray-800 tracking-wider text-sm transition-colors ${formErrors.telefono ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`} value={formData.telefono ?? ''} onChange={(e) => { setFormData({...formData, telefono: e.target.value.replace(/\D/g, '').slice(0, 9)}); if (formErrors.telefono) setFormErrors({...formErrors, telefono: null}); }} placeholder="9 dígitos"/>
                  {formErrors.telefono && <p className="text-[9px] text-red-500 mt-1 font-bold leading-tight">{formErrors.telefono}</p>}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block mb-1">Correo Electrónico</label>
                <input type="email" className={`w-full bg-slate-50 border p-3 rounded-xl focus:bg-white outline-none font-bold text-gray-700 text-sm transition-colors ${formErrors.email ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`} value={formData.email ?? ''} onChange={(e) => {setFormData({...formData, email: e.target.value}); if (formErrors.email) setFormErrors({...formErrors, email: null}); }} placeholder="ejemplo@empresa.com"/>
                {formErrors.email && <p className="text-[9px] text-red-500 mt-1 font-bold leading-tight">{formErrors.email}</p>}
              </div>
              
              <div>
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block mb-1">Dirección Física</label>
                <input className="w-full bg-slate-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none font-bold text-gray-700 text-sm transition-colors" value={formData.direccion ?? ''} onChange={(e) => setFormData({...formData, direccion: e.target.value})} placeholder="Av. Central 123"/>
              </div>

              {esAdmin && (
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block mb-1 mt-2">Afiliar a Sede *</label>
                  <select className={`w-full bg-slate-50 border p-3 rounded-xl focus:bg-white outline-none font-bold text-gray-700 text-sm transition-colors ${formErrors.sucursal_id ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`} value={formData.sucursal_id} onChange={e => {setFormData({...formData, sucursal_id: e.target.value}); if(formErrors.sucursal_id) setFormErrors({...formErrors, sucursal_id: null})}}>
                    <option value="">-- Selecciona una Sede --</option>
                    {sucursales.map(suc => <option key={suc.id} value={suc.id}>{suc.nombre}</option>)}
                  </select>
                  {formErrors.sucursal_id && <p className="text-[9px] text-red-500 mt-1 font-bold leading-tight">{formErrors.sucursal_id}</p>}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors text-sm">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all text-sm flex items-center justify-center gap-1.5"><CheckCircle size={16}/> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* MODAL ELIMINAR */}
      {deleteModalOpen && provToDelete && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-[2rem] p-6 md:p-8 w-full sm:max-w-sm text-center shadow-2xl animate-fade-in-up pb-8">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 border-4 border-red-100 mb-4 text-red-500 shadow-inner">
              <AlertTriangle size={32}/>
            </div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">¿Eliminar Proveedor?</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed">
              Desactivarás a <strong className="text-gray-800">"{provToDelete.razon_social}"</strong> de la base de datos.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors text-sm">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 text-sm">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
export default Proveedores;