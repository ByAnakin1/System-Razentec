import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Plus, Trash2, X, AlertTriangle, Search, CheckCircle, ShoppingCart, FileText, Eye, Store, Building2, MapPin, Package, Image as ImageIcon, CalendarDays, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const Compras = () => {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [detalleCompraOpen, setDetalleCompraOpen] = useState(false);
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);

  const [proveedorId, setProveedorId] = useState('');
  const [comprobante, setComprobante] = useState('');
  const [cart, setCart] = useState([]);
  const [busquedaProd, setBusquedaProd] = useState('');

  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);
  const esVistaGlobal = sucursalActiva?.id === 'ALL';

  const [usuarioActual, setUsuarioActual] = useState(JSON.parse(localStorage.getItem('usuario') || '{}'));
  
  const baseURL = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:3000';
  const renderImagen = (path) => {
    if (!path) return null;
    if (path.startsWith('data:image') || path.startsWith('http')) return path;
    return `${baseURL}${path}`;
  };

  const getCategoriasSeguras = () => {
    try {
      let cat = usuarioActual?.categorias;
      if (typeof cat === 'string') cat = JSON.parse(cat);
      if (typeof cat === 'string') cat = JSON.parse(cat);
      return Array.isArray(cat) ? cat : [];
    } catch(e) { return []; }
  };
  const tienePermisoCrear = usuarioActual?.rol === 'Administrador' || getCategoriasSeguras().includes('Modificador') || getCategoriasSeguras().includes('Modificador_Compras');

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCompras = async () => {
    const currentSucursal = JSON.parse(localStorage.getItem('sucursalActiva'));
    if (!currentSucursal) {
      setCompras([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get('/compras');
      setCompras(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      showToast('error', 'Error al cargar el historial de compras');
      setCompras([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchCompras(); 
    
    const handleSucursalCambiada = () => {
      setSucursalActiva(JSON.parse(localStorage.getItem('sucursalActiva')));
      fetchCompras(); 
    };
    window.addEventListener('sucursalCambiada', handleSucursalCambiada);
    return () => window.removeEventListener('sucursalCambiada', handleSucursalCambiada);
  }, []);

  // ✨ FIX: Cerrar modales con ESC ✨
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        setDetalleCompraOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  // ✨ FIX: Cerrar al dar clic afuera ✨
  const handleOverlayClick = (e, closeFunc) => {
    if (e.target === e.currentTarget) closeFunc();
  };

  const openModal = async () => {
    setIsModalOpen(true);
    setProveedorId('');
    setComprobante('');
    setCart([]);
    setBusquedaProd('');
    
    try {
      const [provRes, prodRes] = await Promise.all([
        api.get('/proveedores?estado=activos'),
        api.get('/productos?estado=activos')
      ]);
      setProveedores(provRes.data);
      setProductos(prodRes.data);
    } catch (error) {
      showToast('error', 'Error al cargar catálogos. Verifica tu conexión.');
    }
  };

  const openDetalleCompra = async (id) => {
    try {
      const res = await api.get(`/compras/${id}`);
      setCompraSeleccionada(res.data);
      setDetalleCompraOpen(true);
    } catch (error) {
      showToast('error', 'Error al cargar los detalles de esta compra.');
    }
  };

  const productosFiltrados = productos.filter(p => 
    busquedaProd && (p.nombre.toLowerCase().includes(busquedaProd.toLowerCase()) || (p.codigo && p.codigo.toLowerCase().includes(busquedaProd.toLowerCase())))
  );

  const agregarAlCarrito = (producto) => {
    const existe = cart.find(item => item.producto_id === producto.id);
    if (existe) {
      const nuevoCarrito = cart.map(item => 
        item.producto_id === producto.id 
          ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precio_unitario } 
          : item
      );
      setCart(nuevoCarrito);
    } else {
      setCart([...cart, {
        producto_id: producto.id,
        nombre: producto.nombre,
        codigo: producto.codigo,
        imagen: producto.imagen,
        cantidad: 1,
        precio_unitario: 0,
        subtotal: 0
      }]);
    }
    setBusquedaProd(''); 
  };

  const actualizarItem = (index, campo, valor) => {
    const val = parseFloat(valor) || 0;
    const nuevoCarrito = [...cart];
    nuevoCarrito[index][campo] = val;
    nuevoCarrito[index].subtotal = nuevoCarrito[index].cantidad * nuevoCarrito[index].precio_unitario;
    setCart(nuevoCarrito);
  };

  const eliminarDelCarrito = (index) => {
    const nuevoCarrito = cart.filter((_, i) => i !== index);
    setCart(nuevoCarrito);
  };

  const calcularTotal = () => cart.reduce((acc, item) => acc + item.subtotal, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proveedorId) return showToast('error', 'Selecciona un proveedor');
    if (cart.length === 0) return showToast('error', 'Agrega al menos un producto a la compra');
    
    const invalidItem = cart.find(item => item.cantidad <= 0 || item.precio_unitario < 0);
    if (invalidItem) return showToast('error', 'Las cantidades deben ser mayores a 0 y los precios válidos');

    const payload = {
      proveedor_id: proveedorId,
      comprobante: comprobante,
      total: calcularTotal(),
      detalles: cart
    };

    try {
      await api.post('/compras', payload);
      showToast('success', '¡Compra registrada y stock actualizado!');
      setIsModalOpen(false);
      fetchCompras(); 
    } catch (error) {
      showToast('error', error.response?.data?.error || 'Ocurrió un error al procesar la compra');
    }
  };

  return (
    <Layout title="Compras" moduleIcon={<ShoppingCart/>}>
      {toast && (
        <div className={`fixed top-4 right-4 md:top-auto md:bottom-10 md:right-10 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-white animate-fade-in-down md:animate-fade-in-up backdrop-blur-xl border border-white/20 ${toast.type === 'success' ? 'bg-emerald-600/95' : 'bg-red-600/95'}`}>
          {toast.type === 'success' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
          <p className="font-bold text-xs tracking-wide">{toast.message}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
        <p className="text-[10px] md:text-xs text-gray-500 dark:text-blue-300/70 font-extrabold px-1 uppercase tracking-widest transition-colors">
           {esVistaGlobal ? 'Historial Global' : `Sede: ${sucursalActiva?.nombre || 'Ninguna'}`}
        </p>

        {esVistaGlobal ? (
          <div className="bg-amber-50/80 dark:bg-amber-900/30 border border-amber-200/50 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-sm animate-pulse w-full sm:w-auto backdrop-blur-md transition-colors">
            <AlertTriangle size={14}/> Cambia de sucursal para registrar
          </div>
        ) : sucursalActiva && tienePermisoCrear ? (
          <button onClick={openModal} className="bg-blue-600/90 dark:bg-blue-600 text-white px-5 py-3 sm:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 w-full sm:w-auto active:scale-95 shrink-0 text-xs md:text-sm border border-transparent dark:border-white/10 backdrop-blur-md">
            <Plus size={16} /> <span className="sm:hidden lg:inline">Registrar Ingreso</span><span className="hidden sm:inline lg:hidden">Ingreso</span>
          </button>
        ) : null}
      </div>

      {/* VISTA TÁCTIL (Móvil y Tablet) */}
      <div className="lg:hidden flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-blue-300/70">
             <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
             <p className="text-[10px] font-extrabold uppercase tracking-widest transition-colors">Cargando compras...</p>
          </div>
        ) : !sucursalActiva ? (
          <div className="text-center py-10 text-xs text-red-500 bg-red-50/80 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-500/20 backdrop-blur-md transition-colors">
            ⚠️ Sin sucursal asignada.
          </div>
        ) : compras.length === 0 ? (
          <div className="text-center py-16 bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] border border-gray-100/50 dark:border-white/5 shadow-sm flex flex-col items-center transition-colors">
            <ShoppingCart size={48} className="text-gray-300 dark:text-slate-600 mb-3" strokeWidth={1.5}/>
            <p className="text-sm font-black text-gray-600 dark:text-white">Aún no hay ingresos registrados</p>
            <p className="text-xs text-gray-400 dark:text-slate-400 mt-1 font-medium">Toca en "Registrar Ingreso" para comenzar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {compras.map((compra) => (
              <div key={compra.id} className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-xl rounded-[1.5rem] border border-gray-100/50 dark:border-white/5 p-4 shadow-sm relative group overflow-hidden transition-colors">
                 <div className="flex justify-between items-start mb-3 border-b border-dashed border-gray-200/50 dark:border-slate-700 pb-3 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-500/20 flex items-center justify-center shrink-0 backdrop-blur-md transition-colors">
                          <FileText size={18}/>
                       </div>
                       <div>
                         <p className="font-extrabold text-gray-800 dark:text-white text-xs md:text-sm truncate max-w-[150px] md:max-w-[200px] transition-colors">{compra.proveedor_nombre || 'Proveedor S/D'}</p>
                         <p className="text-[9px] md:text-[10px] font-bold text-gray-400 dark:text-slate-400 flex items-center gap-1 mt-0.5 uppercase tracking-wider transition-colors">{new Date(compra.created_at).toLocaleDateString('es-PE', {day:'2-digit', month:'short', year:'2-digit', hour:'2-digit', minute:'2-digit'})}</p>
                       </div>
                    </div>
                    <div className="text-right">
                      <span className="bg-emerald-50/80 dark:bg-emerald-900/30 backdrop-blur-md text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase tracking-wider mb-1 inline-block transition-colors">{compra.estado}</span>
                      <p className="font-black text-gray-800 dark:text-white text-sm md:text-base leading-none transition-colors">S/ {parseFloat(compra.total).toFixed(2)}</p>
                    </div>
                 </div>

                 <div className="bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-gray-100 dark:border-white/5 mb-3 flex items-center gap-2 backdrop-blur-md transition-colors">
                    <FileText size={12} className="text-gray-400 dark:text-slate-500 shrink-0"/>
                    <span className="text-[10px] md:text-[11px] font-bold text-gray-600 dark:text-slate-300 truncate transition-colors">Doc: {compra.comprobante || 'S/C'}</span>
                 </div>

                 {esVistaGlobal && (
                   <div className="mb-3">
                     <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-purple-700 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-900/30 backdrop-blur-md border border-purple-100/50 dark:border-purple-500/20 px-2 py-1 rounded w-fit transition-colors">
                       <Store size={10}/> {compra.sucursal_nombre || 'Local no asignado'}
                     </span>
                   </div>
                 )}

                 <button onClick={() => openDetalleCompra(compra.id)} className="w-full py-2.5 bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100/50 dark:border-blue-500/20 rounded-xl font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center justify-center gap-1.5 transition-colors backdrop-blur-md active:scale-95">
                   <Eye size={14}/> Ver Detalle
                 </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VISTA PC: Tabla (Liquid Glass) */}
      <div className="hidden lg:block bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/80 dark:border-white/5 overflow-hidden transition-colors duration-300">
        <div className={`overflow-x-auto ${hideScrollbar}`}>
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 dark:bg-blue-950/30 text-slate-500 dark:text-blue-300 uppercase font-extrabold tracking-widest text-[10px] border-b border-gray-200/50 dark:border-white/5 transition-colors">
              <tr>
                <th className="px-6 py-5">Fecha</th>
                <th className="px-6 py-5">Proveedor</th>
                {esVistaGlobal && <th className="px-6 py-5">Sucursal Destino</th>}
                <th className="px-6 py-5">Comprobante</th>
                <th className="px-6 py-5 text-center">Estado</th>
                <th className="px-6 py-5 text-right">Total</th>
                <th className="px-6 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50 dark:divide-white/5 relative">
              {loading ? (
                 <tr><td colSpan={esVistaGlobal ? "7" : "6"} className="text-center py-12 text-gray-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest transition-colors">Cargando historial...</td></tr>
              ) : !sucursalActiva ? (
                 <tr><td colSpan={esVistaGlobal ? "7" : "6"} className="text-center py-12 text-red-500 font-bold transition-colors">⚠️ Sin sucursal asignada.</td></tr>
              ) : compras.length === 0 ? (
                 <tr><td colSpan={esVistaGlobal ? "7" : "6"} className="text-center py-12 font-medium text-gray-400 dark:text-slate-500 transition-colors">No hay compras registradas.</td></tr>
              ) : (
                compras.map((compra) => (
                  <tr key={compra.id} className="hover:bg-white/40 dark:hover:bg-blue-900/10 transition-colors duration-200 group">
                    <td className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest transition-colors">
                      {new Date(compra.created_at).toLocaleDateString('es-PE', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-800 dark:text-white transition-colors">{compra.proveedor_nombre || 'S/D'}</td>
                    
                    {esVistaGlobal && (
                      <td className="px-6 py-5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-900/30 border border-purple-100/50 dark:border-purple-500/20 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 w-fit transition-colors">
                          <Store size={12}/> {compra.sucursal_nombre || 'Desconocida'}
                        </span>
                      </td>
                    )}

                    <td className="px-6 py-5">
                      <span className="bg-white/50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-300 px-2.5 py-1 rounded-md text-[10px] font-bold border border-gray-200/50 dark:border-white/5 tracking-wider backdrop-blur-md transition-colors">
                        {compra.comprobante || 'S/C'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/20 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest backdrop-blur-md transition-colors">
                        {compra.estado}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-gray-800 dark:text-white transition-colors">S/ {parseFloat(compra.total).toFixed(2)}</td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center transition-opacity">
                        <button 
                          onClick={() => openDetalleCompra(compra.id)}
                          className="px-3 py-2 bg-blue-50/80 dark:bg-blue-900/30 border border-blue-100/50 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 backdrop-blur-md rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-colors active:scale-95"
                          title="Ver detalle"
                        >
                          <Eye size={14} /> Detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✨ MODAL DETALLE DE COMPRA (LIQUID GLASS + SCROLL FIJO) ✨ */}
      {detalleCompraOpen && compraSeleccionada && (
        <div onMouseDown={(e) => handleOverlayClick(e, () => setDetalleCompraOpen(false))} className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md transition-colors animate-fade-in">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl p-5 sm:p-8 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full sm:max-w-3xl shadow-2xl border border-white/50 dark:border-white/10 animate-fade-in-up flex flex-col h-[90vh] md:max-h-[85vh] transition-colors">
            
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>
            
            <div className="flex justify-between items-start mb-4 border-b border-gray-100/50 dark:border-white/5 pb-4 shrink-0 transition-colors">
              <div>
                <h2 className="text-lg md:text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                  <FileText className="text-blue-600 dark:text-blue-400" size={20}/> Ingreso de Mercadería 
                </h2>
                <p className="text-[10px] text-gray-500 dark:text-blue-300/70 font-bold mt-1 tracking-widest uppercase transition-colors">Registro N° {compraSeleccionada.compra.id}</p>
              </div>
              <button onClick={() => setDetalleCompraOpen(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors border border-transparent dark:border-white/5"><X size={18}/></button>
            </div>

            <div className={`overflow-y-auto flex-1 pb-2 ${hideScrollbar}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-5">
                <div className="p-4 border border-gray-100/50 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-xl transition-colors">
                  <h3 className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 border border-blue-100/50 dark:border-blue-500/20 px-2 py-0.5 rounded w-fit uppercase tracking-widest flex items-center gap-1 mb-2 transition-colors"><Building2 size={10}/> PROVEEDOR</h3>
                  <p className="text-sm font-bold text-gray-800 dark:text-white transition-colors">{compraSeleccionada.compra.proveedor_nombre || 'No Especificado'}</p>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium mt-0.5 transition-colors">RUC: {compraSeleccionada.compra.proveedor_ruc || 'S/D'}</p>
                </div>

                <div className="p-4 border border-gray-100/50 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-xl relative transition-colors">
                  <div className="absolute top-4 right-4 bg-emerald-50/80 dark:bg-emerald-900/30 border border-emerald-100/50 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[8px] font-black px-2 py-1 rounded-md flex items-center gap-1 uppercase tracking-widest transition-colors">
                    <CheckCircle size={10}/> RECIBIDO
                  </div>
                  <h3 className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 border border-blue-100/50 dark:border-blue-500/20 px-2 py-0.5 rounded w-fit uppercase tracking-widest flex items-center gap-1 mb-2 transition-colors"><CalendarDays size={10}/> DATOS DE COMPRA</h3>
                  <p className="text-[10px] font-bold text-gray-800 dark:text-white mb-1 transition-colors">Comprobante: <span className="font-medium text-gray-600 dark:text-slate-400">{compraSeleccionada.compra.comprobante || 'S/C'}</span></p>
                  <p className="text-[10px] font-bold text-gray-800 dark:text-white mb-1 transition-colors">Fecha: <span className="font-medium text-gray-600 dark:text-slate-400">{new Date(compraSeleccionada.compra.created_at).toLocaleString('es-PE')}</span></p>
                  <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-purple-700 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-900/30 border border-purple-100/50 dark:border-purple-500/20 px-2 py-1 rounded w-fit uppercase tracking-wider transition-colors">
                    <MapPin size={10}/> Destino: {compraSeleccionada.compra.sucursal_nombre || 'Local Principal'}
                  </div>
                </div>
              </div>

              <h3 className="text-[11px] font-extrabold text-gray-800 dark:text-white mb-2 border-l-4 border-blue-600 dark:border-blue-500 pl-2 uppercase tracking-wider transition-colors">Mercadería Ingresada</h3>
              {/* ✨ FIX: Contenedor con límite de altura para que los productos hagan scroll ✨ */}
              <div className="border border-gray-200/50 dark:border-white/5 rounded-xl overflow-hidden flex flex-col max-h-[35vh]">
                <div className={`overflow-y-auto ${hideScrollbar} flex-1`}>
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-gray-200/50 dark:border-white/5 text-slate-600 dark:text-slate-300 sticky top-0 backdrop-blur-md transition-colors">
                      <tr>
                        <th className="py-2.5 px-3 font-black uppercase text-[8px] tracking-widest text-center">Cant.</th>
                        <th className="py-2.5 px-3 font-black uppercase text-[8px] tracking-widest">Producto</th>
                        <th className="py-2.5 px-3 font-black uppercase text-[8px] tracking-widest text-center">Costo U.</th>
                        <th className="py-2.5 px-3 font-black uppercase text-[8px] tracking-widest text-right bg-gray-100/30 dark:bg-slate-900/30">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/50 dark:divide-white/5 text-gray-700 dark:text-slate-200 transition-colors">
                      {compraSeleccionada.detalles?.map((item, index) => (
                        <tr key={index} className="hover:bg-white/40 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-2 px-3 font-black text-blue-600 dark:text-blue-400 text-center bg-blue-50/30 dark:bg-blue-900/10 text-[10px] transition-colors">{item.cantidad}</td>
                          <td className="py-2 px-3 font-bold text-[10px] leading-tight"><p className="truncate max-w-[120px] md:max-w-[250px]" title={item.producto_nombre}>{item.producto_nombre}</p></td>
                          <td className="py-2 px-3 text-gray-600 dark:text-slate-300 font-medium text-center text-[10px] transition-colors">S/ {parseFloat(item.precio_unitario).toFixed(2)}</td>
                          <td className="py-2 px-3 font-black text-gray-900 dark:text-white text-right bg-gray-50/30 dark:bg-slate-800/20 text-[10px] transition-colors">S/ {parseFloat(item.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100/50 dark:border-white/5 pt-4 mt-2 shrink-0 transition-colors">
              <div className="bg-slate-900 dark:bg-slate-950 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-between shadow-md text-white border border-slate-800 dark:border-blue-900/50 transition-colors">
                <span className="text-[10px] md:text-xs font-black text-slate-400 dark:text-blue-400 uppercase tracking-widest transition-colors">Costo Total</span>
                <span className="text-xl md:text-2xl font-black text-emerald-400 tracking-tight transition-colors">S/ {parseFloat(compraSeleccionada.compra.total).toFixed(2)}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ✨ MODAL DE NUEVA COMPRA (LIQUID GLASS + SCROLL FIJO) ✨ */}
      {isModalOpen && (
        <div onMouseDown={(e) => handleOverlayClick(e, () => setIsModalOpen(false))} className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-0 md:p-4 transition-colors animate-fade-in">
          {/* ✨ FIX: Altura máxima definida para forzar el scroll interno ✨ */}
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl md:rounded-[2.5rem] w-full h-[95vh] md:h-[85vh] md:max-h-[800px] md:max-w-5xl shadow-2xl flex flex-col overflow-hidden border border-white/50 dark:border-white/10 transition-colors animate-fade-in-up">
            
            <div className="flex justify-between items-center p-4 md:p-5 border-b border-gray-100/50 dark:border-white/5 bg-transparent shrink-0 z-20 transition-colors">
               <h2 className="text-base md:text-lg font-black text-gray-800 dark:text-white flex items-center gap-2"><ShoppingCart className="text-blue-600 dark:text-blue-400" size={20}/> Ingreso de Mercadería</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors border border-transparent dark:border-white/5"><X size={18}/></button>
            </div>
            
            <div className="flex-1 min-h-0 flex flex-col md:flex-row bg-transparent">
               
               {/* LADO IZQUIERDO: Buscador y Carrito */}
               <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-gray-100/50 dark:border-white/5 relative transition-colors min-h-0">
                 
                 <div className="p-3 md:p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-gray-100/50 dark:border-white/5 shrink-0 relative z-10 shadow-sm transition-colors">
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-blue-400/70" size={16} />
                     <input 
                       type="text" 
                       placeholder="Buscar por Nombre o SKU..." 
                       className="w-full bg-white/80 dark:bg-blue-950/50 border border-gray-200/80 dark:border-white/10 pl-9 pr-8 py-2.5 md:py-3 rounded-xl outline-none focus:bg-white dark:focus:bg-blue-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all font-bold text-gray-800 dark:text-white text-xs md:text-sm shadow-sm backdrop-blur-md" 
                       value={busquedaProd} 
                       onChange={(e) => setBusquedaProd(e.target.value)} 
                     />
                     {busquedaProd && (
                       <button onClick={() => setBusquedaProd('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-white bg-gray-100 dark:bg-slate-800 rounded-full p-0.5 transition-colors">
                         <X size={14}/>
                       </button>
                     )}
                   </div>
                   
                   {busquedaProd && (
                     <div className={`absolute left-3 right-3 md:left-4 md:right-4 mt-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl border border-gray-200/50 dark:border-white/10 rounded-xl shadow-2xl z-30 max-h-[35vh] overflow-y-auto transition-colors ${hideScrollbar}`}>
                       {productosFiltrados.length === 0 ? (
                         <div className="p-6 text-center flex flex-col items-center">
                           <Package size={24} className="text-gray-300 dark:text-slate-600 mb-2"/>
                           <p className="text-gray-500 dark:text-slate-400 text-[10px] md:text-[11px] font-bold transition-colors">No hay coincidencias en esta sede.</p>
                         </div>
                       ) : (
                         productosFiltrados.map(prod => (
                           <div key={prod.id} onClick={() => agregarAlCarrito(prod)} className="p-2.5 md:p-3 border-b border-gray-100/50 dark:border-white/5 hover:bg-blue-50/50 dark:hover:bg-blue-900/30 cursor-pointer flex items-center gap-3 transition-colors group">
                             <div className="w-8 h-8 md:w-10 md:h-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-lg flex items-center justify-center shrink-0 border border-slate-100/50 dark:border-white/5 overflow-hidden transition-colors">
                                {prod.imagen ? <img src={renderImagen(prod.imagen)} className="w-full h-full object-cover"/> : <ImageIcon size={14} className="text-gray-300 dark:text-slate-500"/>}
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="font-bold text-[11px] md:text-xs text-gray-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 truncate transition-colors leading-tight">{prod.nombre}</p>
                               <p className="text-[8px] md:text-[9px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest mt-0.5 truncate transition-colors">{prod.codigo || 'S/C'}</p>
                             </div>
                             <div className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 p-1.5 rounded-md group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white dark:group-hover:text-white transition-colors shrink-0 border border-transparent dark:border-white/5">
                               <Plus size={14} />
                             </div>
                           </div>
                         ))
                       )}
                     </div>
                   )}
                 </div>

                 {/* ✨ FIX: El Carrito ahora hace scroll internamente sin desformar el modal ✨ */}
                 <div className={`flex-1 overflow-y-auto p-3 md:p-4 space-y-2 ${hideScrollbar}`}>
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[150px] md:min-h-[200px]">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-white/50 dark:bg-slate-800/30 backdrop-blur-md rounded-full flex items-center justify-center mb-3 border-[3px] border-white/80 dark:border-white/5 shadow-sm transition-colors">
                           <Package size={20} className="text-slate-300 dark:text-slate-500 md:w-6 md:h-6" />
                        </div>
                        <p className="text-[11px] md:text-xs font-bold text-gray-600 dark:text-slate-300 transition-colors">Lista de ingreso vacía</p>
                        <p className="text-[9px] md:text-[10px] text-gray-400 dark:text-slate-500 mt-1 text-center max-w-[200px] transition-colors">Busca productos arriba para agregarlos a la compra.</p>
                      </div>
                    ) : (
                      cart.map((item, index) => (
                        <div key={index} className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-2.5 md:p-3 rounded-2xl border border-gray-100/50 dark:border-white/5 shadow-sm flex flex-col gap-2 relative group overflow-hidden transition-colors">
                           
                           <div className="flex items-center gap-2">
                             <div className="w-8 h-8 md:w-10 md:h-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-lg flex items-center justify-center shrink-0 border border-slate-100/50 dark:border-white/5 overflow-hidden transition-colors">
                                {item.imagen ? <img src={renderImagen(item.imagen)} className="w-full h-full object-cover"/> : <ImageIcon size={12} className="text-gray-300 dark:text-slate-500"/>}
                             </div>
                             <div className="flex-1 min-w-0 pr-6">
                               <p className="font-bold text-gray-800 dark:text-white text-[10px] md:text-xs leading-tight line-clamp-2 transition-colors">{item.nombre}</p>
                               <p className="text-[8px] font-black text-gray-400 dark:text-blue-300/70 uppercase mt-0.5 transition-colors">{item.codigo || 'S/C'}</p>
                             </div>
                             
                             <button onClick={() => eliminarDelCarrito(index)} className="absolute top-2 right-2 p-1.5 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 bg-red-50/80 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors shrink-0 backdrop-blur-md">
                               <Trash2 size={12} className="md:w-3.5 md:h-3.5"/>
                             </button>
                           </div>
                           
                           <div className="flex items-center gap-2 mt-1 border-t border-gray-100/50 dark:border-white/5 pt-2 transition-colors">
                             <div className="flex flex-col flex-1">
                               <label className="text-[8px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase ml-0.5 block mb-0.5 transition-colors">Cantidad</label>
                               <div className="flex items-center bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-lg p-0.5 w-full justify-between transition-colors">
                                  <button type="button" onClick={() => actualizarItem(index, 'cantidad', Math.max(1, item.cantidad - 1))} className="w-6 h-6 flex items-center justify-center rounded-md bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 shadow-sm hover:text-blue-600 dark:hover:text-blue-400 border border-transparent dark:border-white/5 active:scale-90 transition-all shrink-0"><Minus size={12}/></button>
                                  <input type="number" min="1" className="w-8 md:w-10 text-center font-black text-[10px] md:text-xs text-gray-800 dark:text-white bg-transparent outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors" value={item.cantidad} onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)} />
                                  <button type="button" onClick={() => actualizarItem(index, 'cantidad', item.cantidad + 1)} className="w-6 h-6 flex items-center justify-center rounded-md bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 shadow-sm hover:text-blue-600 dark:hover:text-blue-400 border border-transparent dark:border-white/5 active:scale-90 transition-all shrink-0"><Plus size={12}/></button>
                               </div>
                             </div>
                             
                             <div className="flex flex-col flex-1">
                               <label className="text-[8px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase ml-1 block mb-0.5 transition-colors">Costo U. (S/)</label>
                               <div className="flex items-center bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-lg focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-blue-950/50 transition-colors overflow-hidden">
                                 <span className="pl-1.5 text-gray-400 dark:text-slate-500 font-black text-[9px] md:text-[10px] transition-colors">S/</span>
                                 <input 
                                   type="number" min="0" step="0.01" 
                                   className="w-full py-1.5 md:py-2 pl-1 pr-2 outline-none font-black text-gray-800 dark:text-white text-[10px] md:text-xs bg-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors" 
                                   value={item.precio_unitario} 
                                   onChange={(e) => actualizarItem(index, 'precio_unitario', e.target.value)} 
                                 />
                               </div>
                             </div>
                           </div>

                           <div className="mt-1 text-right border-t border-dashed border-gray-100/50 dark:border-white/5 pt-1.5 transition-colors">
                             <p className="font-black text-emerald-600 dark:text-emerald-400 text-[10px] md:text-[11px] transition-colors">Subtotal: S/ {item.subtotal.toFixed(2)}</p>
                           </div>
                        </div>
                      ))
                    )}
                 </div>
               </div>

               {/* LADO DERECHO: Proveedor y Checkout */}
               <div className="w-full md:w-[300px] lg:w-[340px] bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border-t md:border-t-0 md:border-l border-gray-100/50 dark:border-white/5 flex flex-col shrink-0 transition-colors md:overflow-hidden h-full">
                 <div className={`p-4 md:p-5 space-y-3 md:space-y-4 flex-1 overflow-y-auto ${hideScrollbar}`}>
                   <div>
                     <label className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1 bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-md border border-blue-100/50 dark:border-blue-500/20 w-fit px-2 py-0.5 rounded transition-colors"><Building2 size={10}/> Proveedor *</label>
                     <select className="w-full bg-white/80 dark:bg-slate-950/50 backdrop-blur-md border border-gray-200/80 dark:border-white/10 p-2.5 rounded-xl outline-none focus:bg-white dark:focus:bg-blue-950 focus:border-blue-400 dark:focus:border-blue-500 font-bold text-gray-700 dark:text-slate-200 text-[11px] md:text-sm transition-all shadow-sm" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
                       <option value="">-- Seleccionar Proveedor --</option>
                       {proveedores.map(prov => <option key={prov.id} value={prov.id}>{prov.razon_social}</option>)}
                     </select>
                   </div>
                   
                   <div>
                     <label className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1 bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-md border border-blue-100/50 dark:border-blue-500/20 w-fit px-2 py-0.5 rounded transition-colors"><FileText size={10}/> Comprobante</label>
                     <div className="relative">
                        <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 transition-colors" size={14} />
                        <input type="text" placeholder="Ej: F001-000234" className="w-full bg-white/80 dark:bg-slate-950/50 backdrop-blur-md border border-gray-200/80 dark:border-white/10 p-2.5 pl-8 rounded-xl outline-none focus:bg-white dark:focus:bg-blue-950 focus:border-blue-400 dark:focus:border-blue-500 font-bold text-gray-800 dark:text-white uppercase transition-all shadow-sm text-[11px] md:text-sm" value={comprobante} onChange={(e) => setComprobante(e.target.value)} />
                     </div>
                   </div>
                 </div>

                 <div className="p-4 md:p-5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-t border-gray-100/50 dark:border-white/5 shrink-0 pb-6 md:pb-5 transition-colors">
                   <div className="bg-slate-900 dark:bg-slate-950 p-3 md:p-4 rounded-xl border border-slate-800 dark:border-blue-900/50 shadow-md text-white text-center relative overflow-hidden mb-3 transition-colors">
                     <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-emerald-500 opacity-20 rounded-full blur-2xl pointer-events-none"></div>
                     <p className="text-[8px] md:text-[9px] font-extrabold text-slate-400 dark:text-blue-400 uppercase tracking-widest mb-0.5 relative z-10 transition-colors">Costo Total a Pagar</p>
                     <p className="text-xl md:text-2xl font-black text-emerald-400 tracking-tight relative z-10">S/ {calcularTotal().toFixed(2)}</p>
                   </div>
                   
                   <button onClick={handleSubmit} disabled={cart.length === 0} className="w-full bg-blue-600/90 dark:bg-blue-600 backdrop-blur-md disabled:bg-slate-300 disabled:dark:bg-slate-800 disabled:text-gray-500 disabled:dark:text-slate-500 disabled:border-transparent border border-white/10 text-white py-3 md:py-3.5 rounded-xl font-black text-xs md:text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/30 disabled:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-1.5">
                     <CheckCircle size={16}/> Confirmar Ingreso
                   </button>
                 </div>
               </div>

            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Compras;