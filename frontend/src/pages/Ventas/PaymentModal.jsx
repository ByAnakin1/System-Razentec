import React, { useState, useEffect } from 'react';
import { CreditCard, Banknote, X, Receipt, CheckCircle, Smartphone } from 'lucide-react';

const PaymentModal = ({ open, total, onClose, onConfirm }) => {
  const [metodo, setMetodo] = useState('efectivo');
  const [pagoCliente, setPagoCliente] = useState('');

  // ✨ FIX: Cerrar con Escape
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  // ✨ FIX: Cerrar al dar clic afuera
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    if (open) {
      setMetodo('efectivo');
      setPagoCliente(total.toFixed(2));
    }
  }, [open, total]);

  if (!open) return null;

  const pagoNum = parseFloat(pagoCliente) || 0;
  const vuelto = pagoNum - total;
  const esValido = pagoNum >= total;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!esValido) return;
    onConfirm({ 
      metodo, 
      montoRecibido: pagoNum, 
      vuelto: vuelto > 0 ? vuelto : 0, 
      total 
    });
  };

  return (
    <div onMouseDown={handleOverlayClick} className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in transition-colors duration-300">
      {/* ✨ FIX: Reducido a max-w-md para que no sea un modal gigante */}
      <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full sm:max-w-md shadow-2xl flex flex-col animate-fade-in-up overflow-hidden border border-white/50 dark:border-white/10 transition-colors duration-300">
        
        <div className="px-5 py-4 border-b border-gray-100/50 dark:border-white/5 flex justify-between items-center bg-transparent shrink-0">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mt-2 sm:hidden z-20 absolute top-2 left-1/2 -translate-x-1/2"></div>
          <h2 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2 mt-3 sm:mt-0">
            <Receipt className="text-blue-600 dark:text-blue-400" size={20}/> Procesar Venta
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors border border-transparent dark:border-white/5"><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          <div className="text-center">
            <p className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1">Monto a Cobrar</p>
            <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">S/ {total.toFixed(2)}</p>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-2 block">Método de Pago</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMetodo('efectivo')}
                className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all border ${
                  metodo === 'efectivo'
                    ? 'bg-blue-50/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/30 shadow-inner'
                    : 'bg-white dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <Banknote size={16} /> Efectivo
              </button>
              {/* ✨ FIX: Reemplazado Tarjeta Lógica Rara por Billetera Digital Básica */}
              <button
                type="button"
                onClick={() => setMetodo('transferencia')}
                className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all border ${
                  metodo === 'transferencia'
                    ? 'bg-blue-50/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/30 shadow-inner'
                    : 'bg-white dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <Smartphone size={16} /> Yape / Transf.
              </button>
            </div>
          </div>

          {metodo === 'efectivo' && (
            <div className="bg-slate-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
              <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-2 block">El cliente paga con:</label>
              <div className="relative mb-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-400 dark:text-slate-500">S/</span>
                <input
                  type="number"
                  step="0.01"
                  value={pagoCliente}
                  onChange={(e) => setPagoCliente(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-blue-950/50 border border-gray-200 dark:border-white/10 rounded-xl font-black text-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
                />
              </div>

              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Vuelto / Cambio:</span>
                <span className={`font-black text-lg ${vuelto >= 0 ? 'text-amber-500' : 'text-red-500 dark:text-red-400'}`}>
                  S/ {vuelto >= 0 ? vuelto.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          )}

          {metodo === 'transferencia' && (
            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/10 text-center">
              <Smartphone size={32} className="mx-auto text-emerald-500/50 mb-2" />
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Verifica en tu app bancaria que el cliente haya realizado la transferencia de S/ {total.toFixed(2)} antes de confirmar la venta.</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 font-extrabold text-gray-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border border-gray-200/80 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-sm shadow-sm backdrop-blur-md">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={!esValido}
              className="flex-1 py-3.5 font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-slate-300 disabled:dark:bg-slate-700 disabled:active:scale-100 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm border border-transparent dark:border-white/10"
            >
              <CheckCircle size={16}/> Confirmar Pago
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default PaymentModal;