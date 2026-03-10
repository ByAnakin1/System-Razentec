import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Search, ShoppingBag, Plus, Minus, X, AlertOctagon, UserPlus, CheckCircle, MapPin } from 'lucide-react';
import PaymentModal from './PaymentModal'; // ✨ IMPORTAMOS EL MODAL DE PAGO

const VentasPOS = () => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  const [carrito, setCarrito] = useState([]);
  const [clienteSel, setClienteSel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stockModal, setStockModal] = useState({ isOpen: false, producto: null, maxStock: 0 });
  const [clientModal, setClientModal] = useState({ isOpen: false, nombre: '', dni: '', direccion: '', error: '' });
  const [successModal, setSuccessModal] = useState(false);
  
  // ✨ ESTADO PARA ABRIR EL MODAL DE PAGO
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);
  const esVistaGlobal = sucursalActiva?.id === 'ALL';

  useEffect(() => {
    const fetchData = async () => {
      const currentSucursal = JSON.parse(localStorage.getItem('sucursalActiva'));
      if (!currentSucursal) return;

      try {
        const [prodRes, cliRes] = await Promise.all([
          api.get('/productos?estado=activos'),
          api.get('/clientes')
        ]);
        setProductos(prodRes.data);
        setClientes(cliRes.data);
      } catch (err) { console.error("Error al cargar data POS:", err); }
    };
    
    fetchData(); 

    const handleSucursalCambiada = () => {
      setSucursalActiva(JSON.parse(localStorage.getItem('sucursalActiva')));
      setCarrito([]); 
      fetchData(); 
    };
    
    window.addEventListener('sucursalCambiada', handleSucursalCambiada);
    return () => window.removeEventListener('sucursalCambiada', handleSucursalCambiada);
  }, []);

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const obtenerStockLocal = (prod) => {
    if (!sucursalActiva || esVistaGlobal) return 0; 
    let detalles = prod.inventario_detalle;
    if (typeof detalles === 'string') { try { detalles = JSON.parse(detalles); } catch(e) { detalles = []; } }
    if (Array.isArray(detalles)) {
      const invLocal = detalles.find(i => i && i.sucursal_id === sucursalActiva.id);
      return invLocal ? parseInt(invLocal.stock) : 0;
    }
    return 0;
  };

  const agregarAlCarrito = (prod) => {
    if (esVistaGlobal) return; 
    const stockAqui = obtenerStockLocal(prod);
    const itemEnCarrito = carrito.find(item => item.id === prod.id);
    const cantidadActual = itemEnCarrito ? itemEnCarrito.cantidad : 0;

    if (cantidadActual >= stockAqui) {
      setStockModal({ isOpen: true, producto: prod, maxStock: stockAqui });
      return; 
    }

    if (itemEnCarrito) setCarrito(carrito.map(item => item.id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    else setCarrito([...carrito, { ...prod, cantidad: 1 }]);
  };

  const quitarDelCarrito = (id) => {
    const itemEnCarrito = carrito.find(item => item.id === id);
    if (itemEnCarrito.cantidad === 1) setCarrito(carrito.filter(item => item.id !== id));
    else setCarrito(carrito.map(item => item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item));
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/clientes', { nombre_completo: clientModal.nombre, documento_identidad: clientModal.dni, direccion: clientModal.direccion });
      setClientes([res.data, ...clientes]); setClienteSel(res.data.id); 
      setClientModal({ isOpen: false, nombre: '', dni: '', direccion: '', error: '' });
      setSuccessModal('¡Cliente registrado con éxito!');
      setTimeout(() => setSuccessModal(false), 2000);
    } catch (error) { setClientModal({ ...clientModal, error: 'Error al registrar cliente.' }); }
  };

  // ✨ FUNCIÓN FINAL QUE SE LLAMA AL ACEPTAR EL MODAL DE PAGO
  const processCheckout = async (paymentData) => {
    setIsSubmitting(true);
    
    try {
      const res = await api.post('/ventas', {
        cliente_id: clienteSel || null,
        total: paymentData.total,
        metodo_pago: paymentData.metodo, // ✨ Enviamos el método de pago
        sucursal_id: sucursalActiva.id,
        productos: carrito.map(p => ({ id: p.id, cantidad: p.cantidad, precio: parseFloat(p.precio) }))
      });
      navigate(`/ventas/${res.data.id}`); 
    } catch (error) {
      alert("Error al procesar el pago");
      setIsSubmitting(false);
    }
  };

  const subtotal = carrito.reduce((acc, item) => acc + (parseFloat(item.precio) * item.cantidad), 0);

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Ventas & POS</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Catálogo y punto de venta</p>
        </div>
        
        {esVistaGlobal ? (
           <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm animate-pulse">
             <AlertOctagon size={16}/> Selecciona una Sucursal arriba para vender.
           </div>
        ) : sucursalActiva ? (
           <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm">
             <MapPin size={16}/> Operando en: {sucursalActiva.nombre}
           </div>
        ) : null}
      </div>

      <div className={`flex flex-col lg:flex-row gap-6 h-[calc(100vh-160px)] ${esVistaGlobal && 'opacity-50 pointer-events-none'}`}>
        
        {/* CATÁLOGO */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4">Catálogo</h2>
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 text-gray-400" size={18}/>
              <input type="text" placeholder="Buscar por nombre o SKU..." className="w-full bg-slate-50 border border-gray-300 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {productosFiltrados.map(prod => {
                const stockAca = obtenerStockLocal(prod);
                const agotado = stockAca <= 0;
                return (
                  <button key={prod.id} onClick={() => agregarAlCarrito(prod)} className={`bg-white border border-gray-200 rounded-xl p-4 text-left transition-all flex flex-col justify-between h-32 active:scale-95 ${agotado ? 'opacity-50 grayscale' : 'hover:shadow-md border-blue-100 hover:border-blue-300'}`}>
                    <div>
                      <p className="font-bold text-gray-800 text-sm mb-1 uppercase leading-tight line-clamp-2">{prod.nombre}</p>
                      <p className="text-[10px] text-gray-400 font-bold tracking-widest">{prod.codigo || 'S/C'}</p>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <p className="text-green-600 font-bold text-lg">S/ {parseFloat(prod.precio).toFixed(2)}</p>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">Stock: {stockAca}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* CARRITO */}
        <div className="w-full lg:w-[380px] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><ShoppingBag size={18}/> Carrito</h2>
            <label className="text-xs text-gray-500 font-medium flex items-center gap-1 mb-2"><UserPlus size={14}/> Cliente (Opcional)</label>
            <div className="flex gap-2">
              <select className="flex-1 border border-gray-300 p-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white outline-none focus:border-blue-500" value={clienteSel} onChange={(e) => setClienteSel(e.target.value)}>
                <option value="">Público General</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_completo}</option>)}
              </select>
              <button onClick={() => setClientModal({ ...clientModal, isOpen: true })} className="bg-white border border-gray-300 text-blue-600 hover:bg-blue-50 px-3.5 rounded-xl transition-colors shadow-sm"><Plus size={18}/></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <ShoppingBag size={32} className="mb-3 opacity-50"/>
                <p className="text-sm">Agrega productos desde el catálogo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {carrito.map(item => (
                  <div key={item.id} className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-sm text-gray-800 leading-tight">{item.nombre}</p>
                      <p className="text-xs text-gray-500 mt-1">S/ {parseFloat(item.precio).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1.5 shadow-sm">
                      <button onClick={() => quitarDelCarrito(item.id)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-red-600 bg-white rounded shadow-sm"><Minus size={14}/></button>
                      <span className="w-5 text-center font-bold text-sm">{item.cantidad}</span>
                      <button onClick={() => agregarAlCarrito(item)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-blue-600 bg-white rounded shadow-sm"><Plus size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between text-gray-500 text-sm mb-2 font-medium"><span>Subtotal</span><span>S/ {(subtotal / 1.18).toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-500 text-sm mb-4 font-medium"><span>IGV (18%)</span><span>S/ {(subtotal - (subtotal / 1.18)).toFixed(2)}</span></div>
            <div className="flex justify-between items-center mb-6 font-black text-gray-800 text-xl border-b border-gray-200 pb-4">
              <span className="uppercase tracking-widest text-sm text-gray-500">Total a Cobrar</span>
              <span className="text-blue-600">S/ {subtotal.toFixed(2)}</span>
            </div>

            {/* ✨ BOTÓN QUE ABRE EL MODAL DE PAGO */}
            <button 
              onClick={() => setIsPaymentModalOpen(true)} 
              disabled={carrito.length === 0 || isSubmitting || esVistaGlobal} 
              className={`w-full py-4 rounded-xl font-bold text-white transition-all text-lg shadow-md active:scale-[0.98] ${carrito.length === 0 || esVistaGlobal ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'}`}
            >
              {isSubmitting ? 'Procesando...' : 'Finalizar Venta'}
            </button>
          </div>
        </div>
      </div>

      {/* ✨ RENDERIZAMOS EL MODAL DE PAGO */}
      <PaymentModal 
        open={isPaymentModalOpen} 
        total={subtotal} 
        onClose={() => setIsPaymentModalOpen(false)} 
        onConfirm={processCheckout} 
      />

      {stockModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center border border-white/50 relative animate-fade-in-up">
            <button onClick={() => setStockModal({ isOpen: false, producto: null, maxStock: 0 })} className="absolute top-4 right-4 bg-gray-50 text-gray-400 hover:text-gray-800 p-2 rounded-full"><X size={18}/></button>
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-50 border-4 border-red-100 mb-6 text-red-500"><AlertOctagon size={40} /></div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">¡Stock Insuficiente!</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Solo te quedan <b className="text-red-500">{stockModal.maxStock} unidades</b> de este producto en el local <b className="text-gray-800">{sucursalActiva?.nombre}</b>.
            </p>
            <button onClick={() => setStockModal({ isOpen: false, producto: null, maxStock: 0 })} className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors">Entendido</button>
          </div>
        </div>
      )}

      {clientModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-fade-in-up border border-white/50 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Registro rápido de cliente</h3>
              <button type="button" onClick={() => setClientModal({ ...clientModal, isOpen: false, error: '' })} className="text-gray-400 hover:text-gray-800"><X size={20}/></button>
            </div>
            <form onSubmit={handleSaveClient} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">DNI / Documento</label>
                {/* ✨ VALIDACIÓN DNI */}
                <input type="text" className="w-full mt-1 border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-blue-500 font-bold text-gray-700" value={clientModal.dni} onChange={e => setClientModal({...clientModal, dni: e.target.value.replace(/\D/g, '').slice(0, 8)})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nombre Completo *</label>
                {/* ✨ VALIDACIÓN NOMBRE */}
                <input required type="text" className="w-full mt-1 border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-blue-500 font-bold text-gray-700" value={clientModal.nombre} onChange={e => setClientModal({...clientModal, nombre: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})} autoFocus/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dirección</label>
                <input type="text" className="w-full mt-1 border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-blue-500 font-medium text-gray-600" value={clientModal.direccion} onChange={e => setClientModal({...clientModal, direccion: e.target.value})} />
              </div>
              {clientModal.error && (<p className="text-red-500 text-sm font-medium mt-2">{clientModal.error}</p>)}
              <button type="submit" className="w-full mt-4 bg-blue-600 text-white py-4 rounded-xl font-black shadow-lg shadow-blue-600/30">Guardar y Seleccionar</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
export default VentasPOS;