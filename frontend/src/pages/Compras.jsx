import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Plus, Trash2, X, AlertTriangle, Search, CheckCircle, ShoppingCart, FileText, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate

const Compras = () => {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Inicializa useNavigate
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

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Cargar el historial de compras
  const fetchCompras = async () => {
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

  useEffect(() => { fetchCompras(); }, []);

  // 2. Cargar dependencias al abrir el modal
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
      showToast('error', 'Error al cargar catálogos');
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
        precio_unitario: 0, // Precio de COSTO (no de venta)
        subtotal: 0
      }]);
    }
    setBusquedaProd(''); // Limpiar búsqueda
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
    
    // Validar que todos tengan precio y cantidad mayor a 0
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

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingCart size={28} className="text-blue-600"/> Historial de Compras
        </h1>
        <button onClick={openModal} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">
          <Plus size={20} /> Registrar Compra
        </button>
      </div>

      {/* TABLA DE HISTORIAL DE COMPRAS */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Comprobante</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Acciones</th> {/* ✨ NUEVO */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                 <tr><td colSpan="5" className="text-center p-8 text-gray-500">Cargando historial...</td></tr>
              ) : compras.length === 0 ? (
                 <tr><td colSpan="5" className="text-center p-12 text-gray-400">No hay compras registradas.</td></tr>
              ) : (
                compras.map((compra) => (
                  <tr key={compra.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{new Date(compra.created_at).toLocaleDateString('es-PE', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
                    <td className="px-4 py-3 font-bold text-gray-700">{compra.proveedor_nombre || 'S/D'}</td>
                    <td className="px-4 py-3"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-bold">{compra.comprobante || 'S/C'}</span></td>
                    <td className="px-4 py-3"><span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-xs font-bold">{compra.estado}</span></td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600 text-base">S/ {parseFloat(compra.total).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => navigate(`/compras/${compra.id}`)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
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
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up">
            
            <div className="flex justify-between items-center p-6 border-b">
               <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><ShoppingCart className="text-blue-600"/> Registrar Ingreso / Compra</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
               
               {/* COLUMNA IZQUIERDA: Búsqueda y Carrito */}
               <div className="flex-1 flex flex-col border-r md:pr-6">
                  
                  {/* Buscador de Productos */}
                  <div className="relative mb-6">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Buscar Producto para agregar</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Escribe el nombre o SKU del producto..." 
                        className="w-full border-2 border-blue-100 bg-blue-50/30 p-3 pl-10 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all font-medium" 
                        value={busquedaProd} 
                        onChange={(e) => setBusquedaProd(e.target.value)} 
                      />
                    </div>
                    
                    {/* Resultados de búsqueda flotantes */}
                    {busquedaProd && (
                      <div className="absolute w-full mt-1 bg-white border rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                        {productosFiltrados.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">No se encontraron productos</div>
                        ) : (
                          productosFiltrados.map(prod => (
                            <div key={prod.id} onClick={() => agregarAlCarrito(prod)} className="p-3 border-b hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors">
                              <div>
                                <p className="font-bold text-sm text-gray-800">{prod.nombre}</p>
                                <p className="text-[10px] text-gray-400 uppercase">{prod.codigo || 'S/C'}</p>
                              </div>
                              <Plus size={18} className="text-blue-600"/>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tabla del Carrito */}
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
                        <tr>
                          <th className="p-3 w-[40%]">Producto</th>
                          <th className="p-3 w-[20%]">Cant.</th>
                          <th className="p-3 w-[20%]">Costo Unit.</th>
                          <th className="p-3 w-[15%] text-right">Subtotal</th>
                          <th className="p-3 w-[5%]"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {cart.length === 0 ? (
                          <tr><td colSpan="5" className="text-center p-8 text-gray-400 italic">No hay productos en la lista de compras</td></tr>
                        ) : (
                          cart.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="p-3">
                                <p className="font-bold text-gray-800 text-xs line-clamp-2">{item.nombre}</p>
                              </td>
                              <td className="p-2">
                                <input type="number" min="1" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold" value={item.cantidad} onChange={(e) => actualizarItem(index, 'cantidad', e.target.value)} />
                              </td>
                              <td className="p-2">
                                <div className="flex items-center border rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500">
                                  <span className="pl-2 text-gray-400 text-xs">S/</span>
                                  <input type="number" min="0" step="0.01" className="w-full p-2 rounded-lg outline-none font-bold" value={item.precio_unitario} onChange={(e) => actualizarItem(index, 'precio_unitario', e.target.value)} />
                                </div>
                              </td>
                              <td className="p-3 text-right font-bold text-emerald-600">
                                S/ {item.subtotal.toFixed(2)}
                              </td>
                              <td className="p-2 text-center">
                                <button onClick={() => eliminarDelCarrito(index)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={18}/></button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>

               {/* COLUMNA DERECHA: Datos de Facturación y Totales */}
               <div className="w-full md:w-80 flex flex-col justify-between">
                 <div className="space-y-5">
                   <div>
                     <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Proveedor *</label>
                     <select className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
                       <option value="">-- Seleccionar Proveedor --</option>
                       {proveedores.map(prov => <option key={prov.id} value={prov.id}>{prov.razon_social}</option>)}
                     </select>
                   </div>
                   
                   <div>
                     <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Comprobante / Factura</label>
                     <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="F001-000234" className="w-full border p-3 pl-10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium uppercase" value={comprobante} onChange={(e) => setComprobante(e.target.value)} />
                     </div>
                   </div>
                 </div>

                 <div className="mt-8 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                   <p className="text-sm font-bold text-gray-500 uppercase mb-2">Total de Compra</p>
                   <p className="text-4xl font-black text-emerald-600 mb-6">S/ {calcularTotal().toFixed(2)}</p>
                   
                   <button onClick={handleSubmit} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-lg hover:bg-blue-700 shadow-xl shadow-blue-600/30 transition-all active:scale-95">
                     Procesar Compra
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