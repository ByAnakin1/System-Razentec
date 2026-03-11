import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Plus, Edit, Trash2, X, AlertTriangle, Search, CheckCircle, Info, Building2, Eye, Store } from 'lucide-react';

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

  // ✨ COMPROBACIÓN DE PERMISOS
  const [usuarioActual, setUsuarioActual] = useState(JSON.parse(localStorage.getItem('usuario') || '{}'));
  const esAdmin = usuarioActual.rol === 'Administrador';

  const getCategoriasSeguras = () => {
    try {
      let cat = usuarioActual?.categorias;
      if (typeof cat === 'string') cat = JSON.parse(cat);
      if (typeof cat === 'string') cat = JSON.parse(cat); // Doble parseo preventivo
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
    <Layout>
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg text-white animate-fade-in-down ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
          <p className="font-semibold">{toast.message}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Building2 size={28} className="text-blue-600"/> Proveedores</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">{esVistaGlobal ? 'Administrando proveedores globales' : `Viendo proveedores de: ${sucursalActiva?.nombre || '...'}`}</p>
        </div>
        
        {sucursalActiva && (
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Buscar por nombre o RUC..." className="w-full border p-2 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select className="border p-2 rounded-lg outline-none cursor-pointer font-medium bg-white" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="activos">Activos</option><option value="inactivos">Papelera</option><option value="todos">Todos</option>
            </select>
            {/* ✨ SOLO MUESTRA BOTÓN CREAR SI TIENE PERMISO */}
            {tienePermisoEditar && (
              <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
                <Plus size={20} /> Nuevo
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)]">
          <table className="w-full text-left text-sm text-gray-600 table-fixed">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 w-[25%]">Razón Social</th>
                <th className="px-4 py-3 w-[15%]">Documento (RUC)</th>
                {esAdmin && <th className="px-4 py-3 w-[15%]">Ubicación</th>}
                <th className="px-4 py-3 w-[15%]">Contacto</th>
                <th className="px-4 py-3 w-[25%]">Email & Dirección</th>
                <th className="px-4 py-3 text-center w-[15%]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? <tr><td colSpan={esAdmin?"6":"5"} className="text-center p-8 text-gray-500">Cargando...</td></tr> : 
               !sucursalActiva ? <tr><td colSpan={esAdmin?"6":"5"} className="text-center py-10 text-red-500 font-medium bg-red-50">⚠️ No se ha detectado sucursal.</td></tr> :
               filtrados.length === 0 ? <tr><td colSpan={esAdmin?"6":"5"} className="text-center p-12 text-gray-400">No hay proveedores registrados en esta sede.</td></tr> : 
               filtrados.map((prov) => (
                <tr key={prov.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900 truncate" title={prov.razon_social}>{prov.razon_social}</td>
                  <td className="px-4 py-3"><span className="bg-gray-100 border text-gray-600 px-2 py-1 rounded-md text-xs font-bold">{prov.ruc || 'S/D'}</span></td>
                  
                  {esAdmin && (
                    <td className="px-4 py-3">
                       <span className={`text-[10px] font-bold px-2 py-1 rounded ${prov.sucursal_id ? 'text-blue-700 bg-blue-50 border border-blue-100' : 'text-red-700 bg-red-50 border border-red-100'}`}>
                         {prov.sucursal_id ? prov.sucursal_nombre : '⚠️ Sin Sucursal (Editar)'}
                       </span>
                    </td>
                  )}

                  <td className="px-4 py-3 truncate">{prov.telefono || '-'}</td>
                  <td className="px-4 py-3"><p className="truncate text-blue-600 text-xs font-medium">{prov.email || 'Sin correo'}</p><p className="truncate text-gray-400 text-[10px] mt-0.5">{prov.direccion || 'Sin dirección'}</p></td>
                  <td className="px-4 py-3 flex justify-center gap-2">
                    <button onClick={() => setModalDetalles(prov)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" title="Ver Detalles"><Eye size={18} /></button>
                    {/* ✨ SOLO MUESTRA ACCIONES DE EDICIÓN SI TIENE PERMISO */}
                    {tienePermisoEditar && (
                      <>
                        <button onClick={() => openModal(prov)} className="text-yellow-600 hover:bg-yellow-50 p-1.5 rounded transition-colors" title="Editar"><Edit size={18} /></button>
                        {prov.estado && <button onClick={() => {setProvToDelete(prov); setDeleteModalOpen(true);}} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors" title="Eliminar"><Trash2 size={18} /></button>}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalDetalles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl border border-white/50 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2"><Building2 className="text-blue-600"/> Ficha Proveedor</h2>
              <button onClick={() => setModalDetalles(null)} className="text-gray-400 hover:text-gray-800 bg-gray-100 p-1.5 rounded-full"><X size={20}/></button>
            </div>
            <div className="space-y-4">
               <div><label className="text-[10px] font-bold text-gray-500 uppercase block">Razón Social</label><p className="text-lg font-black text-gray-800">{modalDetalles.razon_social}</p></div>
               <div><label className="text-[10px] font-bold text-gray-500 uppercase block">RUC</label><p className="font-medium text-gray-700">{modalDetalles.ruc || 'N/A'}</p></div>
               <div><label className="text-[10px] font-bold text-gray-500 uppercase block">Pertenece a:</label>
                 <div className="mt-1 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 font-bold text-sm">
                   <Store size={14}/> {modalDetalles.sucursal_id ? modalDetalles.sucursal_nombre : '⚠️ Requiere Asignación del Administrador'}
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl animate-fade-in-up">
            <div className="flex justify-between mb-6 border-b pb-3">
               <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">{isEditing ? <Edit className="text-blue-600"/> : <Building2 className="text-blue-600"/>} {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
               <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full"><X/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Razón Social / Nombre *</label><input className={`w-full border p-3 rounded-xl outline-none focus:ring-2 ${formErrors.razon_social ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`} value={formData.razon_social ?? ''} onChange={(e) => setFormData({...formData, razon_social: e.target.value})} />{formErrors.razon_social && <p className="text-red-500 text-xs mt-1">{formErrors.razon_social}</p>}</div>
              <div className="flex gap-4">
                <div className="w-1/2"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Documento (RUC)</label><input maxLength={11} className={`w-full border p-3 rounded-xl mt-1 outline-none focus:ring-2 ${formErrors.ruc ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`} value={formData.ruc ?? ''} onChange={(e) => setFormData({...formData, ruc: e.target.value.replace(/\D/g, '')})} />{formErrors.ruc && <p className="text-red-500 text-xs mt-1">{formErrors.ruc}</p>}</div>
                <div className="w-1/2"><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Teléfono de contacto</label><input maxLength={9} className={`w-full border p-3 rounded-xl mt-1 outline-none focus:ring-2 ${formErrors.telefono ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`} value={formData.telefono ?? ''} onChange={(e) => setFormData({...formData, telefono: e.target.value.replace(/\D/g, '')})} />{formErrors.telefono && <p className="text-red-500 text-xs mt-1">{formErrors.telefono}</p>}</div>
              </div>
              <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Correo Electrónico</label><input type="email" className="w-full border p-3 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500" value={formData.email ?? ''} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase block mb-1">Dirección Física</label><input className="w-full border p-3 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500" value={formData.direccion ?? ''} onChange={(e) => setFormData({...formData, direccion: e.target.value})} /></div>

              {esAdmin && (
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Asignar a Sucursal *</label>
                  <select className={`w-full border p-3 rounded-xl outline-none font-bold text-gray-700 bg-white focus:ring-2 ${formErrors.sucursal_id ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`} value={formData.sucursal_id} onChange={e => {setFormData({...formData, sucursal_id: e.target.value}); if(formErrors.sucursal_id) setFormErrors({...formErrors, sucursal_id: null})}}>
                    <option value="">-- Selecciona una Sucursal --</option>
                    {sucursales.map(suc => <option key={suc.id} value={suc.id}>{suc.nombre}</option>)}
                  </select>
                  {formErrors.sucursal_id && <p className="text-red-500 text-xs mt-1">{formErrors.sucursal_id}</p>}
                </div>
              )}

              <div className="flex gap-3 mt-6 pt-4 border-t"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-colors">Guardar</button></div>
            </form>
          </div>
        </div>
      )}
      
      {deleteModalOpen && provToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-fade-in-up">
              <div className="mx-auto w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={32}/></div>
              <h3 className="text-xl font-extrabold mb-2 text-gray-800">¿Eliminar Proveedor?</h3>
              <p className="text-sm text-gray-500 mb-6">Desactivarás al proveedor <strong>"{provToDelete.razon_social}"</strong>.</p>
              <div className="flex gap-3">
                 <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-3 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
                 <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/30 transition-colors">Sí, Eliminar</button>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};
export default Proveedores;