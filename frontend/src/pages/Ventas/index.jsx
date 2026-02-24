import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import CatalogSection from './CatalogSection';
import CartSection from './CartSection';
import PaymentModal from './PaymentModal';
import ClienteQuickRegisterModal from './ClienteQuickRegisterModal';


const CLIENTES_INICIALES = [
  { id: '', nombre: 'Cliente General', dni: null, direccion: null }
];

/**
 * Módulo Ventas & POS.
 * Catálogo (izq), carrito + cliente + totales (der). Modal pago y registro rápido de cliente.
 */
const Ventas = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [clientes, setClientes] = useState(CLIENTES_INICIALES);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [quickRegisterOpen, setQuickRegisterOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      // Descargamos productos y clientes en paralelo para que sea más rápido
      const [resProd, resCli] = await Promise.all([
        api.get('/productos'),
        api.get('/clientes')
      ]);
      setProductos(Array.isArray(resProd.data) ? resProd.data : []);
      // Mezclamos el "Cliente General" con los que vienen de la base de datos
      setClientes([...CLIENTES_INICIALES, ...resCli.data]); 
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(); // Cambiamos el nombre aquí también
  }, [loadData]);

  const addToCart = (producto) => {
    const existing = cart.find((it) => it.id === producto.id);
    if (existing) {
      setCart(cart.map((it) => (it.id === producto.id ? { ...it, cantidad: (it.cantidad || 1) + 1 } : it)));
    } else {
      setCart([...cart, { ...producto, cantidad: 1 }]);
    }
  };

  const updateQty = (item, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    setCart(cart.map((it) => (it.id === item.id ? { ...it, cantidad: nuevaCantidad } : it)));
  };

  const removeFromCart = (item) => {
    setCart(cart.filter((it) => it.id !== item.id));
  };

  const subtotal = cart.reduce((acc, it) => acc + parseFloat(it.precio || 0) * (it.cantidad || 0), 0);
  const igv = (subtotal * 18) / 100;
  const total = subtotal + igv;

  const handleSaveQuickCliente = (nuevo) => {
    setClientes((prev) => [...prev.filter((c) => c.id !== nuevo.id), nuevo]);
    setSelectedCliente(nuevo);
  };

  const handleFinalizarVenta = () => {
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (paymentData) => {
    if (cart.length === 0) return;

    try {
      // 1. Extraemos tu usuario del LocalStorage
      const usuarioLocal = JSON.parse(localStorage.getItem('usuario') || '{}');
      const idCliente = (selectedCliente?.id && selectedCliente.id !== '') ? selectedCliente.id : null;

      // 2. Enviamos los UUIDs reales
      const payload = {
        empresa_id: usuarioLocal.empresa_id || null, 
        usuario_id: usuarioLocal.id || null,         
        cliente_id: idCliente,
        productos: cart.map((it) => ({
          id: it.id,
          cantidad: it.cantidad || 1,
          precio: parseFloat(it.precio || 0),
        })),
        metodo_pago: paymentData.metodo,
        total: paymentData.total,
      };

      if (paymentData.metodo === 'efectivo') {
        payload.monto_recibido = paymentData.montoRecibido;
        payload.vuelto = paymentData.vuelto;
      }
      if (paymentData.metodo === 'yape_plin' && paymentData.numeroOperacion) {
        payload.numero_operacion = paymentData.numeroOperacion;
      }

      const response = await api.post('/ventas', payload);

      if (response.status === 201 || response.status === 200) {
        setCart([]);
        setPaymentModalOpen(false);
        navigate(`/ventas/${response.data.id}/detalle`);
      }
    } catch (error) {
      console.error('Error POST /ventas:', error);
      alert('Hubo un error al guardar la venta en la base de datos.');
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ventas & POS</h1>
        <p className="text-gray-500 text-sm mt-1">Catálogo y punto de venta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)] min-h-[400px]">
        <div className="lg:col-span-2 h-full">
          <CatalogSection
            productos={productos}
            loading={loading}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAddProduct={addToCart}
          />
        </div>
        <div className="h-full">
          <CartSection
            items={cart}
            onUpdateQty={updateQty}
            onRemoveItem={removeFromCart}
            clientes={clientes}
            selectedCliente={selectedCliente}
            onClienteSelect={setSelectedCliente}
            onOpenQuickRegister={() => setQuickRegisterOpen(true)}
            onFinalizarVenta={handleFinalizarVenta}
          />
        </div>
      </div>

      <PaymentModal
        open={paymentModalOpen}
        total={total.toFixed(2)}
        onClose={() => setPaymentModalOpen(false)}
        onConfirm={handleConfirmPayment}
      />

      <ClienteQuickRegisterModal
        open={quickRegisterOpen}
        onClose={() => setQuickRegisterOpen(false)}
        onSave={handleSaveQuickCliente}
      />
    </Layout>
  );
};

export default Ventas;
