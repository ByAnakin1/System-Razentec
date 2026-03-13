import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Package, Search, Plus, Edit, Trash2, X, List, Grid, AlertTriangle, TrendingUp, BarChart3, Store, UploadCloud, FileJson, Image as ImageIcon, Link as LinkIcon, ChevronDown, ReceiptText, Star } from 'lucide-react';

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

  // ✨ AQUÍ ESTABA EL ERROR: Faltaba la palabra "const"
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
    } catch (err) { alert('Error al guardar el producto'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este producto?")) {
      try { await api.delete(`/productos/${id}`); fetchData(); } catch (err) { alert('Error al eliminar'); }
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
        alert("Productos importados con éxito");
        setModalImportarOpen(false);
        fetchData();
      } catch (error) { alert("Error al importar el JSON. Verifica el formato."); }
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
      
      <p className="text-sm md:text-base text-gray-500 font-medium mb-6 px-1">
          {esVistaGlobal ? 'Viendo catálogo global de la empresa' : (sucursalActiva ? `Viendo inventario de: ${sucursalActiva.nombre}` : 'No hay sucursal seleccionada')}
      </p>

      <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm w-fit overflow-x-auto max-w-full">
        <button onClick={() => setTabActiva('catalogo')} className={`flex items-center gap-2 px-4 md:px-5 py-2 rounded-lg font-bold text-xs md:text-sm transition-colors whitespace-nowrap ${tabActiva === 'catalogo' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>
          <List size={16}/> Catálogo Operativo
        </button>
        {esVistaGlobal && (
          <button onClick={() => setTabActiva('control')} className={`flex items-center gap-2 px-4 md:px-5 py-2 rounded-lg font-bold text-xs md:text-sm transition-colors whitespace-nowrap ${tabActiva === 'control' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>
            <BarChart3 size={16}/> Monitores Globales
          </button>
        )}
      </div>

      {tabActiva === 'catalogo' && (
        <div className="animate-fade-in">
          
          <div className="flex flex-col lg:flex-row gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
              <input type="text" placeholder="Buscar producto o SKU..." className="w-full bg-slate-50 border border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
               <CustomDropdown 
                label="Filtro"
                value={filtroEstado}
                onChange={setFiltradoEstado}
                options={[
                    {value: 'activos', label: 'Activos'},
                    {value: 'inactivos', label: 'Inactivos'},
                    {value: 'todos', label: 'Todos'}
                ]}
              />
              
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button onClick={() => setVista('tabla')} className={`p-1.5 rounded-lg transition-all ${vista === 'tabla' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><List size={18}/></button>
                <button onClick={() => setVista('galeria')} className={`p-1.5 rounded-lg transition-all ${vista === 'galeria' ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><Grid size={18}/></button>
              </div>

              <button onClick={() => setModalImportarOpen(true)} className="flex-1 lg:flex-none justify-center bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 border border-emerald-200 hover:bg-emerald-100 transition-all text-sm md:text-base">
                <UploadCloud size={18}/> <span className="hidden sm:inline">Importar</span> JSON
              </button>
              <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImportJSON} />

              <button onClick={() => abrirModal()} className="flex-1 lg:flex-none justify-center bg-blue-600 text-white px-4 md:px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all text-sm md:text-base">
                <Plus size={18}/> Nuevo
              </button>
            </div>
          </div>

          {vista === 'tabla' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto w-full">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Foto</th>
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4">Nombre del Producto</th>
                    <th className="px-6 py-4">Categoría</th> 
                    <th className="px-6 py-4 text-right">Precio Base</th>
                    <th className="px-6 py-4 text-center">{esVistaGlobal ? 'Stock Global' : 'Stock Local'}</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? <tr><td colSpan="7" className="text-center py-10 font-medium">Cargando catálogo...</td></tr> : 
                   !sucursalActiva ? <tr><td colSpan="7" className="text-center py-10 text-gray-400 font-medium bg-red-50">⚠️ No se ha detectado sucursal. Comunícate con el Administrador.</td></tr> :
                   productosFiltrados.length === 0 ? <tr><td colSpan="7" className="text-center py-10 italic text-gray-400">No hay productos disponibles.</td></tr> :
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
                      <td className="px-6 py-4"><span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">{prod.categoria_nombre || 'General'}</span></td>
                      <td className="px-6 py-4 text-right font-extrabold text-emerald-700">S/ {parseFloat(prod.precio).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${stockVisual > 10 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : stockVisual > 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {stockVisual} un.
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => abrirModal(prod)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded mr-2 transition-colors"><Edit size={16}/></button>
                        <button onClick={() => handleDelete(prod.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                   )})}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 lg:gap-6 gap-4">
              {!sucursalActiva ? (
                <div className="col-span-full text-center py-10 text-red-500 font-medium bg-red-50 rounded-2xl border border-red-200">
                  ⚠️ No tienes ninguna sucursal autorizada. Pídele al Administrador que te asigne una.
                </div>
              ) : productosFiltrados.map((prod) => {
                const stockVisual = parseInt(prod.stock || 0);
                return (
                <div key={prod.id} className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all flex flex-col group overflow-hidden">
                  <div className="h-32 md:h-48 bg-slate-50 border-b border-slate-100 flex items-center justify-center p-4 relative">
                    {prod.imagen ? (
                      <img src={renderImagen(prod.imagen)} alt={prod.nombre} className="max-w-full max-h-full object-contain drop-shadow-md rounded" />
                    ) : (
                      <div className="text-slate-300 flex flex-col items-center"><Package size={40} strokeWidth={1.5} /></div>
                    )}
                  </div>
                  <div className="p-3 md:p-5 flex-1 flex flex-col">
                    <p className="text-[9px] md:text-[10px] font-extrabold text-slate-400 mb-1 tracking-widest uppercase">{prod.codigo || 'SIN CÓDIGO'}</p>
                    <h3 className="font-extrabold text-slate-800 text-xs md:text-sm leading-tight mb-1 md:mb-2 group-hover:text-blue-600 transition-colors line-clamp-2" title={prod.nombre}>{prod.nombre}</h3>
                    <p className="text-[10px] md:text-xs text-gray-400 line-clamp-1 mb-2">{prod.descripcion || 'Sin descripción'}</p>
                    
                    <div className="mt-auto flex flex-col xl:flex-row xl:justify-between xl:items-end gap-1 pt-2 md:pt-3 border-t border-dashed border-gray-200">
                      <span className="text-base md:text-lg lg:text-xl font-black text-emerald-600">S/ {parseFloat(prod.precio).toFixed(2)}</span>
                      <span className={`text-[10px] md:text-xs font-extrabold px-2 py-0.5 md:px-2.5 md:py-1 rounded-md w-fit ${stockVisual > 0 ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                        {stockVisual} un.
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 md:p-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[9px] md:text-[10px] font-extrabold uppercase text-purple-700 bg-purple-100 px-1.5 md:px-2.5 py-1 md:py-1.5 rounded-lg border border-purple-200 flex items-center gap-1 truncate max-w-[80px] md:max-w-none">
                      <Store size={10} className="shrink-0"/> <span className="truncate">{esVistaGlobal ? 'Global' : sucursalActiva?.nombre}</span>
                    </span>
                    <div className="flex gap-1 md:gap-2 shrink-0">
                      <button onClick={() => abrirModal(prod)} className="p-1.5 md:p-2 bg-white text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg border border-slate-200 shadow-sm transition-colors"><Edit size={14}/></button>
                      <button onClick={() => handleDelete(prod.id)} className="p-1.5 md:p-2 bg-white text-red-500 hover:bg-red-600 hover:text-white rounded-lg border border-slate-200 shadow-sm transition-colors"><Trash2 size={14}/></button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      )}

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

          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-base md:text-lg font-extrabold text-gray-800 mb-6 flex items-center gap-2"><BarChart3 className="text-blue-600"/> Distribución Física por Sucursal</h3>
            <div className="h-64 flex items-end gap-2 md:gap-4 border-b border-gray-200 pb-2 overflow-x-auto whitespace-nowrap w-full">
              {Object.keys(stockPorSucursal).length === 0 ? (
                 <p className="text-gray-400 font-medium m-auto">No hay stock distribuido aún.</p>
              ) : (
                Object.entries(stockPorSucursal).map(([sucursal, cantidad], idx) => {
                  const heightPercentage = (cantidad / maxStockChart) * 100;
                  const barColor = idx % 2 === 0 ? 'bg-blue-500' : 'bg-purple-500';
                  return (
                    <div key={sucursal} className="flex flex-col items-center justify-end flex-1 min-w-[60px] md:min-w-[80px] group h-full">
                      <span className="text-[10px] md:text-xs font-bold text-gray-500 mb-2 md:opacity-0 group-hover:opacity-100 transition-opacity">{cantidad} un.</span>
                      <div className={`w-full max-w-[60px] md:max-w-[80px] rounded-t-lg transition-all duration-700 ease-in-out hover:brightness-110 ${barColor}`} style={{ height: `${heightPercentage}%`, minHeight: '20px' }}></div>
                      <span className="text-[9px] md:text-[10px] font-extrabold text-gray-600 mt-2 md:mt-3 text-center truncate w-full px-1">{sucursal}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPORTAR JSON */}
      {modalImportarOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 md:p-8 animate-fade-in-up">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4">
               <h2 className="text-lg md:text-xl font-extrabold text-gray-800 flex items-center gap-2"><FileJson className="text-blue-600"/> Importar Productos (JSON)</h2>
               <button onClick={() => setModalImportarOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-100 p-2 rounded-full transition-colors"><X size={18}/></button>
            </div>
            
            <div className="mb-6">
              <p className="text-sm md:text-base text-gray-600 mb-3">
                Para evitar errores en la base de datos, tu archivo <b>.json</b> debe ser estrictamente una lista <code className="bg-gray-100 px-1 rounded text-blue-600 font-bold">[]</code> que contenga los productos. Aquí tienes un ejemplo:
              </p>
              
              <div className="bg-slate-900 rounded-xl p-4 md:p-5 overflow-x-auto shadow-inner border border-slate-700">
                <pre className="text-xs md:text-sm text-emerald-400 font-mono">
{`[
  {
    "nombre": "AMD Ryzen 7 5700G",
    "descripcion": "Procesador AMD 8 Núcleos",
    "codigo": "CPU-AMD-570G",
    "precio": 900.00,
    "stock": 11,
    "categoria_id": 1,
    "imagen_url": "https://ejemplo.com/foto.jpg"
  }
]`}
                </pre>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button onClick={() => setModalImportarOpen(false)} className="flex-1 py-3 md:py-3.5 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
              <button onClick={() => fileInputRef.current.click()} className="flex-1 py-3 md:py-3.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-colors">
                <UploadCloud size={20}/> Seleccionar Archivo .json
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR/EDITAR PRODUCTO */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 md:p-8 animate-fade-in-up border border-white/50 max-h-[95vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4 sticky top-0 bg-white z-10 pt-2">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                <Edit className="text-blue-600"/> {formData.id ? 'Editar Producto' : 'Registrar Nuevo Producto'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-100 p-2 rounded-full transition-colors"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="bg-slate-50/50 p-4 md:p-5 rounded-2xl border border-slate-200">
                <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Package size={14}/> Datos Principales</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Nombre *</label>
                      <input type="text" required placeholder="Ej: Micrófono HyperX" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800 mt-1 bg-white shadow-sm transition-shadow" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Categoría</label>
                       <CustomDropdown 
                         value={formData.categoria_id}
                         onChange={val => setFormData({...formData, categoria_id: val})}
                         options={[
                             {value: '', label: '-- Sin categoría --'},
                             ...categorias.map(c => ({value: c.id, label: c.nombre}))
                         ]}
                         placeholder="-- Elige una categoría --"
                       />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Descripción</label>
                    <textarea rows="2" placeholder="Detalles del producto..." className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium mt-1 bg-white shadow-sm resize-none text-gray-700" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})}></textarea>
                  </div>

                  <div className="border border-blue-100 bg-blue-50/30 p-4 rounded-xl space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Imagen del Producto</label>
                    <div className="flex gap-4 mb-3">
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer select-none">
                        <input type="radio" name="tipoImagen" checked={tipoImagen === 'url'} onChange={() => setTipoImagen('url')} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                        <LinkIcon size={16} className="text-gray-400"/> Pegar Link (URL)
                      </label>
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer select-none">
                        <input type="radio" name="tipoImagen" checked={tipoImagen === 'archivo'} onChange={() => setTipoImagen('archivo')} className="text-blue-600 focus:ring-blue-500 w-4 h-4" />
                        <UploadCloud size={16} className="text-gray-400"/> Subir desde PC
                      </label>
                    </div>
                    {tipoImagen === 'url' ? (
                      <input type="text" placeholder="https://ejemplo.com/foto.jpg" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium bg-white shadow-sm" value={formData.imagen_url} onChange={e => setFormData({...formData, imagen_url: e.target.value})} />
                    ) : (
                      <div className="bg-white border rounded-xl overflow-hidden flex shadow-sm">
                        <input type="file" accept="image/*" onChange={e => setImagenFile(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer transition-colors" />
                      </div>
                    )}
                    {tipoImagen === 'url' && renderImagen(formData.imagen_url) && <p className="text-xs text-blue-600 truncate mt-2">Imagen enlazada lista</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">SKU / Código</label>
                      <input type="text" placeholder="PROD-001" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700 mt-1 uppercase bg-white shadow-sm" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Precio (S/) *</label>
                      <input type="number" step="0.01" required placeholder="0.00" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-emerald-600 mt-1 bg-white shadow-sm" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 p-4 md:p-5 rounded-2xl border border-slate-200">
                <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Store size={14}/> Distribución Física de Stock</h3>
                
                {sucursales.length === 0 ? (
                  <div className="text-sm text-blue-600 bg-blue-50 p-4 rounded-xl border border-blue-100 font-medium">
                    Aún no has creado Sucursales. Ve al módulo "Sucursales" para crear tus locales.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                        <div key={suc.id} className="bg-white border border-gray-200 p-3 rounded-xl shadow-sm hover:border-blue-300 transition-colors group">
                          <label className="text-[10px] font-extrabold text-gray-600 group-hover:text-blue-600 uppercase block mb-1.5 truncate transition-colors" title={suc.nombre}>{suc.nombre}</label>
                          <input 
                            type="number" 
                            min="0"
                            placeholder="0 un."
                            className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-sm font-black text-gray-800 outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                            value={formData.stock_sucursales[suc.id] || ''}
                            onChange={(e) => handleStockChange(suc.id, e.target.value)}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3.5 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors order-2 sm:order-1">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-3.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/30 transition-colors order-1 sm:order-2 flex items-center justify-center gap-2">
                  {formData.id ? <><Edit size={18}/> Actualizar Producto</> : <><Plus size={18}/> Guardar Producto</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

// DROPDOWN PERSONALIZADO
const CustomDropdown = ({ label, value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(option => option.value === value);
  const displayLabel = selectedOption ? selectedOption.label : (placeholder || label || "Seleccionar");

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between transition-all w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-slate-700 shadow-sm cursor-pointer"
      >
        <span className="text-sm font-bold truncate max-w-[200px]">
          {label && <span className="text-gray-400 font-medium mr-1.5">{label}:</span>}
          {displayLabel}
        </span>
        <ChevronDown size={16} className={`text-gray-400 ml-3 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full min-w-[200px] rounded-2xl shadow-xl border border-gray-100 bg-white top-full left-0 overflow-hidden animate-fade-in-down">
          <div className="max-h-60 overflow-y-auto custom-scrollbar py-1.5">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center gap-3 transition-colors ${
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