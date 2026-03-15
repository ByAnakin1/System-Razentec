import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
// ✨ Agregamos Search a los íconos
import { Plus, Edit, Trash2, X, Tags, AlertTriangle, Eye, Store, ChevronDown, Package, Image as ImageIcon, Search } from 'lucide-react';

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

  // ✨ NUEVOS ESTADOS PARA LAS BÚSQUEDAS
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
    setBusquedaProducto(''); // Limpiamos la búsqueda anterior
    setModalDetalles(true);
    setLoadingProd(true);
    try {
      const res = await api.get('/productos?estado=activos');
      const prodsFiltrados = res.data.filter(p => p.categoria_id === cat.id);
      setProductosCat(prodsFiltrados);
    } catch (err) {
      console.error("Error al cargar productos de la categoría", err);
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

  // ✨ LÓGICA DE FILTRADO PARA AMBOS BUSCADORES ✨
  const categoriasFiltradas = categorias.filter(cat => 
    cat.nombre.toLowerCase().includes(busquedaCategoria.toLowerCase())
  );

  const productosCatFiltrados = productosCat.filter(prod => 
    (prod.nombre || '').toLowerCase().includes(busquedaProducto.toLowerCase()) ||
    (prod.codigo || '').toLowerCase().includes(busquedaProducto.toLowerCase())
  );

  return (
    <Layout title="Categorías" moduleIcon={<Tags/>}>
      
      {/* SUBTÍTULO */}
      <p className="text-[11px] md:text-sm text-gray-500 font-bold px-1 uppercase tracking-wider mb-3 md:mb-4">
        {esVistaGlobal ? 'Administración Global' : `Sede: ${sucursalActiva?.nombre || 'Ninguna'}`}
      </p>

      {/* ✨ CABECERA CON BUSCADOR PRINCIPAL Y BOTÓN ✨ */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 md:mb-6 gap-3">
        
        {/* Buscador General de Categorías */}
        <div className="w-full sm:w-1/2 lg:w-1/3 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
          <input 
            type="text" 
            placeholder="Buscar categoría..." 
            className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm" 
            value={busquedaCategoria} 
            onChange={e => setBusquedaCategoria(e.target.value)} 
          />
        </div>
        
        {/* Botón Nueva Categoría */}
        {puedeModificar && sucursalActiva && (
          <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-blue-600 text-white px-5 py-3 sm:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-blue-700 transition-all active:scale-95 shrink-0">
            <Plus size={18} /> <span className="sm:hidden lg:inline">Nueva Categoría</span><span className="hidden sm:inline lg:hidden">Nuevo</span>
          </button>
        )}
      </div>

      {/* VISTA LISTA MÓVILES */}
      <div className="md:hidden flex flex-col gap-3">
        {loading ? <p className="text-center py-10 text-xs font-medium">Cargando categorías...</p> : 
         !sucursalActiva ? <p className="text-center py-10 text-xs text-red-500 bg-red-50 rounded-xl">⚠️ Sin sucursal asignada.</p> :
         categoriasFiltradas.length === 0 ? <p className="text-center py-10 text-xs italic text-gray-400">No se encontraron categorías.</p> :
         categoriasFiltradas.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between shadow-sm relative overflow-hidden group">
             <div className="flex flex-col gap-1 w-[60%]">
               <h3 className="font-bold text-gray-800 text-sm truncate flex items-center gap-2">
                 <Tags size={14} className="text-gray-400 shrink-0"/> {cat.nombre}
               </h3>
               {esVistaGlobal && (
                 <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded w-fit truncate max-w-full">
                   {cat.sucursal_nombre || 'Global'}
                 </span>
               )}
             </div>
             
             <div className="flex gap-1.5 shrink-0">
               <button onClick={() => handleOpenDetalles(cat)} className="p-2 bg-slate-50 text-slate-600 rounded-lg active:bg-slate-100 transition-colors"><Eye size={16}/></button>
               {puedeModificar && (
                 <>
                   <button onClick={() => handleOpenModal(cat)} className="p-2 bg-blue-50 text-blue-600 rounded-lg active:bg-blue-100 transition-colors"><Edit size={16}/></button>
                   <button onClick={() => { setCatSeleccionada(cat); setModalEliminar(true); }} className="p-2 bg-red-50 text-red-600 rounded-lg active:bg-red-100 transition-colors"><Trash2 size={16}/></button>
                 </>
               )}
             </div>
          </div>
         ))}
      </div>

      {/* VISTA TABLA PC */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 uppercase font-bold tracking-wider text-[11px]">
            <tr>
              <th className="px-6 py-4">Nombre de Categoría</th>
              {esVistaGlobal && <th className="px-6 py-4">Sucursal Asignada</th>}
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <tr><td colSpan={esVistaGlobal ? "3" : "2"} className="text-center py-8 font-medium">Cargando...</td></tr> : 
             !sucursalActiva ? <tr><td colSpan={esVistaGlobal ? "3" : "2"} className="text-center py-10 text-gray-400 font-medium bg-red-50">⚠️ No se ha detectado sucursal autorizada.</td></tr> :
             categoriasFiltradas.length === 0 ? <tr><td colSpan={esVistaGlobal ? "3" : "2"} className="text-center py-8 font-medium text-gray-400">No se encontraron resultados para la búsqueda.</td></tr> :
             categoriasFiltradas.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-2"><Tags size={16} className="text-gray-400"/> {cat.nombre}</td>
                
                {esVistaGlobal && (
                  <td className="px-6 py-4">
                     <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded">
                       {cat.sucursal_nombre || 'No Asignada (Global)'}
                     </span>
                  </td>
                )}

                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => handleOpenDetalles(cat)} className="p-1.5 bg-slate-50 text-slate-600 rounded hover:bg-slate-100 transition-colors" title="Ver Productos"><Eye size={16}/></button>
                    {puedeModificar && (
                      <>
                        <button onClick={() => handleOpenModal(cat)} className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"><Edit size={16}/></button>
                        <button onClick={() => { setCatSeleccionada(cat); setModalEliminar(true); }} className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"><Trash2 size={16}/></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✨ MODAL DE DETALLES Y PRODUCTOS (Mini-Catálogo con Buscador) ✨ */}
      {modalDetalles && catSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-md transition-all animate-fade-in">
          <div className="bg-white p-5 sm:p-8 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl shadow-2xl animate-fade-in-up flex flex-col max-h-[90vh]">
            
            {/* Indicador de arrastre para móvil */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>
            
            {/* Header del Modal */}
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4 shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <Tags className="text-blue-600"/> {catSeleccionada.nombre}
                </h2>
                <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">
                  {catSeleccionada.sucursal_nombre || 'Categoría Global'}
                </p>
              </div>
              <button onClick={() => setModalDetalles(false)} className="text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"><X size={18}/></button>
            </div>

            {/* ✨ BUSCADOR DE PRODUCTOS DENTRO DE LA CATEGORÍA ✨ */}
            <div className="mb-3 shrink-0">
              <div className="relative">
                 <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                 <input 
                    type="text" 
                    placeholder="Buscar producto o SKU en esta categoría..." 
                    className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-xl text-xs md:text-sm outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors" 
                    value={busquedaProducto} 
                    onChange={e => setBusquedaProducto(e.target.value)} 
                 />
              </div>
            </div>

            {/* Cuerpo del Modal (Lista de Productos con Scroll) */}
            <div className="overflow-y-auto custom-scrollbar flex-1 -mx-2 px-2 pb-2">
              <h3 className="text-[11px] font-bold text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-2">
                <Package size={14}/> Productos en esta categoría ({productosCatFiltrados.length})
              </h3>

              {loadingProd ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-xs font-medium text-gray-500">Cargando productos...</p>
                </div>
              ) : productosCatFiltrados.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                  <Package size={40} className="mx-auto text-slate-300 mb-3 stroke-[1.5]"/>
                  <p className="text-sm font-bold text-gray-600">No se encontraron productos</p>
                  <p className="text-xs text-gray-400 mt-1">Intenta con otra búsqueda o agrega productos a esta categoría.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {productosCatFiltrados.map(prod => {
                    const stockVisual = parseInt(prod.stock || 0);
                    return (
                      <div key={prod.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-blue-200 transition-colors">
                         <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden">
                            {prod.imagen ? <img src={renderImagen(prod.imagen)} alt={prod.nombre} className="w-full h-full object-cover"/> : <ImageIcon size={20} className="text-gray-300"/>}
                         </div>
                         <div className="flex-1 min-w-0">
                           <h4 className="text-xs font-bold text-gray-800 truncate" title={prod.nombre}>{prod.nombre}</h4>
                           <p className="text-[9px] text-gray-400 font-extrabold tracking-wider uppercase mt-1">{prod.codigo || 'SIN CÓDIGO'}</p>
                         </div>
                         <div className="text-right shrink-0">
                           <p className="text-sm font-black text-emerald-600">S/ {parseFloat(prod.precio).toFixed(2)}</p>
                           <p className={`text-[9px] font-bold inline-block px-1.5 py-0.5 rounded mt-1 ${stockVisual > 0 ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>
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

      {/* MODAL CREAR / EDITAR */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-md transition-all animate-fade-in">
          <div className="bg-white p-6 sm:p-8 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl animate-fade-in-up">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden"></div>
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-800 flex items-center gap-2">
                {formData.id ? <Edit className="text-blue-600"/> : <Plus className="text-blue-600"/>} 
                {formData.id ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-colors"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Nombre de etiqueta *</label>
                <input placeholder="Ej: Laptops, Audífonos..." value={formData.nombre} onChange={e=>setFormData({...formData, nombre: e.target.value})} className="w-full border border-gray-200 p-3.5 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800 bg-slate-50 transition-all" required autoFocus/>
              </div>

              {esVistaGlobal && (
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Asignar a Sucursal</label>
                  <CustomDropdown 
                    value={formData.sucursal_id}
                    onChange={val => setFormData({...formData, sucursal_id: val})}
                    options={[
                        {value: '', label: '-- Global (Todas) --'},
                        ...sucursales.map(c => ({value: c.id, label: c.nombre}))
                    ]}
                    placeholder="Elige una sucursal"
                    className="w-full h-[52px] bg-slate-50 border-gray-200 shadow-none text-sm"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {modalEliminar && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-md transition-all animate-fade-in">
          <div className="bg-white p-6 sm:p-8 rounded-t-3xl sm:rounded-[2rem] w-full sm:max-w-sm text-center shadow-2xl animate-fade-in-up">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <Trash2 size={28}/>
            </div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">¿Eliminar Categoría?</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed">
              Se borrará la etiqueta <strong className="text-gray-800">"{catSeleccionada?.nombre}"</strong>. Los productos que la usan se quedarán sin categoría asignada.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalEliminar(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

// COMPONENTE DROPDOWN REUTILIZABLE
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
        className={`flex items-center justify-between transition-all w-full bg-white border border-gray-200 rounded-xl px-3 md:px-4 text-slate-700 cursor-pointer shadow-sm ${className}`}
      >
        <span className="text-xs md:text-sm font-bold truncate">
          {label && <span className="text-gray-400 font-medium mr-1.5">{label}:</span>}
          {displayLabel}
        </span>
        <ChevronDown size={16} className={`text-gray-400 ml-2 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute mt-2 w-full min-w-[140px] md:min-w-[180px] rounded-xl shadow-xl border border-gray-100 bg-white top-full left-0 overflow-hidden animate-fade-in-down z-50">
          <div className="max-h-60 overflow-y-auto custom-scrollbar py-1">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={`w-full text-left px-3 md:px-4 py-3 text-xs md:text-sm font-bold transition-colors ${
                  value == option.value
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

export default Categorias;