import React, { useState, useEffect } from 'react';
import { X, Banknote, CreditCard, Smartphone, CheckCircle } from 'lucide-react';

const METODOS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { id: 'yape_plin', label: 'Yape/Plin', icon: Smartphone },
];

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
      setError('Ingresa el número de operación para validar el pago.');
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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-[2rem] shadow-2xl w-full sm:max-w-sm flex flex-col animate-fade-in-up overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden shrink-0"></div>

        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 mt-2 sm:mt-0">
          <h3 className="text-lg font-extrabold text-gray-800">Procesar Pago</h3>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-1 bg-slate-50/50">
          
          <div className="mb-4 p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20 text-center relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1 relative z-10">Total a Cobrar</p>
            <p className="text-3xl font-black text-white relative z-10">S/ {totalNum.toFixed(2)}</p>
          </div>

          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">Método</p>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            {METODOS.map((m) => {
              const Icon = m.icon;
              const isSelected = metodo === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setMetodo(m.id); setError(''); }}
                  className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                    isSelected ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-blue-300'
                  }`}
                >
                  <Icon size={20} className={isSelected ? 'text-blue-600' : 'text-gray-400'} />
                  <span className="text-[9px] sm:text-[10px] font-bold text-center leading-tight">{m.label}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
            {metodo === 'efectivo' && (
              <div className="animate-fade-in">
                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Monto recibido (S/)</label>
                {/* ✨ FIX: [&::-webkit-outer-spin-button]:appearance-none ELIMINA LAS FLECHAS NATIVAS DEL INPUT TYPE="NUMBER" ✨ */}
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={montoRecibido}
                  onChange={(e) => {
                    setMontoRecibido(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-black text-lg text-gray-800 text-center transition-all [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  autoFocus
                />
                {montoRecibido && montoNum >= totalNum && (
                  <div className="mt-3 flex justify-between items-center bg-emerald-50 text-emerald-700 p-2.5 rounded-lg border border-emerald-100">
                    <span className="font-bold text-xs">Vuelto a entregar:</span>
                    <span className="font-black text-lg">S/ {vuelto.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {metodo === 'tarjeta' && (
              <div className="animate-fade-in text-center py-2">
                <CreditCard size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-gray-600">Cobro con Tarjeta</p>
                <p className="text-[10px] text-gray-400 mt-1">Verifica la transacción en el POS físico.</p>
              </div>
            )}

            {metodo === 'yape_plin' && (
              <div className="animate-fade-in">
                <label className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">N° Operación</label>
                <input
                  type="text"
                  value={numeroOperacion}
                  onChange={(e) => {
                    setNumeroOperacion(e.target.value);
                    setError('');
                  }}
                  placeholder="Ej. 123456789"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-bold text-gray-800 text-center transition-all"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="mt-3 p-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold flex items-center justify-center text-center animate-fade-in border border-red-100">
              {error}
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 border-t border-gray-100 bg-white flex gap-2 shrink-0 rounded-b-3xl pb-6 md:pb-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors text-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-600/30 text-xs flex justify-center items-center gap-1.5"
          >
            <CheckCircle size={14} /> Confirmar
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentModal;