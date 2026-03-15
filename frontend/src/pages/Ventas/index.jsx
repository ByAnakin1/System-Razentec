import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Store, AlertOctagon, X, CheckCircle, ShoppingBag, Package } from 'lucide-react';
import PaymentModal from './PaymentModal'; 
import ClienteQuickRegisterModal from './ClienteQuickRegisterModal'; 
import CatalogSection from './CatalogSection';
import CartSection from './CartSection';

const VentasPOS = () => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true); 
  
  const [carrito, setCarrito] = useState([]);
  const [clienteSel, setClienteSel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stockModal, setStockModal] = useState({ isOpen: false, producto: null, maxStock: 0 });
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [mobileTab, setMobileTab] = useState('catalogo');

  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);
  const esVistaGlobal = sucursalActiva?.id === 'ALL';

  useEffect(() => {
    const fetchData = async () => {
      const currentSucursal = JSON.parse(localStorage.getItem('sucursalActiva'));
      if (!currentSucursal) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [prodRes, cliRes] = await Promise.all([
          api.get('/productos?estado=activos'),
          api.get('/clientes')
        ]);
        setProductos(prodRes.data);
        setClientes(cliRes.data);
      } catch (err) { 
        console.error("Error al cargar data POS:", err); 
      } finally {
        setLoading(false);
      }
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

  const updateQtyCarrito = (prod, nuevaCant) => {
     if (esVistaGlobal) return;
     if (nuevaCant <= 0) return quitarDelCarrito(prod.id);
     
     const stockAqui = obtenerStockLocal(prod);
     if (nuevaCant > stockAqui) {
       setStockModal({ isOpen: true, producto: prod, maxStock: stockAqui });
       return;
     }

     setCarrito(carrito.map(item => item.id === prod.id ? { ...item, cantidad: nuevaCant } : item));
  };

  const quitarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const handleClienteSave = (nuevoCliente) => {
     setClientes([nuevoCliente, ...clientes]);
     setClienteSel(nuevoCliente);
     setSuccessModal('¡Cliente registrado con éxito!');
     setClientModalOpen(false);
     setTimeout(() => setSuccessModal(false), 2000);
  };

  const processCheckout = async (paymentData) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/ventas', {
        cliente_id: clienteSel?.id || null,
        total: paymentData.total,
        metodo_pago: paymentData.metodo,
        sucursal_id: sucursalActiva.id,
        productos: carrito.map(p => ({ id: p.id, cantidad: p.cantidad, precio: parseFloat(p.precio) }))
      });
      navigate(`/ventas/${res.data.id}`); 
    } catch (error) {
      alert("Error al procesar el pago");
      setIsSubmitting(false);
    }
  };

  const totalItemsEnCarrito = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <Layout title="Punto de Venta" moduleIcon={<Store/>}>
      
      {/* CABECERA (Más compacta) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-2 gap-2 px-1">
        <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider">
           {esVistaGlobal ? 'Selecciona sede para vender' : `Caja Abierta: ${sucursalActiva?.nombre || 'Ninguna'}`}
        </p>
        {esVistaGlobal && (
           <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-sm animate-pulse w-full sm:w-auto">
             <AlertOctagon size={14}/> Cambia a una sucursal en el menú.
           </div>
        )}
      </div>

      {/* PESTAÑAS MÓVILES (Menos altura, más integradas) */}
      <div className="lg:hidden flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm mb-3 sticky top-0 z-10">
        <button 
          onClick={() => setMobileTab('catalogo')} 
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs md:text-sm transition-all ${mobileTab === 'catalogo' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Package size={14} /> Catálogo
        </button>
        <button 
          onClick={() => setMobileTab('carrito')} 
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs md:text-sm transition-all ${mobileTab === 'carrito' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <ShoppingBag size={14} /> Carrito
          {totalItemsEnCarrito > 0 && (
            <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-black animate-pulse">
              {totalItemsEnCarrito}
            </span>
          )}
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL: Altura ajustada para no cortar abajo */}
      <div className={`flex flex-col lg:flex-row gap-3 h-[calc(100vh-170px)] lg:h-[calc(100vh-120px)] ${esVistaGlobal ? 'opacity-50 pointer-events-none' : ''}`}>
        
        <div className={`flex-1 h-full transition-all ${mobileTab === 'catalogo' ? 'block' : 'hidden lg:block'}`}>
           <CatalogSection 
             productos={productos}
             loading={loading}
             searchTerm={busqueda}
             onSearchChange={setBusqueda}
             onAddProduct={agregarAlCarrito}
             obtenerStockLocal={obtenerStockLocal}
           />
        </div>

        <div className={`w-full lg:w-[360px] xl:w-[400px] h-full shrink-0 transition-all ${mobileTab === 'carrito' ? 'block' : 'hidden lg:block'}`}>
           <CartSection 
             items={carrito}
             onUpdateQty={updateQtyCarrito}
             onRemoveItem={(prod) => quitarDelCarrito(prod.id)}
             clientes={clientes}
             selectedCliente={clienteSel}
             onClienteSelect={setClienteSel}
             onOpenQuickRegister={() => setClientModalOpen(true)}
             onFinalizarVenta={() => setIsPaymentModalOpen(true)}
           />
        </div>
      </div>

      <PaymentModal 
        open={isPaymentModalOpen} 
        total={carrito.reduce((acc, item) => acc + (parseFloat(item.precio) * item.cantidad), 0)} 
        onClose={() => setIsPaymentModalOpen(false)} 
        onConfirm={processCheckout} 
      />

      <ClienteQuickRegisterModal 
         open={clientModalOpen}
         onClose={() => setClientModalOpen(false)}
         onSave={handleClienteSave}
      />

      {stockModal.isOpen && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-[2rem] p-5 md:p-6 w-full sm:max-w-sm text-center shadow-2xl relative animate-fade-in-up pb-8">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden"></div>
            <button onClick={() => setStockModal({ isOpen: false, producto: null, maxStock: 0 })} className="absolute top-4 right-4 bg-gray-50 text-gray-400 hover:bg-gray-100 p-2 rounded-full hidden sm:block"><X size={18}/></button>
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-50 border-4 border-red-100 mb-4 text-red-500 shadow-inner"><AlertOctagon size={28} /></div>
            <h3 className="text-lg md:text-xl font-extrabold text-gray-800 mb-1">¡Stock Insuficiente!</h3>
            <p className="text-xs md:text-sm text-gray-500 font-medium mb-5 md:mb-6 leading-relaxed">
              Solo quedan <b className="text-red-500">{stockModal.maxStock} unidades</b> de <span className="font-bold text-gray-800">{stockModal.producto?.nombre}</span>.
            </p>
            <button onClick={() => setStockModal({ isOpen: false, producto: null, maxStock: 0 })} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors text-sm">Entendido</button>
          </div>
        </div>
      )}

      {successModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fade-in">
           <div className="bg-white px-6 py-5 rounded-3xl shadow-xl flex flex-col items-center animate-bounce border border-white/50">
              <CheckCircle size={36} className="text-emerald-500 mb-2"/>
              <p className="font-extrabold text-sm text-gray-800">{successModal}</p>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default VentasPOS;