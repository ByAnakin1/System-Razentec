import React, { useState, useEffect } from 'react';
import { X, Banknote, CreditCard, Smartphone } from 'lucide-react';

const METODOS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { id: 'yape_plin', label: 'Yape / Plin', icon: Smartphone },
];

/**
 * Modal de Checkout: resumen total, método de pago, campos según método y Confirmar Venta.
 */
const PaymentModal = ({ open, total, onClose, onConfirm }) => {
  const [metodo, setMetodo] = useState('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [error, setError] = useState('');

  const totalNum = parseFloat(total) || 0;
  const montoNum = parseFloat(montoRecibido) || 0;
  const vuelto = metodo === 'efectivo' ? Math.max(0, montoNum - totalNum) : 0;

  useEffect(() => {
    if (open) {
      setMetodo('efectivo');
      setMontoRecibido(totalNum > 0 ? totalNum.toFixed(2) : '');
      setNumeroOperacion('');
      setError('');
    }
  }, [open, totalNum]);

  const handleConfirm = () => {
    if (metodo === 'efectivo' && montoNum < totalNum) {
      setError('El monto recibido debe ser mayor o igual al total.');
      return;
    }
    if (metodo === 'yape_plin' && !numeroOperacion.trim()) {
      setError('Ingresa el número de operación.');
      return;
    }
    setError('');
    onConfirm({
      metodo,
      total: totalNum,
      montoRecibido: metodo === 'efectivo' ? montoNum : totalNum,
      vuelto: metodo === 'efectivo' ? vuelto : 0,
      numeroOperacion: metodo === 'yape_plin' ? numeroOperacion.trim() : null,
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Pago</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Total a pagar en grande */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-1">Total a pagar</p>
          <p className="text-3xl font-bold text-gray-900">S/ {totalNum.toFixed(2)}</p>
        </div>

        <div className="space-y-2 mb-4">
          {METODOS.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetodo(m.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                  metodo === m.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon size={22} className={metodo === m.id ? 'text-blue-600' : 'text-gray-500'} />
                <span className="font-medium">{m.label}</span>
              </button>
            );
          })}
        </div>

        {metodo === 'efectivo' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto recibido (S/)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={montoRecibido}
              onChange={(e) => setMontoRecibido(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {montoRecibido && montoNum >= totalNum && (
              <p className="mt-2 text-green-600 font-medium">Vuelto: S/ {vuelto.toFixed(2)}</p>
            )}
          </div>
        )}

        {metodo === 'yape_plin' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de operación</label>
            <input
              type="text"
              value={numeroOperacion}
              onChange={(e) => setNumeroOperacion(e.target.value)}
              placeholder="Ej. 123456789"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
          >
            Confirmar venta
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
