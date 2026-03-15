import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Package, Search, Plus, Edit, Trash2, X, List, Grid, AlertTriangle, TrendingUp, BarChart3, Store, UploadCloud, FileJson, Image as ImageIcon, Link as LinkIcon, ChevronDown, CheckCircle, ReceiptText } from 'lucide-react';

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
  
  const stockPorSucursal = {};
  productos.forEach(p => {
    let detalles = p.inventario_detalle;
    if (typeof detalles === 'string') { try { detalles = JSON.parse(detalles); } catch(e) { detalles = []; } }
    if (Array.isArray(detalles)) {
      detalles.forEach(inv => {
        if(inv && inv.sucursal_nombre) {
          stockPorSucursal[inv.sucursal_nombre] = (stockPorSucursal[inv.sucursal_nombre] || 0) + parseInt(inv.stock || 0);
        }
      });
    }
  });
  const maxStockChart = Math.max(...Object.values(stockPorSucursal), 1); 

  return (
    <Layout title="Inventario">
      
      <div className="flex justify-between items-end mb-3 md:mb-5">
        <p className="text-[11px] md:text-sm text-gray-500 font-bold px-1 uppercase tracking-wider">
            {esVistaGlobal ? 'Catálogo Global' : `Sede: ${sucursalActiva?.nombre || 'Ninguna'}`}
        </p>
        
        <div className="flex bg-slate-200/50 p-1 rounded-lg">
          <button onClick={() => setTabActiva('catalogo')} className={`px-3 py-1.5 rounded-md font-bold text-[10px] md:text-xs transition-all ${tabActiva === 'catalogo' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}>
            Catálogo
          </button>
          {esVistaGlobal && (
            <button onClick={() => setTabActiva('control')} className={`px-3 py-1.5 rounded-md font-bold text-[10px] md:text-xs transition-all ${tabActiva === 'control' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}>
              Global
            </button>
          )}
        </div>
      </div>

      {tabActiva === 'catalogo' && (
        <div className="animate-fade-in">
          
          {/* ✨ CONTROLES ARREGLADOS: Sin overflow oculto, botones visibles y accesibles ✨ */}
          <div className="flex flex-col gap-3 mb-4 md:mb-6 bg-white p-3 md:p-4 rounded-2xl border border-gray-100 shadow-sm relative z-20">
            
            {/* Fila 1: Buscador y Botón Nuevo (Siempre visibles y priorizados) */}
            <div className="flex gap-2 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                <input 
                  type="text" 
                  placeholder="Buscar producto o SKU..." 
                  className="w-full bg-slate-50 border border-gray-200 pl-9 pr-3 py-2 md:py-2.5 rounded-xl text-xs md:text-sm outline-none focus:border-blue-500 transition-colors h-[40px]" 
                  value={busqueda} 
                  onChange={e => setBusqueda(e.target.value)} 
                />
              </div>
              <button onClick={() => abrirModal()} className="h-[40px] px-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md hover:bg-blue-700 transition-all text-xs md:text-sm shrink-0">
                <Plus size={16}/> <span className="hidden sm:inline">Nuevo</span>
              </button>
            </div>

            {/* Fila 2: Filtro, Importar JSON y Vistas (Totalmente responsivos) */}
            <div className="flex justify-between items-center w-full gap-2">
              <CustomDropdown 
                value={filtroEstado}
                onChange={setFiltradoEstado}
                options={[
                    {value: 'activos', label: 'Activos'},
                    {value: 'inactivos', label: 'Inactivos'},
                    {value: 'todos', label: 'Todos'}
                ]}
                className="h-[40px] bg-slate-50 border-gray-200 text-xs md:text-sm w-[130px] md:w-auto"
              />

              <div className="flex gap-2 items-center shrink-0">
                <button onClick={() => setModalImportarOpen(true)} className="h-[40px] w-[40px] sm:w-auto sm:px-4 bg-emerald-50 text-emerald-600 rounded-xl font-bold flex items-center justify-center gap-1.5 border border-emerald-200 hover:bg-emerald-100 transition-all text-xs md:text-sm" title="Importar JSON">
                  <UploadCloud size={16}/> <span className="hidden sm:inline">JSON</span>
                </button>
                
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 h-[40px] items-center">
                  <button onClick={() => setVista('tabla')} className={`p-1.5 rounded-lg transition-all ${vista === 'tabla' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><List size={16}/></button>
                  <button onClick={() => setVista('galeria')} className={`p-1.5 rounded-lg transition-all ${vista === 'galeria' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><Grid size={16}/></button>
                </div>
              </div>
            </div>

          </div>

          {vista === 'tabla' ? (
            <>
              {/* VISTA LISTA MÓVIL (Horizontales) */}
              <div className="md:hidden flex flex-col gap-2.5">
                {loading ? <p className="text-center py-10 text-xs font-medium">Cargando catálogo...</p> : 
                 !sucursalActiva ? <p className="text-center py-10 text-xs text-red-500 bg-red-50 rounded-xl">⚠️ Sin sucursal asignada.</p> :
                 productosFiltrados.length === 0 ? <p className="text-center py-10 text-xs italic text-gray-400">No hay productos.</p> :
                 productosFiltrados.map((prod) => {
                  const stockVisual = parseInt(prod.stock || 0);
                  return (
                    <div key={prod.id} className="bg-white rounded-2xl border border-gray-100 p-2.5 flex items-stretch gap-3 shadow-sm relative overflow-hidden">
                       <div className="w-20 h-20 bg-slate-50 rounded-xl border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {prod.imagen ? <img src={renderImagen(prod.imagen)} alt="prod" className="w-full h-full object-cover"/> : <ImageIcon size={24} className="text-gray-300"/>}
                       </div>
                       <div className="flex-1 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                               <h3 className="font-bold text-gray-800 text-xs leading-tight line-clamp-2">{prod.nombre}</h3>
                               <div className="flex gap-1 shrink-0">
                                  <button onClick={() => abrirModal(prod)} className="text-blue-500 bg-blue-50 p-1.5 rounded-lg"><Edit size={12}/></button>
                                  <button onClick={() => handleDeleteClick(prod.id)} className="text-red-500 bg-red-50 p-1.5 rounded-lg"><Trash2 size={12}/></button>
                               </div>
                            </div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">{prod.codigo || 'SIN CÓDIGO'}</p>
                          </div>
                          <div className="flex justify-between items-end mt-1">
                             <span className="font-black text-emerald-600 text-sm">S/ {parseFloat(prod.precio).toFixed(2)}</span>
                             <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded md ${stockVisual > 0 ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                               Stock: {stockVisual}
                             </span>
                          </div>
                       </div>
                    </div>
                  )
                 })}
              </div>

              {/* VISTA TABLA PC */}
              <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto w-full">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Foto</th>
                      <th className="px-6 py-4">Código</th>
                      <th className="px-6 py-4">Producto</th>
                      <th className="px-6 py-4">Categoría</th> 
                      <th className="px-6 py-4 text-right">Precio</th>
                      <th className="px-6 py-4 text-center">Stock</th>
                      <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? <tr><td colSpan="7" className="text-center py-10 font-medium">Cargando...</td></tr> : 
                     !sucursalActiva ? <tr><td colSpan="7" className="text-center py-10 text-gray-400 font-medium">⚠️ Sin sucursal.</td></tr> :
                     productosFiltrados.map((prod) => {
                      const stockVisual = parseInt(prod.stock || 0);
                      return (
                      <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3">
                          <div className="w-10 h-10 rounded-lg border bg-white overflow-hidden flex items-center justify-center">
                             {prod.imagen ? <img src={renderImagen(prod.imagen)} alt="prod" className="w-full h-full object-cover"/> : <ImageIcon size={18} className="text-gray-300"/>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-400 tracking-wider">{prod.codigo || '---'}</td>
                        <td className="px-6 py-4 font-bold text-slate-800"><p className="truncate max-w-[200px]" title={prod.nombre}>{prod.nombre}</p></td>
                        <td className="px-6 py-4"><span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">{prod.categoria_nombre || 'General'}</span></td>
                        <td className="px-6 py-4 text-right font-extrabold text-emerald-700">S/ {parseFloat(prod.precio).toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${stockVisual > 10 ? 'bg-emerald-50 text-emerald-700' : stockVisual > 0 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                            {stockVisual} un.
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => abrirModal(prod)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded mr-2"><Edit size={14}/></button>
                          <button onClick={() => handleDeleteClick(prod.id)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded"><Trash2 size={14}/></button>
                        </td>
                      </tr>
                     )})}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* VISTA GRID GALERÍA */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 lg:gap-5 gap-2.5">
              {!sucursalActiva ? (
                <div className="col-span-full text-center py-10 text-xs text-red-500 font-medium bg-red-50 rounded-2xl">
                  ⚠️ Pídele al Administrador que te asigne una sucursal.
                </div>
              ) : productosFiltrados.map((prod) => {
                const stockVisual = parseInt(prod.stock || 0);
                return (
                <div key={prod.id} className="bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all flex flex-col group overflow-hidden">
                  <div className="h-24 md:h-36 bg-slate-50 flex items-center justify-center p-2 md:p-4 relative">
                    {prod.imagen ? (
                      <img src={renderImagen(prod.imagen)} alt={prod.nombre} className="max-w-full max-h-full object-contain drop-shadow-sm rounded" />
                    ) : (
                      <div className="text-slate-300 flex flex-col items-center"><Package size={32} strokeWidth={1.5} /></div>
                    )}
                  </div>
                  <div className="p-2.5 md:p-3.5 flex-1 flex flex-col bg-white z-10">
                    <p className="text-[8px] md:text-[9px] font-extrabold text-slate-400 mb-0.5 tracking-widest uppercase truncate">{prod.codigo || 'SIN CÓDIGO'}</p>
                    <h3 className="font-extrabold text-slate-800 text-[11px] md:text-sm leading-tight mb-1 group-hover:text-blue-600 transition-colors line-clamp-2" title={prod.nombre}>{prod.nombre}</h3>
                    <p className="text-[9px] md:text-[11px] text-gray-400 line-clamp-1 mb-1.5 leading-tight">{prod.descripcion || 'Sin descripción'}</p>
                    
                    <div className="mt-auto flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-sm md:text-lg font-black text-emerald-600">S/ {parseFloat(prod.precio).toFixed(2)}</span>
                      <span className={`text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded ${stockVisual > 0 ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                        {stockVisual} un.
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[8px] md:text-[9px] font-extrabold uppercase text-purple-700 bg-purple-100 px-1.5 py-0.5 md:py-1 rounded border border-purple-200 flex items-center gap-1 truncate max-w-[60px] md:max-w-none">
                      {esVistaGlobal ? 'Global' : 'Local'}
                    </span>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => abrirModal(prod)} className="p-1 md:p-1.5 bg-white text-blue-600 hover:bg-blue-600 hover:text-white rounded border border-slate-200 transition-colors"><Edit size={12}/></button>
                      <button onClick={() => handleDeleteClick(prod.id)} className="p-1 md:p-1.5 bg-white text-red-500 hover:bg-red-600 hover:text-white rounded border border-slate-200 transition-colors"><Trash2 size={12}/></button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA MONITORES GLOBAL */}
      {tabActiva === 'control' && esVistaGlobal && (
        <div className="animate-fade-in space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-600 flex justify-between items-center">
              <div>
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-1">Stock Global</p>
                <p className="text-2xl md:text-3xl font-black text-slate-800">{totalStock}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><Package size={28}/></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-yellow-500 flex justify-between items-center">
              <div>
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-1">Alertas Stock</p>
                <p className="text-2xl md:text-3xl font-black text-slate-800">{stockBajo}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-2xl text-yellow-600"><AlertTriangle size={28}/></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-emerald-500 flex justify-between items-center">
              <div>
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-1">Catálogo Total</p>
                <p className="text-2xl md:text-3xl font-black text-slate-800">{productos.length}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><TrendingUp size={28}/></div>
            </div>
          </div>
        </div>
      )}

      {/* ✨ MODAL DE ELIMINACIÓN TIPO APP (Diseño Bottom Sheet en celular) ✨ */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-[2rem] p-6 md:p-8 w-full sm:max-w-sm text-center shadow-2xl animate-fade-in-up">
            {/* Pequeña barra superior en móvil para indicar que es un panel deslizable */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg md:text-xl font-extrabold text-gray-800 mb-2">Eliminar Producto</h3>
            <p className="text-xs md:text-sm text-gray-500 mb-6 leading-relaxed">
              Esta acción es permanente. Se borrará de <b>todas las sucursales</b>.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({open: false, id: null})} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm">
                Cancelar
              </button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/30 transition-colors text-sm">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ MODAL DE EDICIÓN MEJORADA (Diseño Bottom Sheet Compacto para celular) ✨ */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
            
            {/* HEADER FIJO */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
              <h2 className="text-base md:text-lg font-extrabold text-gray-800 flex items-center gap-2">
                <Edit className="text-blue-600" size={20}/> {formData.id ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 p-1.5 md:p-2 rounded-full transition-colors"><X size={18}/></button>
            </div>
            
            {/* CUERPO CON SCROLL */}
            <form id="productForm" onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              
              <div className="bg-slate-50/50 p-3 sm:p-4 rounded-2xl border border-slate-100">
                <h3 className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Package size={14}/> Datos Base</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Nombre *</label>
                      <input type="text" required placeholder="Ej: Micrófono HyperX" className="w-full border border-gray-200 p-2 md:p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-bold text-gray-800 mt-1 bg-white" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-1 block">Categoría</label>
                       <CustomDropdown 
                         value={formData.categoria_id}
                         onChange={val => setFormData({...formData, categoria_id: val})}
                         options={[
                             {value: '', label: '-- Sin categoría --'},
                             ...categorias.map(c => ({value: c.id, label: c.nombre}))
                         ]}
                         placeholder="Elige una categoría"
                         className="w-full h-[38px] md:h-[42px] border-gray-200 text-xs md:text-sm bg-white"
                       />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Descripción</label>
                    <textarea rows="2" placeholder="Detalles del producto..." className="w-full border border-gray-200 p-2 md:p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-medium mt-1 bg-white resize-none text-gray-700" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})}></textarea>
                  </div>

                  <div className="border border-blue-100 bg-blue-50/30 p-3 sm:p-4 rounded-xl space-y-2">
                    <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase block mb-1">Imagen del Producto</label>
                    <div className="flex gap-4 mb-2">
                      <label className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-gray-700 cursor-pointer">
                        <input type="radio" name="tipoImagen" checked={tipoImagen === 'url'} onChange={() => setTipoImagen('url')} className="text-blue-600 focus:ring-blue-500 w-3 h-3 sm:w-4 sm:h-4" />
                        <LinkIcon size={14} className="text-gray-400"/> Pegar URL
                      </label>
                      <label className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-gray-700 cursor-pointer">
                        <input type="radio" name="tipoImagen" checked={tipoImagen === 'archivo'} onChange={() => setTipoImagen('archivo')} className="text-blue-600 focus:ring-blue-500 w-3 h-3 sm:w-4 sm:h-4" />
                        <UploadCloud size={14} className="text-gray-400"/> Subir de PC
                      </label>
                    </div>
                    {tipoImagen === 'url' ? (
                      <input type="text" placeholder="https://ejemplo.com/foto.jpg" className="w-full border border-gray-200 p-2 sm:p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white text-xs sm:text-sm" value={formData.imagen_url} onChange={e => setFormData({...formData, imagen_url: e.target.value})} />
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex">
                        <input type="file" accept="image/*" onChange={e => setImagenFile(e.target.files[0])} className="w-full text-[10px] sm:text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-none file:border-0 file:text-[10px] sm:file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">SKU / Código</label>
                      <input type="text" placeholder="PROD-001" className="w-full border border-gray-200 p-2 md:p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700 mt-1 uppercase bg-white text-xs md:text-sm" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Precio (S/) *</label>
                      <input type="number" step="0.01" required placeholder="0.00" className="w-full border border-gray-200 p-2 md:p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-black text-emerald-600 mt-1 bg-white text-xs md:text-sm" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 p-3 sm:p-4 rounded-xl border border-slate-100">
                <h3 className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Store size={14}/> Distribución de Stock</h3>
                {sucursales.length === 0 ? (
                  <div className="text-[10px] sm:text-xs text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100 font-medium">Aún no has creado Sucursales.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                        <div key={suc.id} className="bg-white border border-gray-200 p-2 rounded-lg shadow-sm group">
                          <label className="text-[9px] sm:text-[10px] font-extrabold text-gray-500 group-hover:text-blue-600 uppercase block mb-1 truncate transition-colors" title={suc.nombre}>{suc.nombre}</label>
                          <input type="number" min="0" placeholder="0 un." className="w-full bg-slate-50 border border-slate-100 rounded p-1.5 text-xs sm:text-sm font-black text-gray-800 outline-none focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all" value={formData.stock_sucursales[suc.id] || ''} onChange={(e) => handleStockChange(suc.id, e.target.value)} />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </form>

            {/* FOOTER FIJO */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0 rounded-b-3xl">
              <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors text-sm shadow-sm">
                Cancelar
              </button>
              <button type="submit" form="productForm" className="flex-1 py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/30 transition-colors flex items-center justify-center gap-2 text-sm">
                {formData.id ? <><CheckCircle size={16}/> Actualizar</> : <><Plus size={16}/> Guardar</>}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL IMPORTAR JSON */}
      {modalImportarOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden"></div>
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
               <h2 className="text-base font-extrabold text-gray-800 flex items-center gap-2"><FileJson className="text-blue-600" size={18}/> Importar JSON</h2>
               <button onClick={() => setModalImportarOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-full"><X size={16}/></button>
            </div>
            <p className="text-xs text-gray-600 mb-3">Tu archivo debe ser un arreglo <code className="bg-gray-100 px-1 rounded text-blue-600 font-bold">[]</code>:</p>
            <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto shadow-inner border border-slate-700 mb-5">
              <pre className="text-[10px] text-emerald-400 font-mono">
{`[
  {
    "nombre": "Producto",
    "precio": 90.00,
    "stock": 10,
    "categoria_id": 1
  }
]`}
              </pre>
            </div>
            <button onClick={() => fileInputRef.current.click()} className="w-full py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-600/30">
              <UploadCloud size={16}/> Seleccionar Archivo
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
        className={`flex items-center justify-between transition-all w-full bg-white border border-gray-200 rounded-xl px-3 text-slate-700 cursor-pointer shadow-sm ${className}`}
      >
        <span className="font-bold truncate">
          {label && <span className="text-gray-400 font-medium mr-1.5">{label}:</span>}
          {displayLabel}
        </span>
        <ChevronDown size={14} className={`text-gray-400 ml-2 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute mt-1 w-full min-w-[140px] rounded-xl shadow-xl border border-gray-100 bg-white top-full left-0 overflow-hidden animate-fade-in-down">
          <div className="max-h-60 overflow-y-auto custom-scrollbar py-1">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors ${
                  value === option.value
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
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