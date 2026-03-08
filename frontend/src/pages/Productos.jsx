import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Package, Search, Plus, Edit, Trash2, X, CheckCircle, List, Grid, AlertTriangle, TrendingUp, BarChart3, Store, UploadCloud, Map } from 'lucide-react';

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
  const [formData, setFormData] = useState({ id: null, nombre: '', precio: '', codigo: '', categoria_id: '', imagen_url: '', stock_sucursales: {} });
  const [imagenFile, setImagenFile] = useState(null); 
  
  const fileInputRef = useRef(null);

  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);
  const esVistaGlobal = sucursalActiva?.id === 'ALL';

  const baseURL = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:3000';
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${baseURL}${path}`;
  };

  const fetchData = async () => {
    const currentSucursal = JSON.parse(localStorage.getItem('sucursalActiva'));
    
    // ✨ SI AÚN NO HAY SUCURSAL, PARAMOS LA CARGA (Evita el bucle infinito)
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataObj = new FormData();
      formDataObj.append('nombre', formData.nombre);
      formDataObj.append('precio', formData.precio);
      formDataObj.append('codigo', formData.codigo);
      formDataObj.append('categoria_id', formData.categoria_id);
      formDataObj.append('stock_sucursales', JSON.stringify(formData.stock_sucursales));
      
      if (imagenFile) formDataObj.append('imagen', imagenFile);
      else if (formData.imagen_url) formDataObj.append('imagen_url', formData.imagen_url);

      if (formData.id) await api.put(`/productos/${formData.id}`, formDataObj, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await api.post('/productos', formDataObj, { headers: { 'Content-Type': 'multipart/form-data' } });
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
        id: prod.id, nombre: prod.nombre || '', precio: prod.precio || '', 
        codigo: prod.codigo || '', categoria_id: prod.categoria_id || '', 
        imagen_url: prod.imagen || '', stock_sucursales: stockMap
      });
    } else {
      setFormData({ id: null, nombre: '', precio: '', codigo: '', categoria_id: '', imagen_url: '', stock_sucursales: {} });
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
        await api.post('/productos/granel', { productos: json });
        alert("Productos importados con éxito");
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
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2 text-gray-800"><Package className="text-blue-600"/> Gestión de Inventario</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {esVistaGlobal ? 'Viendo catálogo global de la empresa' : (sucursalActiva ? `Viendo inventario de: ${sucursalActiva.nombre}` : 'No hay sucursal seleccionada')}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm w-fit">
        <button onClick={() => setTabActiva('catalogo')} className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-colors ${tabActiva === 'catalogo' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>
          <List size={16}/> Catálogo Operativo
        </button>
        {esVistaGlobal && (
          <button onClick={() => setTabActiva('control')} className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-colors ${tabActiva === 'control' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>
            <BarChart3 size={16}/> Monitores Globales
          </button>
        )}
      </div>

      {tabActiva === 'catalogo' && (
        <div className="animate-fade-in">
          <div className="flex flex-col lg:flex-row gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
              <input type="text" placeholder="Buscar producto o SKU..." className="w-full bg-slate-50 border border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-blue-500" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <select className="border border-gray-200 bg-slate-50 text-slate-700 p-2.5 rounded-xl outline-none text-sm font-bold" value={filtroEstado} onChange={(e) => setFiltradoEstado(e.target.value)}>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
                <option value="todos">Todos</option>
              </select>
              
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button onClick={() => setVista('tabla')} className={`p-1.5 rounded-lg transition-all ${vista === 'tabla' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}><List size={18}/></button>
                <button onClick={() => setVista('galeria')} className={`p-1.5 rounded-lg transition-all ${vista === 'galeria' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}><Grid size={18}/></button>
              </div>

              <button onClick={() => fileInputRef.current.click()} className="bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 border border-emerald-200 hover:bg-emerald-100 transition-all">
                <UploadCloud size={18}/> Importar JSON
              </button>
              <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImportJSON} />

              <button onClick={() => abrirModal()} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all">
                <Plus size={18}/> Nuevo Producto
              </button>
            </div>
          </div>

          {vista === 'tabla' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Código</th>
                    <th className="px-6 py-4">Nombre del Producto</th>
                    <th className="px-6 py-4">Categoría</th> 
                    <th className="px-6 py-4 text-right">Precio Base</th>
                    <th className="px-6 py-4 text-center">{esVistaGlobal ? 'Stock Global' : 'Stock Local'}</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? <tr><td colSpan="6" className="text-center py-10 font-medium">Cargando catálogo...</td></tr> : 
                   !sucursalActiva ? <tr><td colSpan="6" className="text-center py-10 text-gray-400 font-medium bg-red-50">⚠️ No se ha detectado sucursal. Comunícate con el Administrador.</td></tr> :
                   productosFiltrados.length === 0 ? <tr><td colSpan="6" className="text-center py-10 italic text-gray-400">No hay productos disponibles.</td></tr> :
                   productosFiltrados.map((prod) => {
                    const stockVisual = parseInt(prod.stock || 0);
                    return (
                    <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-gray-400 tracking-wider">{prod.codigo || '---'}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{prod.nombre}</td>
                      <td className="px-6 py-4"><span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">{prod.categoria_nombre || 'General'}</span></td>
                      <td className="px-6 py-4 text-right font-extrabold text-emerald-700">S/ {parseFloat(prod.precio).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${stockVisual > 10 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : stockVisual > 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {stockVisual} un.
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => abrirModal(prod)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded mr-2"><Edit size={16}/></button>
                        <button onClick={() => handleDelete(prod.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                   )})}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {!sucursalActiva ? (
                <div className="col-span-full text-center py-10 text-red-500 font-medium bg-red-50 rounded-2xl border border-red-200">
                  ⚠️ No tienes ninguna sucursal autorizada. Pídele al Administrador que te asigne una desde el menú Cuentas.
                </div>
              ) : productosFiltrados.map((prod) => {
                const stockVisual = parseInt(prod.stock || 0);
                return (
                <div key={prod.id} className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all flex flex-col group overflow-hidden">
                  <div className="h-48 bg-white border-b border-slate-100 flex items-center justify-center p-4 relative">
                    {prod.imagen ? (
                      <img src={getImageUrl(prod.imagen)} alt={prod.nombre} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="text-slate-300 flex flex-col items-center"><Package size={48} strokeWidth={1.5} /></div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-[10px] font-extrabold text-slate-400 mb-1 tracking-widest uppercase">{prod.codigo || 'SIN CÓDIGO'}</p>
                    <h3 className="font-extrabold text-slate-800 text-sm leading-tight mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">{prod.nombre}</h3>
                    <div className="mt-auto flex justify-between items-end pt-4">
                      <span className="text-xl font-black text-emerald-600">S/ {parseFloat(prod.precio).toFixed(2)}</span>
                      <span className={`text-xs font-extrabold px-2.5 py-1 rounded-md ${stockVisual > 0 ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>Stock: {stockVisual} un.</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-extrabold uppercase text-purple-700 bg-purple-100 px-2.5 py-1.5 rounded-lg border border-purple-200 flex items-center gap-1">
                      <Store size={12}/> {esVistaGlobal ? 'Global' : sucursalActiva?.nombre}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => abrirModal(prod)} className="p-2 bg-white text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg border border-slate-200 shadow-sm transition-colors"><Edit size={16}/></button>
                      <button onClick={() => handleDelete(prod.id)} className="p-2 bg-white text-red-500 hover:bg-red-600 hover:text-white rounded-lg border border-slate-200 shadow-sm transition-colors"><Trash2 size={16}/></button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-600 flex justify-between items-center">
              <div>
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-1">Total en Stock Global</p>
                <p className="text-3xl font-black text-slate-800">{totalStock}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><Package size={28}/></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-yellow-500 flex justify-between items-center">
              <div>
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-1">Productos con Alertas</p>
                <p className="text-3xl font-black text-slate-800">{stockBajo}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-2xl text-yellow-600"><AlertTriangle size={28}/></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-emerald-500 flex justify-between items-center">
              <div>
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-1">Catálogo Total</p>
                <p className="text-3xl font-black text-slate-800">{productos.length}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><TrendingUp size={28}/></div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-extrabold text-gray-800 mb-6 flex items-center gap-2"><BarChart3 className="text-blue-600"/> Distribución Física por Sucursal</h3>
            <div className="h-64 flex items-end gap-4 border-b border-gray-200 pb-2 overflow-x-auto">
              {Object.keys(stockPorSucursal).length === 0 ? (
                 <p className="text-gray-400 font-medium m-auto">No hay stock distribuido aún.</p>
              ) : (
                Object.entries(stockPorSucursal).map(([sucursal, cantidad], idx) => {
                  const heightPercentage = (cantidad / maxStockChart) * 100;
                  const barColor = idx % 2 === 0 ? 'bg-blue-500' : 'bg-purple-500';
                  return (
                    <div key={sucursal} className="flex flex-col items-center justify-end flex-1 min-w-[80px] group">
                      <span className="text-xs font-bold text-gray-500 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{cantidad} un.</span>
                      <div className={`w-full max-w-[80px] rounded-t-lg transition-all duration-700 ease-in-out hover:brightness-110 ${barColor}`} style={{ height: `${heightPercentage}%`, minHeight: '20px' }}></div>
                      <span className="text-[10px] font-extrabold text-gray-600 mt-3 text-center truncate w-full px-1">{sucursal}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CON DISTRIBUCIÓN MULTI-SUCURSAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 animate-fade-in-up border border-white/50 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-extrabold text-gray-800">{formData.id ? 'Editar Catálogo e Inventario' : 'Registrar Nuevo Producto'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-100 p-2 rounded-full"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Package size={14}/> Datos Base</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Nombre del Producto *</label>
                    <input type="text" required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium mt-1 bg-white" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Código / SKU</label>
                      <input type="text" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700 mt-1 uppercase bg-white" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Categoría</label>
                      <select className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium mt-1 bg-white" value={formData.categoria_id} onChange={e => setFormData({...formData, categoria_id: e.target.value})}>
                        <option value="">-- Sin categoría --</option>
                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Precio Base (S/.) *</label>
                      <input type="number" step="0.01" required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-emerald-600 mt-1 bg-white" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Imagen (Sube foto)</label>
                      <div className="flex bg-white rounded-xl mt-1 border border-gray-200 overflow-hidden">
                         <input type="file" accept="image/*" onChange={e => setImagenFile(e.target.files[0])} className="w-full text-xs p-2 text-gray-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                <h3 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-4 flex items-center gap-2"><Store size={14}/> Distribución Física de Stock</h3>
                
                {sucursales.length === 0 ? (
                  <div className="text-sm text-blue-600 bg-white p-4 rounded-xl border border-blue-200 font-medium">
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
                        <div key={suc.id} className="bg-white border border-blue-200 p-3 rounded-xl shadow-sm">
                          <label className="text-[10px] font-extrabold text-blue-800 uppercase block mb-1 truncate" title={suc.nombre}>{suc.nombre}</label>
                          <input 
                            type="number" 
                            min="0"
                            placeholder="0 un."
                            className="w-full bg-blue-50 border-none rounded-lg p-2 text-sm font-black text-gray-800 outline-none focus:ring-2 focus:ring-blue-400"
                            value={formData.stock_sucursales[suc.id] || ''}
                            onChange={(e) => handleStockChange(suc.id, e.target.value)}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white font-black text-lg py-4 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors">
                {formData.id ? 'Confirmar y Actualizar' : 'Guardar Producto en Catálogo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Productos;