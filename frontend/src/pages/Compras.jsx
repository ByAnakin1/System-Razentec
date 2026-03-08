import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Plus, Trash2, X, AlertTriangle, Search, CheckCircle, ShoppingCart, FileText, Eye, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Compras = () => {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Dependencias para el modal (Proveedores y Productos)
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  
  // Estados del Modal y Formulario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Datos de la nueva compra
  const [proveedorId, setProveedorId] = useState('');
  const [comprobante, setComprobante] = useState('');
  const [cart, setCart] = useState([]);
  const [busquedaProd, setBusquedaProd] = useState('');

  // ✨ ESTADOS GLOBALES DE SUCURSAL
  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);
  const esVistaGlobal = sucursalActiva?.id === 'ALL';

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Cargar el historial de compras (Con el Semáforo Inyectado)
  const fetchCompras = async () => {
    // 🚨 SEMÁFORO: Esperar a que el Layout asigne la sucursal
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
    
    // ✨ ESCUCHADOR: Recarga si cambias de local arriba
    const handleSucursalCambiada = () => {
      setSucursalActiva(JSON.parse(localStorage.getItem('sucursalActiva')));
      fetchCompras(); 
    };
    window.addEventListener('sucursalCambiada', handleSucursalCambiada);
    return () => window.removeEventListener('sucursalCambiada', handleSucursalCambiada);
  }, []);

  // 2. Cargar dependencias al abrir el modal (Con Filtro Inteligente de Interceptor)
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

  // 3. Lógica del "Carrito" de compras
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

  // 4. Enviar la compra al Backend
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
    <Layout>
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg text-white animate-fade-in-down ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
          <p className="font-semibold">{toast.message}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart size={28} className="text-blue-600"/> Compras a Proveedores
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            {esVistaGlobal ? 'Viendo compras globales de la empresa' : `Viendo ingresos de la sucursal: ${sucursalActiva?.nombre || '...'}`}
          </p>
        </div>

        {/* ✨ BLOQUEO DE BOTÓN: No se puede comprar si estás en "Todas las sucursales" o si no tienes local asignado */}
        {esVistaGlobal ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
            <AlertTriangle size={18}/> Selecciona una sucursal específica para comprar
          </div>
        ) : sucursalActiva ? (
          <button onClick={openModal} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 w-full md:w-auto justify-center">
            <Plus size={20} /> Registrar Compra
          </button>
        ) : null}
      </div>

      {/* TABLA DE HISTORIAL DE COMPRAS */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs tracking-wider">
              <tr>
                <th className="px-5 py-4">Fecha</th>
                <th className="px-5 py-4">Proveedor</th>
                {/* ✨ COLUMNA SUCURSAL PARA VISTA GLOBAL */}
                {esVistaGlobal && <th className="px-5 py-4">Sucursal Destino</th>}
                <th className="px-5 py-4">Comprobante</th>
                <th className="px-5 py-4 text-center">Estado</th>
                <th className="px-5 py-4 text-right">Total</th>
                <th className="px-5 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 <tr><td colSpan={esVistaGlobal ? "7" : "6"} className="text-center p-8 font-medium">Cargando historial...</td></tr>
              ) : !sucursalActiva ? (
                 <tr><td colSpan={esVistaGlobal ? "7" : "6"} className="text-center p-12 text-red-500 font-bold bg-red-50">⚠️ No se ha detectado sucursal autorizada.</td></tr>
              ) : compras.length === 0 ? (
                 <tr><td colSpan={esVistaGlobal ? "7" : "6"} className="text-center p-12 text-gray-400 font-medium">No hay compras registradas en esta vista.</td></tr>
              ) : (
                compras.map((compra) => (
                  <tr key={compra.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {new Date(compra.created_at).toLocaleDateString('es-PE', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-800">{compra.proveedor_nombre || 'S/D'}</td>
                    
                    {/* ✨ ETIQUETA DE SUCURSAL */}
                    {esVistaGlobal && (
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded flex items-center gap-1 w-max">
                          <Store size={12}/> {compra.sucursal_nombre || 'Desconocida'}
                        </span>
                      </td>
                    )}

                    <td className="px-5 py-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-bold border border-gray-200">{compra.comprobante || 'S/C'}</span></td>
                    <td className="px-5 py-4 text-center"><span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{compra.estado}</span></td>
                    <td className="px-5 py-4 text-right font-black text-emerald-600 text-base">S/ {parseFloat(compra.total).toFixed(2)}</td>
                    <td className="px-5 py-4 text-center">
                      <button 
                        onClick={() => navigate(`/compras/${compra.id}`)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors border border-blue-100 hover:border-blue-600 shadow-sm"
                        title="Ver detalle"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL GIGANTE DE NUEVA COMPRA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up border border-white/50">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
               <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2"><ShoppingCart className="text-blue-600"/> Registrar Ingreso de Mercadería</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
               
               <div className="flex-1 flex flex-col border-r border-gray-100 md:pr-6">
                 
                 <div className="relative mb-6">
                   <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2 block">Buscar Producto para agregar al almacén</label>
                   <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                     <input 
                       type="text" 
                       placeholder="Escribe el nombre o SKU del producto..." 
                       className="w-full border-2 border-blue-100 bg-blue-50/30 p-3.5 pl-10 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-gray-800" 
                       value={busquedaProd} 
                       onChange={(e) => setBusquedaProd(e.target.value)} 
                     />
                   </div>
                   
                   {busquedaProd && (
                     <div className="absolute w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto">
                       {productosFiltrados.length === 0 ? (
                         <div className="p-6 text-center text-gray-500 text-sm font-medium">No se encontraron productos en el catálogo de esta sucursal.</div>
                       ) : (
                         productosFiltrados.map(prod => (
                           <div key={prod.id} onClick={() => agregarAlCarrito(prod)} className="p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors group">
                             <div>
                               <p className="font-bold text-sm text-gray-800 group-hover:text-blue-700 transition-colors">{prod.nombre}</p>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{prod.codigo || 'S/C'}</p>
                             </div>
                             <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                               <Plus size={16} />
                             </div>
                           </div>
                         ))
                       )}
                     </div>
                   )}
                 </div>

                 <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 text-gray-500 text-[10px] font-extrabold uppercase tracking-wider sticky top-0 border-b border-gray-200">
                       <tr>
                         <th className="p-3 w-[40%]">Producto</th>
                         <th className="p-3 w-[20%] text-center">Cant.</th>
                         <th className="p-3 w-[20%]">Costo Unit.</th>
                         <th className="p-3 w-[15%] text-right">Subtotal</th>
                         <th className="p-3 w-[5%]"></th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                       {cart.length === 0 ? (
                         <tr><td colSpan="5" className="text-center p-10 text-gray-400 italic font-medium">Escanea o busca productos arriba para agregarlos a la lista.</td></tr>
                       ) : (
                         cart.map((item, index) => (
                           <tr key={index} className="hover:bg-slate-50 transition-colors">
                             <td className="p-3">
                               <p className="font-bold text-slate-800 text-xs line-clamp-2">{item.nombre}</p>
                             </td>
                             <td className="p-2">
                               <input type="number" min="1" className="w-full border-2 border-gray-200 p-2 rounded-lg outline-none focus:border-blue-500 text-center font-bold text-gray-800" value={item.cantidad} onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)} />
                             </td>
                             <td className="p-2">
                               <div className="flex items-center border-2 border-gray-200 rounded-lg bg-white focus-within:border-blue-500 overflow-hidden">
                                 <span className="pl-3 text-gray-400 font-bold text-xs">S/</span>
                                 <input type="number" min="0" step="0.01" className="w-full p-2 outline-none font-bold text-gray-800" value={item.precio_unitario} onChange={(e) => actualizarItem(index, 'precio_unitario', e.target.value)} />
                               </div>
                             </td>
                             <td className="p-3 text-right font-black text-emerald-600">
                               S/ {item.subtotal.toFixed(2)}
                             </td>
                             <td className="p-2 text-center">
                               <button onClick={() => eliminarDelCarrito(index)} className="text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 size={16}/></button>
                             </td>
                           </tr>
                         ))
                       )}
                     </tbody>
                   </table>
                 </div>
               </div>

               <div className="w-full md:w-80 flex flex-col justify-between">
                 <div className="space-y-5">
                   <div>
                     <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block mb-2">Proveedor *</label>
                     <select className="w-full border-2 border-gray-200 p-3.5 rounded-xl outline-none focus:border-blue-500 bg-white font-bold text-gray-700 transition-colors" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
                       <option value="">-- Seleccionar Proveedor --</option>
                       {proveedores.map(prov => <option key={prov.id} value={prov.id}>{prov.razon_social}</option>)}
                     </select>
                   </div>
                   
                   <div>
                     <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block mb-2">Comprobante / Factura</label>
                     <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="F001-000234" className="w-full border-2 border-gray-200 p-3.5 pl-10 rounded-xl outline-none focus:border-blue-500 font-bold text-gray-800 uppercase transition-colors" value={comprobante} onChange={(e) => setComprobante(e.target.value)} />
                     </div>
                   </div>
                 </div>

                 <div className="mt-8 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] relative z-10 text-white text-center">
                   <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Costo Total a Pagar</p>
                   <p className="text-4xl font-black text-emerald-400 mb-6 tracking-tight">S/ {calcularTotal().toFixed(2)}</p>
                   
                   <button onClick={handleSubmit} disabled={cart.length === 0} className="w-full bg-blue-600 disabled:bg-slate-700 disabled:text-slate-400 text-white py-4 rounded-xl font-black text-lg hover:bg-blue-500 shadow-lg shadow-blue-600/30 disabled:shadow-none transition-all active:scale-[0.98]">
                     Confirmar Ingreso
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