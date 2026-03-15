import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
// ✨ AQUÍ ESTÁ EL FIX: Agregué CalendarDays a la importación ✨
import { Plus, Trash2, X, AlertTriangle, Search, CheckCircle, ShoppingCart, FileText, Eye, Store, Building2, MapPin, Package, Image as ImageIcon, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
      {/* TOAST NOTIFICATIONS */}
      {toast && (
        <div className={`fixed top-4 right-4 md:top-6 md:right-6 z-[100] flex items-center gap-3 px-5 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl shadow-2xl text-white animate-fade-in-down ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={20} className="md:w-6 md:h-6" /> : <AlertTriangle size={20} className="md:w-6 md:h-6" />}
          <p className="font-bold text-xs md:text-sm">{toast.message}</p>
        </div>
      )}

      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 md:mb-6 gap-3">
        <p className="text-[11px] md:text-sm text-gray-500 font-bold px-1 uppercase tracking-wider">
           {esVistaGlobal ? 'Historial Global' : `Sede: ${sucursalActiva?.nombre || 'Ninguna'}`}
        </p>

        {esVistaGlobal ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm animate-pulse w-full sm:w-auto">
            <AlertTriangle size={14}/> Cambia de sucursal para registrar
          </div>
        ) : sucursalActiva && tienePermisoCrear ? (
          <button onClick={openModal} className="bg-blue-600 text-white px-5 py-3 sm:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 w-full sm:w-auto active:scale-95">
            <Plus size={18} /> <span className="sm:hidden lg:inline">Registrar Ingreso</span><span className="hidden sm:inline lg:hidden">Ingreso</span>
          </button>
        ) : null}
      </div>

      {/* VISTA MÓVIL: TARJETAS DE COMPRAS */}
      <div className="md:hidden flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
             <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
             <p className="text-xs font-medium">Cargando compras...</p>
          </div>
        ) : !sucursalActiva ? (
          <div className="text-center py-10 text-xs text-red-500 bg-red-50 rounded-2xl border border-red-100">
            ⚠️ Sin sucursal asignada.
          </div>
        ) : compras.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center">
            <ShoppingCart size={48} className="text-gray-200 mb-3" strokeWidth={1.5}/>
            <p className="text-sm font-bold text-gray-600">Aún no hay ingresos registrados</p>
            <p className="text-xs text-gray-400 mt-1">Toca en "Registrar Ingreso" para comenzar.</p>
          </div>
        ) : (
          compras.map((compra) => (
            <div key={compra.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm relative group overflow-hidden">
               <div className="flex justify-between items-start mb-3 border-b border-dashed border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                     <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText size={18}/>
                     </div>
                     <div>
                       <p className="font-extrabold text-gray-800 text-xs truncate max-w-[150px]">{compra.proveedor_nombre || 'Proveedor S/D'}</p>
                       <p className="text-[9px] font-bold text-gray-400 flex items-center gap-1 mt-0.5">{new Date(compra.created_at).toLocaleDateString('es-PE', {day:'2-digit', month:'short', year:'2-digit', hour:'2-digit', minute:'2-digit'})}</p>
                     </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider mb-1 inline-block">{compra.estado}</span>
                    <p className="font-black text-gray-800 text-sm leading-none">S/ {parseFloat(compra.total).toFixed(2)}</p>
                  </div>
               </div>

               <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 flex items-center gap-2">
                  <FileText size={12} className="text-gray-400 shrink-0"/>
                  <span className="text-[10px] font-bold text-gray-600 truncate">Doc: {compra.comprobante || 'S/C'}</span>
               </div>

               {esVistaGlobal && (
                 <span className="inline-flex items-center gap-1 text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded w-fit mb-3">
                   <Store size={10}/> {compra.sucursal_nombre || 'Local no asignado'}
                 </span>
               )}

               <button onClick={() => openDetalleCompra(compra.id)} className="w-full py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs hover:bg-blue-100 flex items-center justify-center gap-1.5 transition-colors">
                 <Eye size={14}/> Ver Detalle de Compra
               </button>
            </div>
          ))
        )}
      </div>

      {/* VISTA PC: TABLA DE COMPRAS */}
      <div className="hidden md:block bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold tracking-wider text-[10px] border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Proveedor</th>
              {esVistaGlobal && <th className="px-6 py-4">Sucursal Destino</th>}
              <th className="px-6 py-4">Comprobante</th>
              <th className="px-6 py-4 text-center">Estado</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
               <tr><td colSpan={esVistaGlobal ? "7" : "6"} className="text-center py-12 text-gray-400 font-medium">Cargando historial...</td></tr>
            ) : !sucursalActiva ? (
               <tr><td colSpan={esVistaGlobal ? "7" : "6"} className="text-center py-12 text-red-500 font-medium">⚠️ Sin sucursal asignada.</td></tr>
            ) : compras.length === 0 ? (
               <tr><td colSpan={esVistaGlobal ? "7" : "6"} className="text-center py-12 italic text-gray-400">No hay compras registradas.</td></tr>
            ) : (
              compras.map((compra) => (
                <tr key={compra.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 text-[11px] font-bold text-gray-500">
                    {new Date(compra.created_at).toLocaleDateString('es-PE', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">{compra.proveedor_nombre || 'S/D'}</td>
                  
                  {esVistaGlobal && (
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded-md flex items-center gap-1 w-max">
                        <Store size={12}/> {compra.sucursal_nombre || 'Desconocida'}
                      </span>
                    </td>
                  )}

                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-[10px] font-bold border border-gray-200 tracking-wider">
                      {compra.comprobante || 'S/C'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest">
                      {compra.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-gray-800 bg-gray-50/30">S/ {parseFloat(compra.total).toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openDetalleCompra(compra.id)}
                        className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-xs font-bold"
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

      {/* MODAL DETALLE DE COMPRA (EL OJITO) */}
      {detalleCompraOpen && compraSeleccionada && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-md transition-all animate-fade-in">
          <div className="bg-white p-5 sm:p-8 rounded-t-3xl sm:rounded-[2rem] w-full sm:max-w-3xl shadow-2xl border border-white/50 animate-fade-in-up flex flex-col max-h-[90vh]">
            
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>
            
            <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4 shrink-0">
              <div>
                <h2 className="text-lg md:text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <FileText className="text-blue-600" size={20}/> Ingreso de Mercadería 
                </h2>
                <p className="text-[10px] text-gray-500 font-bold mt-1 tracking-widest uppercase">Registro N° {compraSeleccionada.compra.id}</p>
              </div>
              <button onClick={() => setDetalleCompraOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={18}/></button>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-5">
                <div className="p-4 border border-gray-100 bg-slate-50/50 rounded-xl">
                  <h3 className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit uppercase tracking-widest flex items-center gap-1 mb-2"><Building2 size={10}/> PROVEEDOR</h3>
                  <p className="text-sm font-bold text-gray-800">{compraSeleccionada.compra.proveedor_nombre || 'No Especificado'}</p>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">RUC: {compraSeleccionada.compra.proveedor_ruc || 'S/D'}</p>
                </div>

                <div className="p-4 border border-gray-100 bg-slate-50/50 rounded-xl relative">
                  <div className="absolute top-4 right-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[8px] font-black px-2 py-1 rounded-md flex items-center gap-1 uppercase tracking-widest">
                    <CheckCircle size={10}/> RECIBIDO
                  </div>
                  <h3 className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-fit uppercase tracking-widest flex items-center gap-1 mb-2"><CalendarDays size={10}/> DATOS DE COMPRA</h3>
                  <p className="text-[10px] font-bold text-gray-800 mb-1">Comprobante: <span className="font-medium text-gray-600">{compraSeleccionada.compra.comprobante || 'S/C'}</span></p>
                  <p className="text-[10px] font-bold text-gray-800 mb-1">Fecha: <span className="font-medium text-gray-600">{new Date(compraSeleccionada.compra.created_at).toLocaleString('es-PE')}</span></p>
                  <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded w-fit uppercase tracking-wider">
                    <MapPin size={10}/> Destino: {compraSeleccionada.compra.sucursal_nombre || 'Local Principal'}
                  </div>
                </div>
              </div>

              <h3 className="text-[11px] font-extrabold text-gray-800 mb-2 border-l-4 border-blue-600 pl-2 uppercase tracking-wider">Mercadería Ingresada</h3>
              <div className="border border-gray-200 rounded-xl overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-gray-200 text-slate-600 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 font-extrabold uppercase text-[8px] tracking-wider text-center">Cant.</th>
                      <th className="py-2.5 px-3 font-extrabold uppercase text-[8px] tracking-wider">Producto</th>
                      <th className="py-2.5 px-3 font-extrabold uppercase text-[8px] tracking-wider text-center">Costo U.</th>
                      <th className="py-2.5 px-3 font-extrabold uppercase text-[8px] tracking-wider text-right bg-gray-100/50">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {compraSeleccionada.detalles?.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-black text-blue-600 text-center bg-blue-50/30 text-[10px]">{item.cantidad}</td>
                        <td className="py-2 px-3 font-bold text-[10px] leading-tight"><p className="truncate max-w-[120px] md:max-w-[250px]" title={item.producto_nombre}>{item.producto_nombre}</p></td>
                        <td className="py-2 px-3 text-gray-600 font-medium text-center text-[10px]">S/ {parseFloat(item.precio_unitario).toFixed(2)}</td>
                        <td className="py-2 px-3 font-bold text-gray-900 text-right bg-gray-50/50 text-[10px]">S/ {parseFloat(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-2 shrink-0">
              <div className="bg-slate-800 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-between shadow-md text-white">
                <span className="text-[10px] md:text-xs font-extrabold text-gray-400 uppercase tracking-widest">Costo Total</span>
                <span className="text-xl md:text-2xl font-black text-emerald-400">S/ {parseFloat(compraSeleccionada.compra.total).toFixed(2)}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL GIGANTE DE NUEVA COMPRA (Responsive App Design) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-0 md:p-4">
          <div className="bg-white md:rounded-[2rem] w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden">
            
            <div className="flex justify-between items-center p-4 md:p-5 border-b border-gray-100 bg-white shrink-0 z-20">
               <h2 className="text-base md:text-lg font-extrabold text-gray-800 flex items-center gap-2"><ShoppingCart className="text-blue-600" size={20}/> Ingreso de Mercadería</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"><X size={18}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row bg-slate-50/30">
               
               <div className="flex-1 flex flex-col border-r border-gray-100 relative">
                 
                 <div className="p-4 bg-white border-b border-gray-100 shrink-0 relative z-10 shadow-sm">
                   <label className="text-[9px] md:text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5 block">Buscar Producto en Catálogo</label>
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                     <input 
                       type="text" 
                       placeholder="Nombre o SKU..." 
                       className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2.5 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-bold text-gray-800 text-xs md:text-sm" 
                       value={busquedaProd} 
                       onChange={(e) => setBusquedaProd(e.target.value)} 
                     />
                   </div>
                   
                   {busquedaProd && (
                     <div className="absolute left-4 right-4 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-30 max-h-[40vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                       {productosFiltrados.length === 0 ? (
                         <div className="p-6 text-center flex flex-col items-center">
                           <Package size={24} className="text-gray-300 mb-2"/>
                           <p className="text-gray-500 text-[11px] font-bold">No hay coincidencias en esta sede.</p>
                         </div>
                       ) : (
                         productosFiltrados.map(prod => (
                           <div key={prod.id} onClick={() => agregarAlCarrito(prod)} className="p-3 border-b border-gray-50 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors group">
                             <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden">
                                {prod.imagen ? <img src={renderImagen(prod.imagen)} className="w-full h-full object-cover"/> : <ImageIcon size={16} className="text-gray-300"/>}
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="font-bold text-xs text-gray-800 group-hover:text-blue-700 truncate transition-colors">{prod.nombre}</p>
                               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{prod.codigo || 'S/C'}</p>
                             </div>
                             <div className="bg-slate-100 text-slate-500 p-1.5 rounded-md group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                               <Plus size={14} />
                             </div>
                           </div>
                         ))
                       )}
                     </div>
                   )}
                 </div>

                 <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {cart.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3 border-[3px] border-white shadow-sm">
                           <Package size={24} className="text-slate-300" />
                        </div>
                        <p className="text-xs font-bold text-gray-600">Lista de ingreso vacía</p>
                        <p className="text-[10px] text-gray-400 mt-1 text-center max-w-[200px]">Busca productos arriba para agregarlos a la compra.</p>
                      </div>
                    ) : (
                      cart.map((item, index) => (
                        <div key={index} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2 relative group overflow-hidden">
                           
                           <div className="flex items-center gap-2.5">
                             <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden">
                                {item.imagen ? <img src={renderImagen(item.imagen)} className="w-full h-full object-cover"/> : <ImageIcon size={14} className="text-gray-300"/>}
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="font-bold text-gray-800 text-[11px] md:text-xs leading-tight line-clamp-2">{item.nombre}</p>
                               <p className="text-[8px] font-black text-gray-400 uppercase mt-0.5">{item.codigo || 'S/C'}</p>
                             </div>
                             <button onClick={() => eliminarDelCarrito(index)} className="p-1.5 text-red-400 hover:text-red-600 bg-red-50/50 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                               <Trash2 size={14}/>
                             </button>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-2 mt-1 border-t border-gray-50 pt-2">
                              <div>
                                <label className="text-[8px] font-bold text-gray-400 uppercase ml-1 block mb-0.5">Cantidad</label>
                                <input 
                                  type="number" 
                                  min="1" 
                                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg outline-none focus:border-blue-400 focus:bg-white text-center font-bold text-gray-800 text-xs transition-colors [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                  value={item.cantidad} 
                                  onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)} 
                                />
                              </div>
                              <div>
                                <label className="text-[8px] font-bold text-gray-400 uppercase ml-1 block mb-0.5">Costo U. (S/)</label>
                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg focus-within:border-blue-400 focus-within:bg-white transition-colors overflow-hidden">
                                  <span className="pl-2 text-gray-400 font-bold text-[10px]">S/</span>
                                  <input 
                                    type="number" 
                                    min="0" 
                                    step="0.01" 
                                    className="w-full p-2 outline-none font-bold text-gray-800 text-xs bg-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                    value={item.precio_unitario} 
                                    onChange={(e) => actualizarItem(index, 'precio_unitario', e.target.value)} 
                                  />
                                </div>
                              </div>
                           </div>

                           <div className="absolute bottom-3 right-3 text-right hidden sm:block">
                             <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Subtotal</p>
                             <p className="font-black text-emerald-600 text-xs">S/ {item.subtotal.toFixed(2)}</p>
                           </div>
                           <div className="sm:hidden mt-1 text-right">
                             <p className="font-black text-emerald-600 text-[11px]">Subtotal: S/ {item.subtotal.toFixed(2)}</p>
                           </div>

                        </div>
                      ))
                    )}
                 </div>
               </div>

               <div className="w-full md:w-[320px] lg:w-[360px] bg-white border-t md:border-t-0 md:border-l border-gray-100 flex flex-col shrink-0">
                 <div className="p-4 md:p-6 space-y-4 md:space-y-5 flex-1 overflow-y-auto">
                   <div>
                     <label className="text-[9px] md:text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block mb-1.5 flex items-center gap-1 bg-blue-50 w-fit px-2 py-1 rounded"><Building2 size={12}/> Proveedor *</label>
                     <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:bg-white focus:border-blue-400 font-bold text-gray-700 text-xs md:text-sm transition-colors" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
                       <option value="">-- Seleccionar Proveedor --</option>
                       {proveedores.map(prov => <option key={prov.id} value={prov.id}>{prov.razon_social}</option>)}
                     </select>
                   </div>
                   
                   <div>
                     <label className="text-[9px] md:text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block mb-1.5 flex items-center gap-1 bg-blue-50 w-fit px-2 py-1 rounded"><FileText size={12}/> Comprobante</label>
                     <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" placeholder="Ej: F001-000234" className="w-full bg-slate-50 border border-slate-200 p-3 pl-9 rounded-xl outline-none focus:bg-white focus:border-blue-400 font-bold text-gray-800 uppercase transition-colors text-xs md:text-sm" value={comprobante} onChange={(e) => setComprobante(e.target.value)} />
                     </div>
                   </div>
                 </div>

                 <div className="p-4 md:p-6 bg-slate-50 border-t border-gray-100 shrink-0">
                   <div className="bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-800 shadow-md text-white text-center relative overflow-hidden mb-4">
                     <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-emerald-500 opacity-20 rounded-full blur-2xl pointer-events-none"></div>
                     <p className="text-[9px] md:text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Costo Total a Pagar</p>
                     <p className="text-2xl md:text-3xl font-black text-emerald-400 tracking-tight relative z-10">S/ {calcularTotal().toFixed(2)}</p>
                   </div>
                   
                   <button onClick={handleSubmit} disabled={cart.length === 0} className="w-full bg-blue-600 disabled:bg-slate-300 disabled:text-gray-500 text-white py-3.5 md:py-4 rounded-xl font-black text-sm md:text-base hover:bg-blue-700 shadow-lg shadow-blue-600/30 disabled:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                     <CheckCircle size={18}/> Confirmar Ingreso
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