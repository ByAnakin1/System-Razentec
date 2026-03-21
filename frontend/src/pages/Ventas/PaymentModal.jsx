import React, { useState, useEffect } from 'react';
import { X, Banknote, CreditCard, Smartphone, ShieldCheck, QrCode } from 'lucide-react';

const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const METODOS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { id: 'yape_plin', label: 'Yape / Plin', icon: Smartphone },
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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in transition-colors" onClick={onClose}>
      <div
        className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-3xl sm:rounded-[2.5rem] shadow-2xl border border-white/50 dark:border-white/10 w-full sm:max-w-md flex flex-col animate-fade-in-up overflow-hidden max-h-[95vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mt-4 sm:hidden shrink-0"></div>

        <div className="px-6 py-4 border-b border-gray-100/50 dark:border-white/5 flex justify-between items-center bg-transparent shrink-0 mt-2 sm:mt-0 transition-colors">
          <h3 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">Procesar Pago</h3>
          <button type="button" onClick={onClose} className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors border border-transparent dark:border-white/5">
            <X size={18} />
          </button>
        </div>

        <div className={`p-5 md:p-6 overflow-y-auto ${hideScrollbar} flex-1 bg-transparent`}>
          
          <div className="mb-6 p-5 bg-slate-900 dark:bg-slate-950 rounded-2xl shadow-xl shadow-slate-900/20 text-center relative overflow-hidden border border-slate-800 dark:border-blue-900/50 transition-colors">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500 opacity-20 rounded-full blur-2xl pointer-events-none"></div>
            <p className="text-[10px] font-extrabold text-slate-400 dark:text-blue-400 uppercase tracking-widest mb-1 relative z-10">Total a Cobrar</p>
            <p className="text-4xl font-black text-white relative z-10 tracking-tight">S/ {totalNum.toFixed(2)}</p>
          </div>

          <p className="text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest mb-2 px-1 transition-colors">Método de Pago</p>
          
          <div className="grid grid-cols-3 gap-3 mb-6">
            {METODOS.map((m) => {
              const Icon = m.icon;
              const isSelected = metodo === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setMetodo(m.id); setError(''); }}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all active:scale-95 backdrop-blur-md ${
                    isSelected ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-md shadow-blue-600/10' : 'border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-500/50'
                  }`}
                >
                  <Icon size={24} className={isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'} strokeWidth={isSelected ? 2.5 : 2} />
                  <span className="text-[10px] font-extrabold text-center leading-tight tracking-wide">{m.label}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-white/60 dark:bg-blue-950/30 p-4 rounded-2xl border border-gray-100/50 dark:border-white/5 shadow-sm relative overflow-hidden backdrop-blur-xl transition-colors">
            
            {/* EFECTIVO */}
            {metodo === 'efectivo' && (
              <div className="animate-fade-in">
                <label className="block text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest mb-2 transition-colors">Monto recibido (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={montoRecibido}
                  onChange={(e) => {
                    setMontoRecibido(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-3.5 bg-white/80 dark:bg-slate-900/50 border border-gray-200/80 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none font-black text-2xl text-gray-800 dark:text-white text-center transition-all shadow-sm [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  autoFocus
                />
                {montoRecibido && montoNum >= totalNum && (
                  <div className="mt-4 flex justify-between items-center bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl border border-emerald-100/50 dark:border-emerald-500/20 backdrop-blur-md transition-colors">
                    <span className="font-extrabold text-xs uppercase tracking-wider">Vuelto a entregar:</span>
                    <span className="font-black text-2xl">S/ {vuelto.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* TARJETA */}
            {metodo === 'tarjeta' && (
              <div className="animate-fade-in text-center py-6">
                <div className="w-20 h-20 bg-white/80 dark:bg-slate-800/80 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-white/5 shadow-sm backdrop-blur-md transition-colors">
                  <CreditCard size={40} className="text-gray-300 dark:text-slate-500" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-black text-gray-800 dark:text-white transition-colors">Cobro con Tarjeta</p>
                <p className="text-[11px] font-bold text-gray-400 dark:text-blue-300/70 mt-1 px-4 transition-colors">Procesa el cobro por S/ {totalNum.toFixed(2)} en tu equipo POS físico y luego confirma aquí.</p>
              </div>
            )}

            {/* YAPE / PLIN */}
            {metodo === 'yape_plin' && (
              <div className="animate-fade-in flex flex-col items-center">
                <div className="w-full flex items-center justify-center gap-4 mb-5">
                  <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden p-2 shadow-sm shrink-0 transition-colors">
                    <img 
                      src="/qr-yape.png" 
                      alt="QR de Pago" 
                      className="w-full h-full object-contain rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden flex-col items-center text-gray-300 dark:text-slate-600">
                       <QrCode size={48} strokeWidth={1.5}/>
                       <span className="text-[8px] font-bold mt-1 uppercase text-center leading-tight">Falta Imagen<br/>(qr-yape.png)</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-md px-2 py-1 rounded w-fit mb-1.5 border border-blue-100/50 dark:border-blue-500/20 transition-colors">Billetera Digital</p>
                    <p className="text-xs font-bold text-gray-500 dark:text-blue-300/70 leading-snug mb-2 transition-colors">Escanea el QR y digita exactamente:</p>
                    <p className="text-2xl font-black text-gray-800 dark:text-white tracking-tight transition-colors">S/ {totalNum.toFixed(2)}</p>
                  </div>
                </div>

                <div className="w-full pt-4 border-t border-gray-100/50 dark:border-white/5 transition-colors">
                  <label className="text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 transition-colors"><ShieldCheck size={12}/> Validar Operación</label>
                  <input
                    type="text"
                    value={numeroOperacion}
                    onChange={(e) => {
                      setNumeroOperacion(e.target.value.replace(/\D/g, '')); 
                      setError('');
                    }}
                    placeholder="Ej. 123456789"
                    className="w-full px-4 py-3 bg-white/80 dark:bg-slate-900/50 border border-gray-200/80 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none font-bold text-gray-800 dark:text-white tracking-widest text-center transition-all shadow-sm"
                  />
                  <p className="text-[9px] text-gray-400 dark:text-slate-500 text-center font-bold mt-2 transition-colors">Verifica que el cobro haya ingresado antes de confirmar.</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50/80 dark:bg-red-900/30 backdrop-blur-md text-red-600 dark:text-red-400 rounded-xl text-[11px] font-bold flex items-center justify-center text-center animate-fade-in border border-red-100/50 dark:border-red-500/20 shadow-sm transition-colors">
              <ShieldCheck size={16} className="mr-1.5 shrink-0"/> {error}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 border-t border-gray-100/50 dark:border-white/5 bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-md flex gap-3 shrink-0 rounded-b-3xl sm:rounded-b-[2.5rem] transition-colors">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 border border-gray-200/80 dark:border-white/5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl font-extrabold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-xs sm:text-sm shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3.5 bg-blue-600/90 dark:bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 text-xs sm:text-sm flex justify-center items-center gap-2 border border-transparent dark:border-white/10 backdrop-blur-md"
          >
            <ShieldCheck size={16} /> Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;