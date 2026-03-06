import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Search, ShoppingBag, Plus, Minus, X, AlertOctagon, UserPlus, CheckCircle } from 'lucide-react';

const VentasPOS = () => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  // Estado del Carrito
  const [carrito, setCarrito] = useState([]);
  const [clienteSel, setClienteSel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de Modales
  const [stockModal, setStockModal] = useState({ isOpen: false, producto: null });
  const [clientModal, setClientModal] = useState({ isOpen: false, nombre: '', dni: '', direccion: '', error: '' });
  const [successModal, setSuccessModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
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
  }, []);

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    (p.codigo || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  // ✨ LÓGICA: Permite hacer clic, pero si no hay stock muestra la alerta centrada.
  const agregarAlCarrito = (prod) => {
    const itemEnCarrito = carrito.find(item => item.id === prod.id);
    const cantidadActual = itemEnCarrito ? itemEnCarrito.cantidad : 0;

    if (cantidadActual >= prod.stock) {
      setStockModal({ isOpen: true, producto: prod });
      return; // Detiene la ejecución, no lo agrega al carrito
    }

    if (itemEnCarrito) {
      setCarrito(carrito.map(item => item.id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCarrito([...carrito, { ...prod, cantidad: 1 }]);
    }
  };

  const quitarDelCarrito = (id) => {
    const itemEnCarrito = carrito.find(item => item.id === id);
    if (itemEnCarrito.cantidad === 1) {
      setCarrito(carrito.filter(item => item.id !== id));
    } else {
      setCarrito(carrito.map(item => item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item));
    }
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/clientes', {
        nombre_completo: clientModal.nombre,
        documento_identidad: clientModal.dni,
        direccion: clientModal.direccion
      });
      
      setClientes([res.data, ...clientes]); 
      setClienteSel(res.data.id); 
      setClientModal({ isOpen: false, nombre: '', dni: '', direccion: '', error: '' });
      setSuccessModal('¡Cliente registrado con éxito!');
      setTimeout(() => setSuccessModal(false), 2000);
    } catch (error) {
      setClientModal({ ...clientModal, error: 'Error al registrar cliente.' });
    }
  };

  const handleFinalizar = async () => {
    if (carrito.length === 0) return;
    setIsSubmitting(true);
    
    const subtotalBruto = carrito.reduce((acc, item) => acc + (parseFloat(item.precio) * item.cantidad), 0);
    
    try {
      const res = await api.post('/ventas', {
        cliente_id: clienteSel || null,
        total: subtotalBruto,
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
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-800">Ventas & POS</h1>
        <p className="text-sm text-gray-500 font-medium">Catálogo y punto de venta</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-160px)]">
        
        {/* LADO IZQUIERDO: CATÁLOGO */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4">Catálogo</h2>
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
              <input type="text" placeholder="Buscar por nombre o SKU..." className="w-full bg-white border border-gray-300 pl-10 pr-4 py-2 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {productosFiltrados.map(prod => (
                <button 
                  key={prod.id} 
                  onClick={() => agregarAlCarrito(prod)}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:shadow-md transition-shadow flex flex-col justify-between h-32 active:scale-95"
                >
                  <div>
                    <p className="font-bold text-gray-800 text-sm mb-1 uppercase leading-tight line-clamp-2">{prod.nombre}</p>
                    <p className="text-xs text-gray-500">{prod.codigo || 'S/C'}</p>
                  </div>
                  <p className="text-green-600 font-bold text-lg mt-2">S/ {parseFloat(prod.precio).toFixed(2)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* LADO DERECHO: CARRITO */}
        <div className="w-full lg:w-[380px] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0">
          
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><ShoppingBag size={18}/> Carrito</h2>
            <label className="text-xs text-gray-500 font-medium flex items-center gap-1 mb-2"><UserPlus size={14}/> Cliente</label>
            <div className="flex gap-2">
              <select className="flex-1 border border-gray-300 p-2 rounded-lg text-sm text-gray-700 bg-white outline-none" value={clienteSel} onChange={(e) => setClienteSel(e.target.value)}>
                <option value="">Público General</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_completo}</option>)}
              </select>
              <button onClick={() => setClientModal({ ...clientModal, isOpen: true })} className="bg-white border border-gray-300 text-blue-600 hover:bg-blue-50 px-3 rounded-lg transition-colors">
                <Plus size={18}/>
              </button>
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
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md p-1">
                      <button onClick={() => quitarDelCarrito(item.id)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-red-600"><Minus size={14}/></button>
                      <span className="w-4 text-center font-medium text-sm">{item.cantidad}</span>
                      <button onClick={() => agregarAlCarrito(item)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-blue-600"><Plus size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between text-gray-500 text-sm mb-2"><span>Subtotal</span><span>S/ {(subtotal / 1.18).toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-500 text-sm mb-4"><span>IGV (18%)</span><span>S/ {(subtotal - (subtotal / 1.18)).toFixed(2)}</span></div>
            <div className="flex justify-between items-center mb-6 font-bold text-gray-800 text-lg">
              <span>Total</span>
              <span>S/ {subtotal.toFixed(2)}</span>
            </div>

            <button 
              onClick={handleFinalizar} 
              disabled={carrito.length === 0 || isSubmitting} 
              className={`w-full py-3.5 rounded-lg font-bold text-white transition-colors ${carrito.length === 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}
            >
              {isSubmitting ? 'Procesando...' : 'Finalizar Venta'}
            </button>
          </div>
        </div>
      </div>

      {/* ✨ MODAL DE ALERTA DE STOCK INSUFICIENTE */}
      {stockModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-bounce-short">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-50 border-4 border-red-100 mb-6 text-red-500">
              <AlertOctagon size={40} />
            </div>
            <h3 className="text-2xl font-extrabold text-gray-800 mb-2">¡Stock Insuficiente!</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Solo te quedan <b className="text-red-500">{stockModal.producto?.stock} unidades</b> de este producto en el inventario.
            </p>
            <button onClick={() => setStockModal({ isOpen: false, producto: null })} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors">
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CLIENTE (CON ERROR CORREGIDO) */}
      {clientModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Registro rápido de cliente</h3>
              <button type="button" onClick={() => setClientModal({ ...clientModal, isOpen: false, error: '' })} className="text-gray-400 hover:text-gray-800"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSaveClient} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">DNI / Documento</label>
                <input type="text" className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:border-blue-500" value={clientModal.dni} onChange={e => setClientModal({...clientModal, dni: e.target.value.replace(/\D/g, '')})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Nombre *</label>
                <input required type="text" className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:border-blue-500" value={clientModal.nombre} onChange={e => setClientModal({...clientModal, nombre: e.target.value})} autoFocus/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Dirección</label>
                <input type="text" className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:border-blue-500" value={clientModal.direccion} onChange={e => setClientModal({...clientModal, direccion: e.target.value})} />
              </div>

              {clientModal.error && (
                <p className="text-red-500 text-sm font-medium mt-2">{clientModal.error}</p>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setClientModal({ ...clientModal, isOpen: false, error: '' })} className="flex-1 border border-gray-300 py-3 rounded-lg font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-md">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MENSAJE DE ÉXITO */}
      {successModal && (
        <div className="fixed bottom-10 right-10 z-[70] bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 font-bold animate-fade-in-up">
           <CheckCircle className="text-emerald-400" size={24}/> {successModal}
        </div>
      )}
    </Layout>
  );
};

export default VentasPOS;