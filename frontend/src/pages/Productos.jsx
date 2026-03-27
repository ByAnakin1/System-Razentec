import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Package, Search, Plus, Edit, Trash2, X, List, Grid, AlertTriangle, TrendingUp, BarChart3, Store, UploadCloud, FileJson, Image as ImageIcon, Link as LinkIcon, ChevronDown, CheckCircle, ReceiptText } from 'lucide-react';

const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltradoEstado] = useState('activos');
  
  const [vista, setVista] = useState('galeria'); 
  const [tabActiva, setTabActiva] = useState('catalogo'); 
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImportarOpen, setModalImportarOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  
  const [viewModal, setViewModal] = useState({ open: false, producto: null });
  
  const [formData, setFormData] = useState({ id: null, nombre: '', descripcion: '', precio: '', codigo: '', categoria_id: '', imagen_url: '', stock_sucursales: {} });
  const [imagenFile, setImagenFile] = useState(null); 
  const [tipoImagen, setTipoImagen] = useState('archivo');
  
  const fileInputRef = useRef(null);

  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);
  const esVistaGlobal = sucursalActiva?.id === 'ALL';

  const baseURL = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:3000';
  
  const renderImagen = (path) => {
    if (!path) return null;
    if (path.startsWith('data:image') || path.startsWith('http')) return path;
    return `${baseURL}${path}`;
  };

  const fetchData = async () => {
    const currentSucursal = JSON.parse(localStorage.getItem('sucursalActiva'));
    if (!currentSucursal) {
      setProductos([]);
      setLoading(false);
      return; 
    }

    setLoading(true);
    try {
      const prodRes = await api.get(`/productos?estado=${filtroEstado}`);
      setProductos(prodRes.data);
      const catRes = await api.get('/categorias');
      setCategorias(catRes.data);
      try {
        const sucRes = await api.get('/sucursales');
        setSucursales(sucRes.data);
      } catch (e) {}
    } catch (err) { console.error(err); } finally { setLoading(false); }
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

  const convertirABase64 = (archivo) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(archivo);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || '',
        precio: formData.precio,
        codigo: formData.codigo || '',
        categoria_id: formData.categoria_id || null,
        stock_sucursales: JSON.stringify(formData.stock_sucursales)
      };

      if (tipoImagen === 'archivo' && imagenFile) {
        payload.imagen_url = await convertirABase64(imagenFile);
      } else if (tipoImagen === 'url' && formData.imagen_url) {
        payload.imagen_url = formData.imagen_url;
      }

      if (formData.id) {
        await api.put(`/productos/${formData.id}`, payload);
      } else {
        await api.post('/productos', payload);
      }
      
      setModalOpen(false);
      fetchData();
    } catch (err) { 
       console.error("Error al guardar:", err);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteModal({ open: true, id });
  };

  const confirmDelete = async () => {
    try { 
      await api.delete(`/productos/${deleteModal.id}`); 
      setDeleteModal({ open: false, id: null });
      fetchData(); 
    } catch (err) { 
      console.error(err); 
      setDeleteModal({ open: false, id: null });
    }
  };

  const abrirModal = (prod = null) => {
    if (prod) {
      let stockMap = {};
      let detalles = prod.inventario_detalle;
      if (typeof detalles === 'string') { try { detalles = JSON.parse(detalles); } catch(e) { detalles = []; } }
      if (Array.isArray(detalles)) {
        detalles.forEach(inv => { if (inv && inv.sucursal_id) stockMap[inv.sucursal_id] = inv.stock; });
      }
      setFormData({ 
        id: prod.id, nombre: prod.nombre || '', descripcion: prod.descripcion || '', precio: prod.precio || '', 
        codigo: prod.codigo || '', categoria_id: prod.categoria_id || '', 
        imagen_url: prod.imagen || '', stock_sucursales: stockMap
      });
      if (prod.imagen && prod.imagen.startsWith('http')) setTipoImagen('url');
      else setTipoImagen('archivo');
    } else {
      setFormData({ id: null, nombre: '', descripcion: '', precio: '', codigo: '', categoria_id: '', imagen_url: '', stock_sucursales: {} });
      setTipoImagen('archivo');
    }
    setImagenFile(null);
    setModalOpen(true);
  };

  const abrirModalVer = (prod) => {
    setViewModal({ open: true, producto: prod });
  };

  const handleStockChange = (sucursalId, value) => {
    setFormData(prev => ({ ...prev, stock_sucursales: { ...prev.stock_sucursales, [sucursalId]: value } }));
  };

  const handleImportJSON = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        await api.post('/productos/bulk', { productos: json }); 
        setModalImportarOpen(false);
        fetchData();
        alert("Productos importados con éxito");
      } catch (error) { 
        alert("Error al importar el JSON. Verifica el formato."); 
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const productosFiltrados = productos.filter(p => 
    (p.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) || 
    (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase())
  );
  
  const totalStock = productos.reduce((acc, p) => acc + parseInt(p.stock || 0), 0);
  const stockBajo = productos.filter(p => parseInt(p.stock || 0) < 5).length;

  return (
    <Layout title="Inventario" moduleIcon={<Package />}>
      
      {/* TABS Y SUCURSAL */}
      <div className="flex justify-between items-end mb-4 md:mb-6">
        <p className="text-[11px] md:text-sm text-gray-500 dark:text-blue-300/70 font-bold px-1 uppercase tracking-wider transition-colors">
            {esVistaGlobal ? 'Catálogo Global' : `Sede: ${sucursalActiva?.nombre || 'Ninguna'}`}
        </p>
        
        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-md p-1 rounded-xl border border-transparent dark:border-white/5 transition-colors">
          <button onClick={() => setTabActiva('catalogo')} className={`px-4 py-2 rounded-lg font-bold text-[10px] md:text-xs transition-all ${tabActiva === 'catalogo' ? 'btn-primary text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300'}`}>
            Catálogo
          </button>
          {esVistaGlobal && (
            <button onClick={() => setTabActiva('control')} className={`px-4 py-2 rounded-lg font-bold text-[10px] md:text-xs transition-all ${tabActiva === 'control' ? 'btn-primary text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300'}`}>
              Global
            </button>
          )}
        </div>
      </div>

      {tabActiva === 'catalogo' && (
        <div className="animate-fade-in">
          
          {/* CONTROLES */}
          <div className="flex flex-col gap-3 mb-6 md:mb-8 bg-white/60 dark:bg-blue-950/30 backdrop-blur-2xl p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] border border-white/80 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] relative z-20 transition-colors duration-300">
            
            <div className="flex gap-2 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-blue-400/70" size={18}/>
                <input 
                  type="text" 
                  placeholder="Buscar producto o SKU..." 
                  className="w-full bg-white/80 dark:bg-blue-950/50 border border-gray-200/80 dark:border-white/10 pl-10 pr-4 py-2 md:py-2.5 rounded-xl text-xs md:text-sm outline-none focus:ring-2 ring-primary text-gray-800 dark:text-white transition-all h-[42px] md:h-[44px] shadow-sm backdrop-blur-md" 
                  value={busqueda} 
                  onChange={e => setBusqueda(e.target.value)} 
                />
              </div>
              <button onClick={() => abrirModal()} className="h-[42px] md:h-[44px] px-5 btn-primary text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all text-xs md:text-sm shrink-0 border border-white/10 backdrop-blur-md">
                <Plus size={18}/> <span className="hidden sm:inline">Nuevo</span>
              </button>
            </div>

            <div className="flex justify-between items-center w-full gap-2">
              <CustomDropdown 
                value={filtroEstado}
                onChange={setFiltradoEstado}
                options={[
                    {value: 'activos', label: 'Activos'},
                    {value: 'inactivos', label: 'Inactivos'},
                    {value: 'todos', label: 'Todos'}
                ]}
                className="h-[40px] md:h-[42px] w-[140px] md:w-auto"
              />

              <div className="flex gap-2 items-center shrink-0">
                <button onClick={() => setModalImportarOpen(true)} className="h-[40px] md:h-[42px] w-[40px] sm:w-auto sm:px-4 bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold flex items-center justify-center gap-1.5 border border-emerald-200/50 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-all text-xs md:text-sm backdrop-blur-md shadow-sm" title="Importar JSON">
                  <UploadCloud size={16}/> <span className="hidden sm:inline">JSON</span>
                </button>
                
                <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-white/5 h-[40px] md:h-[42px] items-center backdrop-blur-md transition-colors">
                  <button onClick={() => setVista('tabla')} className={`p-1.5 md:p-2 rounded-lg transition-all ${vista === 'tabla' ? 'btn-primary shadow text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}><List size={16}/></button>
                  <button onClick={() => setVista('galeria')} className={`p-1.5 md:p-2 rounded-lg transition-all ${vista === 'galeria' ? 'btn-primary shadow text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}><Grid size={16}/></button>
                </div>
              </div>
            </div>

          </div>

          {vista === 'tabla' ? (
            <>
              {/* VISTA LISTA MÓVIL */}
              <div className="md:hidden flex flex-col gap-3">
                {loading ? (
                   // ✨ SKELETON LOADER MÓVIL ✨
                   [1,2,3,4].map(i => (
                    <div key={i} className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-xl rounded-[1.5rem] border border-gray-100/50 dark:border-white/5 p-3 flex items-stretch gap-3 shadow-sm animate-pulse">
                       <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700/50 rounded-xl shrink-0"></div>
                       <div className="flex-1 flex flex-col justify-between py-1">
                          <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-700/50 rounded mb-2"></div>
                          <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-700/50 rounded"></div>
                          <div className="flex justify-between mt-auto">
                             <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700/50 rounded"></div>
                             <div className="w-12 h-4 bg-slate-200 dark:bg-slate-700/50 rounded"></div>
                          </div>
                       </div>
                    </div>
                   ))
                ) : 
                 !sucursalActiva ? <p className="text-center py-10 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 dark:border dark:border-red-500/20 rounded-xl">⚠️ Sin sucursal asignada.</p> :
                 productosFiltrados.length === 0 ? <p className="text-center py-10 text-xs italic text-gray-400 dark:text-slate-500">No hay productos.</p> :
                 productosFiltrados.map((prod) => {
                  const stockVisual = parseInt(prod.stock || 0);
                  return (
                    <div 
                      key={prod.id} 
                      onClick={() => abrirModalVer(prod)}
                      className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-xl rounded-[1.5rem] border border-gray-100/50 dark:border-white/5 p-3 flex items-stretch gap-3 shadow-sm relative overflow-hidden transition-colors cursor-pointer hover:bg-white/80 dark:hover:bg-blue-900/30"
                    >
                       <div className="w-20 h-20 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-white/5 flex items-center justify-center shrink-0 overflow-hidden backdrop-blur-md">
                          {prod.imagen ? <img src={renderImagen(prod.imagen)} alt="prod" className="w-full h-full object-cover"/> : <ImageIcon size={24} className="text-gray-300 dark:text-slate-600"/>}
                       </div>
                       <div className="flex-1 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                               <h3 className="font-bold text-gray-800 dark:text-white text-xs leading-tight line-clamp-2">{prod.nombre}</h3>
                               <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => abrirModal(prod)} className="text-blue-500 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 p-1.5 rounded-lg backdrop-blur-md"><Edit size={12}/></button>
                                  <button onClick={() => handleDeleteClick(prod.id)} className="text-red-500 dark:text-red-400 bg-red-50/80 dark:bg-red-900/30 p-1.5 rounded-lg backdrop-blur-md"><Trash2 size={12}/></button>
                               </div>
                            </div>
                            <p className="text-[9px] font-bold text-gray-400 dark:text-blue-300/70 uppercase mt-0.5">{prod.codigo || 'SIN CÓDIGO'}</p>
                          </div>
                          <div className="flex justify-between items-end mt-1">
                             <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">S/ {parseFloat(prod.precio).toFixed(2)}</span>
                             <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md backdrop-blur-md ${stockVisual > 0 ? 'bg-slate-100/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-transparent dark:border-white/5' : 'bg-red-100/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-transparent dark:border-red-500/20'}`}>
                               Stock: {stockVisual}
                             </span>
                          </div>
                       </div>
                    </div>
                  )
                 })}
              </div>

              {/* VISTA TABLA PC */}
              <div className="hidden md:block bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/80 dark:border-white/5 overflow-hidden w-full transition-colors duration-300">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50/50 dark:bg-blue-950/30 text-slate-500 dark:text-blue-300 uppercase font-extrabold tracking-widest text-[10px] border-b border-gray-200/50 dark:border-white/5 transition-colors">
                      <tr>
                        <th className="px-6 py-5">Foto</th>
                        <th className="px-6 py-5">Código</th>
                        <th className="px-6 py-5">Producto</th>
                        <th className="px-6 py-5">Categoría</th> 
                        <th className="px-6 py-5 text-right">Precio</th>
                        <th className="px-6 py-5 text-center">Stock</th>
                        <th className="px-6 py-5 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/50 dark:divide-white/5 relative">
                      {loading ? (
                         // ✨ SKELETON LOADER TABLA PC ✨
                         [1,2,3,4].map(i => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-6 py-3"><div className="w-10 h-10 bg-slate-200 dark:bg-slate-700/50 rounded-xl"></div></td>
                            <td className="px-6 py-4"><div className="w-16 h-4 bg-slate-200 dark:bg-slate-700/50 rounded"></div></td>
                            <td className="px-6 py-4"><div className="w-48 h-4 bg-slate-200 dark:bg-slate-700/50 rounded"></div></td>
                            <td className="px-6 py-4"><div className="w-20 h-4 bg-slate-200 dark:bg-slate-700/50 rounded"></div></td>
                            <td className="px-6 py-4 text-right"><div className="w-16 h-4 bg-slate-200 dark:bg-slate-700/50 rounded ml-auto"></div></td>
                            <td className="px-6 py-4"><div className="w-12 h-4 bg-slate-200 dark:bg-slate-700/50 rounded mx-auto"></div></td>
                            <td className="px-6 py-4"><div className="w-16 h-6 bg-slate-200 dark:bg-slate-700/50 rounded mx-auto"></div></td>
                          </tr>
                         ))
                      ) : 
                       !sucursalActiva ? <tr><td colSpan="7" className="text-center py-10 text-gray-400 dark:text-slate-500 font-medium">⚠️ Sin sucursal.</td></tr> :
                       productosFiltrados.map((prod) => {
                        const stockVisual = parseInt(prod.stock || 0);
                        return (
                        <tr 
                          key={prod.id} 
                          onClick={() => abrirModalVer(prod)}
                          className="hover:bg-white/40 dark:hover:bg-blue-900/10 transition-colors duration-200 group cursor-pointer"
                        >
                          <td className="px-6 py-3">
                            <div className="w-10 h-10 rounded-xl border border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center shadow-sm">
                               {prod.imagen ? <img src={renderImagen(prod.imagen)} alt="prod" className="w-full h-full object-cover"/> : <ImageIcon size={18} className="text-gray-300 dark:text-slate-600"/>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-blue-300/70 tracking-wider transition-colors">{prod.codigo || '---'}</td>
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-white transition-colors"><p className="truncate max-w-[200px]" title={prod.nombre}>{prod.nombre}</p></td>
                          <td className="px-6 py-4"><span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-md px-2.5 py-1 rounded-md border border-blue-100/50 dark:border-blue-500/20 transition-colors">{prod.categoria_nombre || 'General'}</span></td>
                          <td className="px-6 py-4 text-right font-extrabold text-emerald-700 dark:text-emerald-400 transition-colors">S/ {parseFloat(prod.precio).toFixed(2)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1.5 rounded-md text-[10px] font-bold border backdrop-blur-md transition-colors ${stockVisual > 10 ? 'bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20' : stockVisual > 0 ? 'bg-yellow-50/80 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-500/20' : 'bg-red-50/80 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-500/20'}`}>
                              {stockVisual} un.
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                            <button onClick={() => abrirModal(prod)} className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg mr-2 backdrop-blur-md transition-colors active:scale-95"><Edit size={16}/></button>
                            <button onClick={() => handleDeleteClick(prod.id)} className="p-2 text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg backdrop-blur-md transition-colors active:scale-95"><Trash2 size={16}/></button>
                          </td>
                        </tr>
                        )})}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* VISTA GRID GALERÍA */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 lg:gap-5 gap-3">
              {loading ? (
                // ✨ SKELETON LOADER GALERÍA ✨
                [1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-xl rounded-[1.5rem] border border-gray-200/50 dark:border-white/5 shadow-sm overflow-hidden animate-pulse">
                    <div className="h-28 md:h-36 bg-slate-200 dark:bg-slate-700/50"></div>
                    <div className="p-3 md:p-4">
                      <div className="w-1/2 h-2 bg-slate-200 dark:bg-slate-700/50 rounded mb-2"></div>
                      <div className="w-3/4 h-3 bg-slate-200 dark:bg-slate-700/50 rounded mb-3"></div>
                      <div className="flex justify-between">
                         <div className="w-1/3 h-4 bg-slate-200 dark:bg-slate-700/50 rounded"></div>
                         <div className="w-1/4 h-4 bg-slate-200 dark:bg-slate-700/50 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : !sucursalActiva ? (
                <div className="col-span-full text-center py-10 text-xs text-red-500 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 dark:border-red-500/20 rounded-2xl border backdrop-blur-md">
                  ⚠️ Pídele al Administrador que te asigne una sucursal.
                </div>
              ) : productosFiltrados.map((prod) => {
                const stockVisual = parseInt(prod.stock || 0);
                return (
                <div 
                  key={prod.id} 
                  onClick={() => abrirModalVer(prod)}
                  className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-xl rounded-[1.5rem] border border-gray-200/50 dark:border-white/5 hover:border-primary/50 shadow-sm hover:shadow-lg dark:hover:shadow-[0_8px_30px_rgb(29,78,216,0.15)] transition-all flex flex-col group overflow-hidden duration-300 cursor-pointer"
                >
                  <div className="h-28 md:h-36 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center p-3 md:p-4 relative border-b border-gray-100/50 dark:border-white/5 transition-colors">
                    {prod.imagen ? (
                      <img src={renderImagen(prod.imagen)} alt={prod.nombre} className="max-w-full max-h-full object-contain drop-shadow-sm rounded-lg group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="text-slate-300 dark:text-slate-600 flex flex-col items-center group-hover:scale-105 transition-transform"><Package size={40} strokeWidth={1} /></div>
                    )}
                  </div>
                  <div className="p-3 md:p-4 flex-1 flex flex-col bg-transparent z-10">
                    <p className="text-[8px] md:text-[9px] font-extrabold text-slate-400 dark:text-blue-400 mb-1 tracking-widest uppercase truncate transition-colors">{prod.codigo || 'SIN CÓDIGO'}</p>
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-xs md:text-sm leading-tight mb-1.5 group-hover:text-primary transition-colors line-clamp-2" title={prod.nombre}>{prod.nombre}</h3>
                    <p className="text-[9px] md:text-[11px] text-gray-400 dark:text-slate-400 line-clamp-1 mb-2 leading-tight transition-colors">{prod.descripcion || 'Sin descripción'}</p>
                    
                    <div className="mt-auto flex justify-between items-end pt-2 border-t border-gray-100/50 dark:border-white/5 transition-colors">
                      <span className="text-sm md:text-lg font-black text-emerald-600 dark:text-emerald-400">S/ {parseFloat(prod.precio).toFixed(2)}</span>
                      <span className={`text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-md backdrop-blur-md border ${stockVisual > 0 ? 'bg-slate-100/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-transparent dark:border-white/5' : 'bg-red-100/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-transparent dark:border-red-500/20'}`}>
                        {stockVisual} un.
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-blue-900/10 p-2.5 border-t border-slate-100 dark:border-white/5 flex justify-between items-center transition-colors" onClick={e => e.stopPropagation()}>
                    <span className="text-[8px] md:text-[9px] font-extrabold uppercase text-purple-700 dark:text-purple-400 bg-purple-100/80 dark:bg-purple-900/30 backdrop-blur-md px-2 py-1 rounded-md border border-purple-200/50 dark:border-purple-500/20 flex items-center gap-1 truncate transition-colors">
                      {esVistaGlobal ? 'Global' : 'Local'}
                    </span>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => abrirModal(prod)} className="p-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-blue-600 dark:text-blue-400 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white dark:hover:text-white rounded-lg border border-gray-200/50 dark:border-white/10 transition-colors active:scale-95"><Edit size={14}/></button>
                      <button onClick={() => handleDeleteClick(prod.id)} className="p-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-red-500 dark:text-red-400 hover:bg-red-600 dark:hover:bg-red-500 hover:text-white dark:hover:text-white rounded-lg border border-gray-200/50 dark:border-white/10 transition-colors active:scale-95"><Trash2 size={14}/></button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA MONITORES GLOBAL (LIQUID GLASS) */}
      {tabActiva === 'control' && esVistaGlobal && (
        <div className="animate-fade-in space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl p-6 rounded-[2rem] shadow-sm border-l-4 border-blue-600 dark:border-blue-500 flex justify-between items-center transition-colors">
              <div>
                <p className="text-xs font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1">Stock Global</p>
                <p className="text-3xl font-black text-slate-800 dark:text-white">{totalStock}</p>
              </div>
              <div className="bg-blue-50/80 dark:bg-blue-900/30 p-4 rounded-2xl text-blue-600 dark:text-blue-400 backdrop-blur-md"><Package size={32}/></div>
            </div>
            <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl p-6 rounded-[2rem] shadow-sm border-l-4 border-yellow-500 dark:border-yellow-400 flex justify-between items-center transition-colors">
              <div>
                <p className="text-xs font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1">Alertas Stock</p>
                <p className="text-3xl font-black text-slate-800 dark:text-white">{stockBajo}</p>
              </div>
              <div className="bg-yellow-50/80 dark:bg-yellow-900/30 p-4 rounded-2xl text-yellow-600 dark:text-yellow-400 backdrop-blur-md"><AlertTriangle size={32}/></div>
            </div>
            <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl p-6 rounded-[2rem] shadow-sm border-l-4 border-emerald-500 dark:border-emerald-400 flex justify-between items-center transition-colors">
              <div>
                <p className="text-xs font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1">Catálogo Total</p>
                <p className="text-3xl font-black text-slate-800 dark:text-white">{productos.length}</p>
              </div>
              <div className="bg-emerald-50/80 dark:bg-emerald-900/30 p-4 rounded-2xl text-emerald-600 dark:text-emerald-400 backdrop-blur-md"><TrendingUp size={32}/></div>
            </div>
          </div>
        </div>
      )}

      {/* ✨ MODAL DE ELIMINACIÓN ✨ */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white/90 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 md:p-8 w-full sm:max-w-sm text-center shadow-2xl border border-white/50 dark:border-white/10 animate-fade-in-up transition-colors">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 dark:border-red-500/20">
              <Trash2 size={28} />
            </div>
            <h3 className="text-lg md:text-xl font-black text-gray-800 dark:text-white mb-2">Eliminar Producto</h3>
            <p className="text-xs md:text-sm text-gray-500 dark:text-blue-200/70 mb-8 leading-relaxed">
              Esta acción es permanente. Se borrará de <b className="text-gray-700 dark:text-blue-100">todas las sucursales</b>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({open: false, id: null})} className="flex-1 py-3.5 bg-gray-100/80 dark:bg-slate-800/80 text-gray-700 dark:text-slate-300 font-extrabold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-sm border border-transparent dark:border-white/5">
                Cancelar
              </button>
              <button onClick={confirmDelete} className="flex-1 py-3.5 bg-red-600/90 text-white font-black rounded-xl hover:bg-red-600 shadow-lg shadow-red-600/20 active:scale-95 transition-all text-sm border border-red-500/50">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ MODAL DE EDICIÓN ✨ */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md animate-fade-in transition-colors duration-300">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full sm:max-w-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden border border-white/50 dark:border-white/10 transition-colors duration-300">
            
            <div className="px-6 py-5 border-b border-gray-100/50 dark:border-white/5 flex justify-between items-center bg-transparent shrink-0">
              <h2 className="text-lg md:text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                <Edit className="text-primary" size={22}/> {formData.id ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors border border-transparent dark:border-white/5"><X size={20}/></button>
            </div>
            
            <form id="productForm" onSubmit={handleSubmit} className="p-5 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              
              <div className="bg-slate-50/50 dark:bg-blue-900/10 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-white/5 transition-colors">
                <h3 className="text-xs font-black text-gray-500 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Package size={16}/> Datos Base</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] md:text-xs font-extrabold text-gray-500 dark:text-blue-300/70 uppercase">Nombre *</label>
                      <input type="text" required placeholder="Ej: Micrófono HyperX" className="w-full border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-blue-950/30 p-3 rounded-xl focus:ring-2 ring-primary outline-none text-xs md:text-sm font-bold text-gray-800 dark:text-white mt-1.5 transition-all shadow-sm" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] md:text-xs font-extrabold text-gray-500 dark:text-blue-300/70 uppercase mb-1.5 block">Categoría</label>
                       <CustomDropdown 
                         value={formData.categoria_id}
                         onChange={val => setFormData({...formData, categoria_id: val})}
                         options={[
                             {value: '', label: '-- Sin categoría --'},
                             ...categorias.map(c => ({value: c.id, label: c.nombre}))
                         ]}
                         placeholder="Elige una categoría"
                         className="w-full h-[42px] md:h-[46px] border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-blue-950/30 shadow-sm"
                       />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] md:text-xs font-extrabold text-gray-500 dark:text-blue-300/70 uppercase">Descripción</label>
                    <textarea rows="2" placeholder="Detalles del producto..." className="w-full border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-blue-950/30 p-3 rounded-xl focus:ring-2 ring-primary outline-none text-xs md:text-sm font-medium mt-1.5 resize-none text-gray-700 dark:text-white transition-all shadow-sm" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})}></textarea>
                  </div>

                  <div className="border border-blue-100/80 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-900/20 p-4 sm:p-5 rounded-2xl space-y-3 transition-colors relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
                    <label className="text-[10px] md:text-xs font-black text-blue-800 dark:text-blue-400 uppercase block mb-2 relative z-10">Imagen del Producto</label>
                    <div className="flex gap-4 mb-3 relative z-10">
                      <label className="flex items-center gap-1.5 text-xs font-extrabold text-gray-700 dark:text-blue-100 cursor-pointer">
                        <input type="radio" name="tipoImagen" checked={tipoImagen === 'url'} onChange={() => setTipoImagen('url')} className="text-primary focus:ring-primary w-4 h-4 dark:bg-blue-950 dark:border-white/20" />
                        <LinkIcon size={14} className="text-blue-400 dark:text-blue-500"/> Pegar URL
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-extrabold text-gray-700 dark:text-blue-100 cursor-pointer">
                        <input type="radio" name="tipoImagen" checked={tipoImagen === 'archivo'} onChange={() => setTipoImagen('archivo')} className="text-primary focus:ring-primary w-4 h-4 dark:bg-blue-950 dark:border-white/20" />
                        <UploadCloud size={14} className="text-blue-400 dark:text-blue-500"/> Subir de PC
                      </label>
                    </div>
                    {tipoImagen === 'url' ? (
                      <input type="text" placeholder="https://ejemplo.com/foto.jpg" className="w-full border border-blue-200/80 dark:border-blue-700/50 bg-white/80 dark:bg-blue-950/50 p-3 rounded-xl focus:ring-2 ring-primary outline-none font-medium text-xs sm:text-sm text-gray-800 dark:text-white transition-all shadow-sm relative z-10" value={formData.imagen_url} onChange={e => setFormData({...formData, imagen_url: e.target.value})} />
                    ) : (
                      <div className="bg-white/80 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-700/50 rounded-xl overflow-hidden flex relative z-10 transition-all shadow-sm">
                        <input type="file" accept="image/*" onChange={e => setImagenFile(e.target.files[0])} className="w-full text-xs text-gray-500 dark:text-blue-300 file:mr-3 file:py-3 file:px-4 file:rounded-none file:border-0 file:text-xs file:font-black file:bg-blue-50 dark:file:bg-blue-900/40 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100 dark:hover:file:bg-blue-800/50 cursor-pointer transition-colors" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] md:text-xs font-extrabold text-gray-500 dark:text-blue-300/70 uppercase">SKU / Código</label>
                      <input type="text" placeholder="PROD-001" className="w-full border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-blue-950/30 p-3 rounded-xl focus:ring-2 ring-primary outline-none font-bold text-gray-800 dark:text-white mt-1.5 uppercase text-xs md:text-sm transition-all shadow-sm" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] md:text-xs font-extrabold text-gray-500 dark:text-blue-300/70 uppercase">Precio (S/) *</label>
                      <input type="number" step="0.01" required placeholder="0.00" className="w-full border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-blue-950/30 p-3 rounded-xl focus:ring-2 ring-primary outline-none font-black text-emerald-600 dark:text-emerald-400 mt-1.5 text-xs md:text-sm transition-all shadow-sm" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 dark:bg-blue-900/10 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-white/5 transition-colors">
                <h3 className="text-xs font-black text-gray-500 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Store size={16}/> Distribución de Stock</h3>
                {sucursales.length === 0 ? (
                  <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-md p-4 rounded-xl border border-blue-100 dark:border-blue-500/20 font-bold transition-colors">Aún no has creado Sucursales.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {sucursales.map(suc => {
                      const usuarioDatos = JSON.parse(localStorage.getItem('usuario') || '{}');
                      let asignadas = [];
                      try {
                        if (Array.isArray(usuarioDatos.sucursales_asignadas)) asignadas = usuarioDatos.sucursales_asignadas;
                        else if (typeof usuarioDatos.sucursales_asignadas === 'string') {
                          let p = JSON.parse(usuarioDatos.sucursales_asignadas);
                          if (typeof p === 'string') p = JSON.parse(p);
                          if (Array.isArray(p)) asignadas = p;
                        }
                      } catch(e){}
                      const puedeEditar = usuarioDatos.rol === 'Administrador' || asignadas.map(id => parseInt(id)).includes(parseInt(suc.id));
                      if (!puedeEditar) return null;
                      return (
                        <div key={suc.id} className="bg-white/80 dark:bg-slate-900/50 border border-gray-200/80 dark:border-white/5 p-3 rounded-xl shadow-sm group transition-colors">
                          <label className="text-[9px] sm:text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 group-hover:text-primary uppercase block mb-1.5 truncate transition-colors" title={suc.nombre}>{suc.nombre}</label>
                          <input type="number" min="0" placeholder="0 un." className="w-full bg-slate-50 dark:bg-blue-950/50 border border-slate-100 dark:border-white/10 rounded-lg p-2 text-xs sm:text-sm font-black text-gray-800 dark:text-white outline-none focus:bg-white dark:focus:bg-blue-950 focus:border-blue-400 focus:ring-2 ring-primary transition-all" value={formData.stock_sucursales[suc.id] || ''} onChange={(e) => handleStockChange(suc.id, e.target.value)} />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </form>

            <div className="p-5 border-t border-gray-100/50 dark:border-white/5 bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-md flex gap-3 shrink-0 rounded-b-[2.5rem] transition-colors">
              <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3.5 font-extrabold text-gray-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border border-gray-200/80 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-sm shadow-sm backdrop-blur-md">
                Cancelar
              </button>
              <button type="submit" form="productForm" className="flex-1 py-3.5 font-black text-white btn-primary active:scale-95 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm border border-transparent dark:border-white/10 backdrop-blur-md">
                {formData.id ? <><CheckCircle size={18}/> Actualizar</> : <><Plus size={18}/> Guardar Producto</>}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ✨ MODAL VER DETALLES (FIXED: SIN ICONOS FALTANTES) ✨ */}
      {viewModal.open && viewModal.producto && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in transition-colors duration-300">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full sm:max-w-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden border border-white/50 dark:border-white/10 transition-colors duration-300">
            
            <div className="px-6 py-5 border-b border-gray-100/50 dark:border-white/5 flex justify-between items-center bg-transparent shrink-0">
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mt-2 sm:hidden z-20 absolute top-2 left-1/2 -translate-x-1/2"></div>
              <h2 className="text-lg md:text-xl font-black text-gray-800 dark:text-white flex items-center gap-2 mt-3 sm:mt-0">
                <Search className="text-primary" size={22}/> Ficha del Producto
              </h2>
              <button onClick={() => setViewModal({ open: false, producto: null })} className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors border border-transparent dark:border-white/5"><X size={20}/></button>
            </div>

            <div className={`p-5 sm:p-8 overflow-y-auto ${hideScrollbar} flex-1 flex flex-col md:flex-row gap-6`}>
              <div className="w-full md:w-1/3 flex flex-col items-center">
                <div className="w-40 h-40 md:w-full md:h-auto md:aspect-square bg-white/50 dark:bg-slate-900/50 rounded-[2rem] border border-gray-100 dark:border-white/5 flex items-center justify-center overflow-hidden backdrop-blur-md p-4 shadow-inner">
                  {viewModal.producto?.imagen ? (
                    <img src={renderImagen(viewModal.producto.imagen)} alt="prod" className="max-w-full max-h-full object-contain drop-shadow-md hover:scale-110 transition-transform duration-500"/>
                  ) : (
                    <ImageIcon size={48} className="text-gray-300 dark:text-slate-600"/>
                  )}
                </div>
              </div>

              <div className="w-full md:w-2/3 flex flex-col gap-4">
                <div>
                  <div className="flex gap-2 mb-2">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-md px-2.5 py-1 rounded-md border border-blue-100/50 dark:border-blue-500/20 uppercase tracking-widest flex items-center gap-1">
                      <Package size={10}/> {viewModal.producto?.categoria_nombre || 'General'}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 bg-gray-100/80 dark:bg-slate-800/50 backdrop-blur-md px-2.5 py-1 rounded-md border border-gray-200/50 dark:border-white/5 uppercase tracking-widest flex items-center gap-1">
                      <Grid size={10}/> {viewModal.producto?.codigo || 'S/C'}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-3xl font-black text-gray-800 dark:text-white leading-tight">{viewModal.producto?.nombre || 'Producto'}</h3>
                  <p className="text-2xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400 mt-2">S/ {Number(viewModal.producto?.precio || 0).toFixed(2)}</p>
                </div>

                <div className="bg-slate-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors">
                  <h4 className="text-[10px] font-black text-gray-500 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 border-b border-gray-200/50 dark:border-white/5 pb-2"><List size={14}/> Descripción</h4>
                  <p className="text-sm font-medium text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{viewModal.producto?.descripcion || 'Este producto no tiene una descripción detallada.'}</p>
                </div>

                <div className="bg-slate-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-slate-100 dark:border-white/5 transition-colors mt-auto">
                  <h4 className="text-[10px] font-black text-gray-500 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-gray-200/50 dark:border-white/5 pb-2"><Store size={14}/> Stock Disponible</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(() => {
                      let detalles = viewModal.producto?.inventario_detalle;
                      if (typeof detalles === 'string') { try { detalles = JSON.parse(detalles); } catch(e) { detalles = []; } }
                      if (!Array.isArray(detalles) || detalles.length === 0) return <p className="text-xs text-gray-500 dark:text-slate-400 col-span-2">No hay stock registrado.</p>;
                      
                      return detalles.map((inv, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white/60 dark:bg-slate-800/50 p-2 rounded-xl border border-gray-100 dark:border-white/5">
                           <span className="text-[10px] font-bold text-gray-600 dark:text-slate-300 truncate pr-2" title={inv?.sucursal_nombre || ''}>{inv?.sucursal_nombre || 'Local'}</span>
                           <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${(inv?.stock || 0) > 0 ? 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{inv?.stock || 0} un.</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-t border-gray-100/50 dark:border-white/5 shrink-0 flex gap-3 rounded-b-[2.5rem]">
               <button onClick={() => { const p = viewModal.producto; setViewModal({ open: false, producto: null }); abrirModal(p); }} className="flex-1 py-3.5 btn-primary text-white rounded-xl font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-colors active:scale-95"><Edit size={16}/> Editar Producto</button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ MODAL IMPORTAR JSON ✨ */}
      {modalImportarOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md transition-colors duration-300">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 animate-fade-in-up border border-white/50 dark:border-white/10 transition-colors">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
            <div className="flex justify-between items-center mb-6 border-b border-gray-100/50 dark:border-white/5 pb-4">
               <h2 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2 tracking-tight"><FileJson className="text-primary" size={22}/> Importar JSON</h2>
               <button onClick={() => setModalImportarOpen(false)} className="text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors"><X size={18}/></button>
            </div>
            <p className="text-sm font-bold text-gray-600 dark:text-blue-200/70 mb-4 leading-relaxed">Tu archivo debe ser un arreglo <code className="bg-gray-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 font-black border border-gray-200 dark:border-slate-700">[]</code>:</p>
            <div className="bg-slate-900 dark:bg-black/50 rounded-2xl p-5 overflow-x-auto shadow-inner border border-slate-800 dark:border-white/5 mb-6">
              <pre className="text-xs text-emerald-400 font-mono leading-relaxed">
{`[
  {
    "nombre": "Producto Ejemplo",
    "precio": 90.00,
    "stock": 10,
    "categoria_id": 1
  }
]`}
              </pre>
            </div>
            
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportJSON} />
            
            <button onClick={() => fileInputRef.current.click()} className="w-full py-4 font-black text-white btn-primary active:scale-95 rounded-xl flex items-center justify-center gap-2 text-sm shadow-xl backdrop-blur-md border border-transparent dark:border-white/10 transition-all">
              <UploadCloud size={18}/> Seleccionar Archivo .JSON
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

// DROPDOWN PERSONALIZADO
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

  const selectedOption = options.find(option => option.value === value);
  const displayLabel = selectedOption ? selectedOption.label : (placeholder || label || "Seleccionar");

  return (
    <div className="relative w-auto shrink-0 z-20" ref={dropdownRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between transition-all w-full bg-white/80 dark:bg-blue-950/40 backdrop-blur-md border border-gray-200/80 dark:border-white/10 rounded-xl px-3 sm:px-4 text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm hover:bg-gray-50 dark:hover:bg-blue-950/60 ${className}`}
      >
        <span className="font-extrabold truncate">
          {label && <span className="text-gray-400 dark:text-blue-300/70 font-bold mr-1.5">{label}:</span>}
          {displayLabel}
        </span>
        <ChevronDown size={16} className={`text-gray-400 dark:text-slate-400 ml-2 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute mt-2 w-full min-w-[150px] rounded-2xl shadow-2xl border border-white/50 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl top-full left-0 overflow-hidden animate-fade-in-down z-50">
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm font-bold transition-colors rounded-xl mb-0.5 last:mb-0 ${
                  value === option.value
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

export default Productos;