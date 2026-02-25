import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import api from '../../services/api';

// Le agregamos "ventaIdModal" y "onClose" para que funcione como ventana emergente
const DetalleVenta = ({ ventaIdModal, onClose }) => {
  const params = useParams();
  const id = ventaIdModal || params.id;
  const navigate = useNavigate();
  const [venta, setVenta] = useState(null);

  // Saber si está abierto como Modal (ventana borrosa) o como página entera
  const isModal = !!ventaIdModal;

  useEffect(() => {
    const fetchVenta = async () => {
      try {
        const res = await api.get(`/ventas/${id}/detalle`);
        setVenta(res.data);
      } catch (error) {
        console.error("Error al cargar la venta", error);
      }
    };
    if (id) fetchVenta();
  }, [id]);

  if (!venta) {
    return isModal ? (
       <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
         <div className="bg-white p-8 rounded-xl font-medium">Generando boleta...</div>
       </div>
    ) : <div className="p-8 text-center font-medium">Cargando boleta...</div>;
  }

  const total = parseFloat(venta.total);
  const subtotalBase = total / 1.18;
  const igv = total - subtotalBase;

  // Esta es la tarjeta blanca con la boleta
  const contenidoBoleta = (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 w-full max-w-lg mx-auto relative print:shadow-none print:border-none print:p-0">
      
      {/* Botón X de cerrar (solo sale en la ventana emergente) */}
      {isModal && (
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-100 rounded-full print:hidden">
          <X size={20} />
        </button>
      )}
      
      <h2 className="text-xl font-bold mb-6 text-gray-800 text-center">Detalle de Venta</h2>
      
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-8">
        <div>
          <p>ID Venta: <span className="font-semibold text-gray-800">#{venta.id}</span></p>
          <p>Cliente: <span className="text-gray-800">{venta.cliente_nombre || 'Público General'}</span></p>
        </div>
        <div className="text-right">
          <p>Fecha: <span className="text-gray-800">{new Date(venta.created_at).toLocaleString('es-PE')}</span></p>
        </div>
      </div>

      <table className="w-full text-sm mb-6">
        <thead className="border-b border-gray-200 text-left text-gray-600">
          <tr>
            <th className="py-2">Producto</th>
            <th className="py-2 text-center">Cant.</th>
            <th className="py-2 text-right">P. Unit.</th>
            <th className="py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {venta.detalles.map((item, idx) => (
            <tr key={idx}>
              <td className="py-3 font-medium text-gray-800">{item.producto_nombre}</td>
              <td className="py-3 text-center">{item.cantidad}</td>
              <td className="py-3 text-right">S/ {parseFloat(item.precio_unitario).toFixed(2)}</td>
              <td className="py-3 text-right font-medium text-gray-800">S/ {parseFloat(item.subtotal).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end text-sm text-gray-600 mb-8">
        <div className="w-48 space-y-2">
          <div className="flex justify-between"><span>Subtotal</span><span>S/ {subtotalBase.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>IGV (18%)</span><span>S/ {igv.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-gray-800 pt-2 border-t text-base">
            <span>Total</span><span>S/ {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 print:hidden">
        <button onClick={() => window.print()} className="px-6 py-2 bg-gray-800 text-white rounded-lg shadow-sm hover:bg-gray-700 w-full font-medium">
          🖨️ Imprimir Boleta
        </button>
        {isModal && (
          <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 w-full font-medium">
            Nueva Venta
          </button>
        )}
      </div>
    </div>
  );

  // SI ES MODAL: Retornamos con el fondo negro borroso
  if (isModal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
         {contenidoBoleta}
      </div>
    );
  }

  // SI NO ES MODAL: (Viene del Historial) Retornamos la página entera
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between mb-6 print:hidden">
          <button onClick={() => navigate('/historial-ventas')} className="px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50 font-medium">
            ← Ir a Historial
          </button>
        </div>
        {contenidoBoleta}
      </div>
    </div>
  );
};

export default DetalleVenta;