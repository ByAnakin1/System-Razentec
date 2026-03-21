import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Plus, Edit, Trash2, X, Tags, AlertTriangle, Eye, Store, ChevronDown, Package, Image as ImageIcon, Search } from 'lucide-react';

// Utilidad CSS para esconder scrollbars en navegadores manteniendo funcionalidad
const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const Categorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [puedeModificar, setPuedeModificar] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [modalDetalles, setModalDetalles] = useState(false); 
  
  const [formData, setFormData] = useState({ id: null, nombre: '', sucursal_id: '' });
  const [catSeleccionada, setCatSeleccionada] = useState(null);

  const [productosCat, setProductosCat] = useState([]);
  const [loadingProd, setLoadingProd] = useState(false);

  const [busquedaCategoria, setBusquedaCategoria] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');

  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);
  const esVistaGlobal = sucursalActiva?.id === 'ALL';

  const baseURL = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:3000';
  const renderImagen = (path) => {
    if (!path) return null;
    if (path.startsWith('data:image') || path.startsWith('http')) return path;
    return `${baseURL}${path}`;
  };

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
      setFormData({ id: null, nombre: '', sucursal_id: esVistaGlobal ? '' : sucursalActiva?.id || '' });
    }
    setModalOpen(true);
  };

  const handleOpenDetalles = async (cat) => {
    setCatSeleccionada(cat);
    setBusquedaProducto('');
    setModalDetalles(true);
    setLoadingProd(true);
    try {
      const res = await api.get('/productos?estado=activos');
      const prodsFiltrados = res.data.filter(p => p.categoria_id === cat.id);
      setProductosCat(prodsFiltrados);
    } catch (err) {
      console.error("Error al cargar productos", err);
      setProductosCat([]);
    } finally {
      setLoadingProd(false);
    }
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

  const categoriasFiltradas = categorias.filter(cat => 
    cat.nombre.toLowerCase().includes(busquedaCategoria.toLowerCase())
  );

  const productosCatFiltrados = productosCat.filter(prod => 
    (prod.nombre || '').toLowerCase().includes(busquedaProducto.toLowerCase()) ||
    (prod.codigo || '').toLowerCase().includes(busquedaProducto.toLowerCase())
  );

  return (
    <Layout title="Categorías" moduleIcon={<Tags/>}>
      
      <p className="text-[11px] md:text-sm text-gray-500 dark:text-blue-300/70 font-bold px-1 uppercase tracking-wider mb-3 md:mb-4 transition-colors">
        {esVistaGlobal ? 'Administración Global' : `Sede: ${sucursalActiva?.nombre || 'Ninguna'}`}
      </p>

      {/* ✨ CABECERA CON BUSCADOR PRINCIPAL Y BOTÓN (LIQUID GLASS) ✨ */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        
        <div className="w-full sm:w-1/2 lg:w-1/3 relative">
          <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-blue-400/70" size={18}/>
          <input 
            type="text" 
            placeholder="Buscar categoría..." 
            className="w-full bg-white/80 dark:bg-blue-950/50 backdrop-blur-md border border-gray-200/80 dark:border-white/10 pl-10 pr-4 py-2.5 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 text-gray-800 dark:text-white transition-all shadow-sm" 
            value={busquedaCategoria} 
            onChange={e => setBusquedaCategoria(e.target.value)} 
          />
        </div>
        
        {puedeModificar && sucursalActiva && (
          <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-blue-600/90 dark:bg-blue-600 text-white px-5 py-3 sm:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 backdrop-blur-md border border-white/10 hover:bg-blue-700 transition-all active:scale-95 shrink-0 text-xs md:text-sm">
            <Plus size={18} /> <span className="sm:hidden lg:inline">Nueva Categoría</span><span className="hidden sm:inline lg:hidden">Nuevo</span>
          </button>
        )}
      </div>

      {/* ✨ VISTA LISTA MÓVILES (LIQUID GLASS) ✨ */}
      <div className="md:hidden flex flex-col gap-3">
        {loading ? <p className="text-center py-10 text-xs font-medium text-gray-500 dark:text-gray-400">Cargando categorías...</p> : 
         !sucursalActiva ? <p className="text-center py-10 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500/20 border rounded-xl backdrop-blur-md">⚠️ Sin sucursal asignada.</p> :
         categoriasFiltradas.length === 0 ? <p className="text-center py-10 text-xs italic text-gray-400 dark:text-slate-500">No se encontraron categorías.</p> :
         categoriasFiltradas.map((cat) => (
          <div key={cat.id} className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-xl rounded-[1.5rem] border border-gray-100/50 dark:border-white/5 p-4 flex items-center justify-between shadow-sm relative overflow-hidden group transition-colors">
             <div className="flex flex-col gap-1 w-[60%]">
               <h3 className="font-bold text-gray-800 dark:text-white text-sm truncate flex items-center gap-2 transition-colors">
                 <Tags size={16} className="text-gray-400 dark:text-slate-500 shrink-0"/> {cat.nombre}
               </h3>
               {esVistaGlobal && (
                 <span className="text-[9px] font-bold text-purple-700 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-900/30 backdrop-blur-md border border-purple-100/50 dark:border-purple-500/20 px-2 py-0.5 rounded-md w-fit truncate max-w-full transition-colors">
                   {cat.sucursal_nombre || 'Global'}
                 </span>
               )}
             </div>
             
             <div className="flex gap-1.5 shrink-0">
               <button onClick={() => handleOpenDetalles(cat)} className="p-2 bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 rounded-lg active:scale-95 border border-transparent dark:border-white/5 backdrop-blur-md transition-colors"><Eye size={16}/></button>
               {puedeModificar && (
                 <>
                   <button onClick={() => handleOpenModal(cat)} className="p-2 bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg active:scale-95 border border-transparent dark:border-blue-500/20 backdrop-blur-md transition-colors"><Edit size={16}/></button>
                   <button onClick={() => { setCatSeleccionada(cat); setModalEliminar(true); }} className="p-2 bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg active:scale-95 border border-transparent dark:border-red-500/20 backdrop-blur-md transition-colors"><Trash2 size={16}/></button>
                 </>
               )}
             </div>
          </div>
         ))}
      </div>

      {/* ✨ VISTA TABLA PC (LIQUID GLASS) ✨ */}
      <div className="hidden md:block bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/80 dark:border-white/5 overflow-hidden transition-colors duration-300">
        <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300 transition-colors">
          <thead className="bg-slate-50/50 dark:bg-blue-950/30 text-slate-500 dark:text-blue-300 uppercase font-extrabold tracking-widest text-[11px] border-b border-gray-200/50 dark:border-white/5 transition-colors">
            <tr>
              <th className="px-6 py-5">Nombre de Categoría</th>
              {esVistaGlobal && <th className="px-6 py-5">Sucursal Asignada</th>}
              <th className="px-6 py-5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/50 dark:divide-white/5 relative">
            {loading ? <tr><td colSpan={esVistaGlobal ? "3" : "2"} className="text-center py-10 font-medium">Cargando...</td></tr> : 
             !sucursalActiva ? <tr><td colSpan={esVistaGlobal ? "3" : "2"} className="text-center py-10 text-gray-400 font-medium">⚠️ Sin sucursal autorizada.</td></tr> :
             categoriasFiltradas.length === 0 ? <tr><td colSpan={esVistaGlobal ? "3" : "2"} className="text-center py-10 font-medium text-gray-400">No se encontraron resultados.</td></tr> :
             categoriasFiltradas.map((cat) => (
             <tr key={cat.id} className="hover:bg-white/40 dark:hover:bg-blue-900/10 transition-colors duration-200">
               <td className="px-6 py-5 font-bold text-gray-800 dark:text-white flex items-center gap-3 transition-colors"><Tags size={18} className="text-gray-400 dark:text-slate-500"/> {cat.nombre}</td>
               
               {esVistaGlobal && (
                 <td className="px-6 py-5">
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-900/30 border border-purple-100/50 dark:border-purple-500/20 backdrop-blur-md px-2.5 py-1 rounded-md transition-colors">
                      {cat.sucursal_nombre || 'No Asignada (Global)'}
                    </span>
                 </td>
               )}

               <td className="px-6 py-5">
                 <div className="flex justify-center gap-2">
                   <button onClick={() => handleOpenDetalles(cat)} className="p-2 bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-transparent dark:border-white/5 backdrop-blur-md" title="Ver Productos"><Eye size={16}/></button>
                   {puedeModificar && (
                     <>
                       <button onClick={() => handleOpenModal(cat)} className="p-2 bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-transparent dark:border-blue-500/20 backdrop-blur-md"><Edit size={16}/></button>
                       <button onClick={() => { setCatSeleccionada(cat); setModalEliminar(true); }} className="p-2 bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors border border-transparent dark:border-red-500/20 backdrop-blur-md"><Trash2 size={16}/></button>
                     </>
                   )}
                 </div>
               </td>
             </tr>
           ))}
          </tbody>
        </table>
      </div>

      {/* ✨ MODAL DETALLES PRODUCTOS (MINI-CATÁLOGO LIQUID GLASS) ✨ */}
      {modalDetalles && catSeleccionada && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md transition-colors duration-300 animate-fade-in">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl p-5 sm:p-8 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full sm:max-w-2xl shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh] border border-white/50 dark:border-white/10 transition-colors">
            
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>
            
            <div className="flex justify-between items-center mb-5 border-b border-gray-100/50 dark:border-white/5 pb-4 shrink-0 transition-colors">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                  <Tags className="text-blue-600 dark:text-blue-400" size={20}/> {catSeleccionada.nombre}
                </h2>
                <p className="text-[10px] text-gray-500 dark:text-blue-300/70 font-bold mt-1.5 uppercase tracking-widest">
                  {catSeleccionada.sucursal_nombre || 'Categoría Global'}
                </p>
              </div>
              <button onClick={() => setModalDetalles(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors border border-transparent dark:border-white/5"><X size={18}/></button>
            </div>

            <div className="mb-4 shrink-0 relative">
               <Search className="absolute left-3 top-3 text-gray-400 dark:text-blue-400/70" size={16}/>
               <input 
                  type="text" 
                  placeholder="Buscar producto o SKU en esta categoría..." 
                  className="w-full bg-slate-50/80 dark:bg-blue-950/50 border border-gray-200/80 dark:border-white/10 pl-10 pr-4 py-2.5 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-gray-800 dark:text-white transition-all shadow-sm" 
                  value={busquedaProducto} 
                  onChange={e => setBusquedaProducto(e.target.value)} 
               />
            </div>

            {/* LISTA PRODUCTOS - SCROLL OCULTO PERO FUNCIONAL */}
            <div className={`overflow-y-auto flex-1 pb-2 ${hideScrollbar}`}>
              <h3 className="text-[10px] font-black text-gray-500 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Package size={14}/> Productos en esta categoría ({productosCatFiltrados.length})
              </h3>

              {loadingProd ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-xs font-medium text-gray-500 dark:text-slate-400">Cargando productos...</p>
                </div>
              ) : productosCatFiltrados.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100/50 dark:border-white/5 transition-colors">
                  <Package size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3 stroke-[1.5]"/>
                  <p className="text-sm font-bold text-gray-600 dark:text-slate-300">No se encontraron productos</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Intenta con otra búsqueda.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {productosCatFiltrados.map(prod => {
                    const stockVisual = parseInt(prod.stock || 0);
                    return (
                      <div key={prod.id} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-900/50 border border-gray-100/50 dark:border-white/5 rounded-2xl shadow-sm hover:border-blue-200 dark:hover:border-blue-500/50 transition-colors">
                         <div className="w-14 h-14 bg-white/50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-white/5 overflow-hidden backdrop-blur-md">
                            {prod.imagen ? <img src={renderImagen(prod.imagen)} alt={prod.nombre} className="w-full h-full object-cover"/> : <ImageIcon size={20} className="text-gray-300 dark:text-slate-500"/>}
                         </div>
                         <div className="flex-1 min-w-0">
                           <h4 className="text-xs font-bold text-gray-800 dark:text-white truncate transition-colors" title={prod.nombre}>{prod.nombre}</h4>
                           <p className="text-[9px] text-gray-400 dark:text-blue-300/70 font-extrabold tracking-wider uppercase mt-1 transition-colors">{prod.codigo || 'SIN CÓDIGO'}</p>
                         </div>
                         <div className="text-right shrink-0">
                           <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 transition-colors">S/ {parseFloat(prod.precio).toFixed(2)}</p>
                           <p className={`text-[9px] font-bold inline-block px-2 py-0.5 rounded-md mt-1 backdrop-blur-md border ${stockVisual > 0 ? 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-transparent dark:border-white/5' : 'bg-red-100/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-transparent dark:border-red-500/20'}`}>
                             Stock: {stockVisual}
                           </p>
                         </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✨ MODAL CREAR / EDITAR CATEGORIA (LIQUID GLASS) ✨ */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md transition-colors duration-300 animate-fade-in">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl p-6 sm:p-8 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full sm:max-w-sm shadow-2xl animate-fade-in-up border border-white/50 dark:border-white/10 transition-colors">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden"></div>
            
            <div className="flex justify-between items-center mb-6 border-b border-gray-100/50 dark:border-white/5 pb-4 transition-colors">
              <h2 className="text-lg sm:text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                {formData.id ? <Edit className="text-blue-600 dark:text-blue-400"/> : <Plus className="text-blue-600 dark:text-blue-400"/>} 
                {formData.id ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700 p-1.5 rounded-full transition-colors border border-transparent dark:border-white/5"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block">Nombre de etiqueta *</label>
                <input placeholder="Ej: Laptops, Audífonos..." value={formData.nombre} onChange={e=>setFormData({...formData, nombre: e.target.value})} className="w-full border border-gray-200/80 dark:border-white/10 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold text-gray-800 dark:text-white bg-white/70 dark:bg-blue-950/30 transition-all shadow-sm" required autoFocus/>
              </div>

              {esVistaGlobal && (
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block">Asignar a Sucursal</label>
                  <CustomDropdown 
                    value={formData.sucursal_id}
                    onChange={val => setFormData({...formData, sucursal_id: val})}
                    options={[
                        {value: '', label: '-- Global (Todas) --'},
                        ...sucursales.map(c => ({value: c.id, label: c.nombre}))
                    ]}
                    placeholder="Elige una sucursal"
                    className="w-full h-[50px] bg-white/70 dark:bg-blue-950/30 border-gray-200/80 dark:border-white/10 shadow-sm text-sm font-bold"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100/50 dark:border-white/5">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3.5 border border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-300 rounded-xl font-extrabold hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm backdrop-blur-md shadow-sm">Cancelar</button>
                <button type="submit" className="flex-1 py-3.5 bg-blue-600/90 dark:bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 text-sm border border-white/10 backdrop-blur-md">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✨ MODAL ELIMINAR (LIQUID GLASS) ✨ */}
      {modalEliminar && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md transition-colors duration-300 animate-fade-in">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl p-6 sm:p-8 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full sm:max-w-sm text-center shadow-2xl animate-fade-in-up border border-white/50 dark:border-white/10 transition-colors">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
            <div className="mx-auto w-16 h-16 bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4 border border-red-100 dark:border-red-500/20 backdrop-blur-md">
              <Trash2 size={28}/>
            </div>
            <h3 className="text-lg md:text-xl font-black text-gray-800 dark:text-white mb-2 transition-colors">¿Eliminar Categoría?</h3>
            <p className="text-xs md:text-sm text-gray-500 dark:text-blue-200/70 mb-8 font-medium leading-relaxed transition-colors">
              Se borrará la etiqueta <strong className="text-gray-800 dark:text-blue-100 font-black">"{catSeleccionada?.nombre}"</strong>. Los productos que la usan se quedarán sin categoría asignada.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalEliminar(false)} className="flex-1 py-3.5 bg-gray-100/80 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 rounded-xl font-extrabold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-sm border border-transparent dark:border-white/5 backdrop-blur-md">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-3.5 bg-red-600/90 text-white rounded-xl font-black hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-600/20 border border-red-500/50 text-sm">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

// ✨ CUSTOM DROPDOWN ADAPTADO A LIQUID GLASS MODO CLARO/OSCURO ✨
const CustomDropdown = ({ label, value, onChange, options, placeholder, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(option => option.value == value);
  const displayLabel = selectedOption ? selectedOption.label : (placeholder || label || "Seleccionar");

  return (
    <div className="relative w-full shrink-0 z-20" ref={dropdownRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between transition-all w-full bg-white/80 dark:bg-blue-950/40 backdrop-blur-md border border-gray-200/80 dark:border-white/10 rounded-xl px-3 md:px-4 text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm hover:bg-gray-50 dark:hover:bg-blue-950/60 ${className}`}
      >
        <span className="text-xs md:text-sm font-extrabold truncate">
          {label && <span className="text-gray-400 dark:text-blue-300/70 font-bold mr-1.5">{label}:</span>}
          {displayLabel}
        </span>
        <ChevronDown size={16} className={`text-gray-400 dark:text-slate-400 ml-2 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute mt-2 w-full min-w-[140px] md:min-w-[180px] rounded-2xl shadow-2xl border border-white/50 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl top-full left-0 overflow-hidden animate-fade-in-down z-50">
          <div className={`max-h-60 overflow-y-auto p-1.5 ${hideScrollbar}`}>
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors rounded-xl mb-0.5 last:mb-0 ${
                  value == option.value
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Categorias;