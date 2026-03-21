import React from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import ClienteCombobox from './ClienteCombobox';
import api from '../../services/api'; 

const IGV_PERCENT = 18;
const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";
const baseURL = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:3000';

const renderImagen = (path) => {
  if (!path) return null;
  if (path.startsWith('data:image') || path.startsWith('http')) return path;
  return `${baseURL}${path}`;
};

const CartSection = ({
  items,
  onUpdateQty,
  onRemoveItem,
  clientes,
  selectedCliente,
  onClienteSelect,
  onOpenQuickRegister,
  onFinalizarVenta,
}) => {
  const subtotal = items.reduce((acc, it) => acc + parseFloat(it.precio || 0) * (it.cantidad || 0), 0);
  const igv = (subtotal * IGV_PERCENT) / 100;
  const total = subtotal + igv;

  return (
    <div className="flex flex-col h-full bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[1.5rem] lg:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/80 dark:border-white/5 overflow-hidden transition-colors duration-300">
      
      {/* Buscador de Cliente */}
      <div className="p-3 border-b border-gray-100/50 dark:border-white/5 shrink-0 bg-transparent z-10 transition-colors">
        <ClienteCombobox
          clientes={clientes}
          selectedCliente={selectedCliente}
          onSelect={onClienteSelect}
          onOpenQuickRegister={onOpenQuickRegister}
        />
      </div>

      {/* Lista de Items (Compacta) */}
      <div className={`flex-1 overflow-y-auto p-2.5 space-y-2 ${hideScrollbar} bg-transparent`}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-500 min-h-[150px]">
            <div className="w-16 h-16 bg-white/50 dark:bg-slate-800/30 backdrop-blur-md rounded-full flex items-center justify-center mb-3 border-[3px] border-white/80 dark:border-white/5 shadow-sm transition-colors">
               <ShoppingBag size={24} className="text-slate-300 dark:text-slate-500" strokeWidth={1.5} />
            </div>
            <p className="text-xs font-bold text-gray-600 dark:text-slate-400 transition-colors">Carrito vacío</p>
          </div>
        ) : (
          items.map((it) => (
            <div
              key={it.id + (it.codigo || '')}
              className="flex items-center gap-2.5 p-2 border border-gray-100/50 dark:border-white/5 rounded-[1.25rem] bg-white/80 dark:bg-blue-900/10 backdrop-blur-md shadow-sm hover:border-blue-200 dark:hover:border-blue-500/30 transition-all shrink-0 group"
            >
              <div className="w-12 h-12 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-white/5 flex items-center justify-center shrink-0 overflow-hidden p-1 transition-colors">
                 {it.imagen ? <img src={renderImagen(it.imagen)} className="max-w-full max-h-full object-contain drop-shadow-sm"/> : <ShoppingBag size={16} className="text-gray-300 dark:text-slate-600"/>}
              </div>

              <div className="flex-1 min-w-0 py-0.5">
                <p className="font-extrabold text-gray-800 dark:text-white text-[11px] line-clamp-2 leading-tight mb-0.5 transition-colors" title={it.nombre}>{it.nombre}</p>
                <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 transition-colors">S/ {parseFloat(it.precio || 0).toFixed(2)} <span className="font-bold text-gray-400 dark:text-blue-300/70">x unid.</span></p>
              </div>
              
              <div className="flex flex-col items-end gap-1 shrink-0">
                 <p className="font-black text-emerald-600 dark:text-emerald-400 text-xs transition-colors">S/ {(parseFloat(it.precio || 0) * it.cantidad).toFixed(2)}</p>
                 
                 <div className="flex items-center gap-1">
                   <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/60 dark:border-white/5 rounded-md p-0.5 transition-colors">
                     <button
                       type="button"
                       onClick={() => onUpdateQty(it, (it.cantidad || 1) - 1)}
                       disabled={(it.cantidad || 0) <= 1}
                       className="w-5 h-5 flex items-center justify-center rounded text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 active:scale-90 transition-all disabled:opacity-30"
                     >
                       <Minus size={12} />
                     </button>
                     <span className="w-5 text-center font-black text-[10px] text-gray-800 dark:text-white transition-colors">{it.cantidad || 1}</span>
                     <button
                       type="button"
                       onClick={() => onUpdateQty(it, (it.cantidad || 1) + 1)}
                       className="w-5 h-5 flex items-center justify-center rounded text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 active:scale-90 transition-all"
                     >
                       <Plus size={12} />
                     </button>
                   </div>
                   <button
                     type="button"
                     onClick={() => onRemoveItem(it)}
                     className="p-1 text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-400 bg-red-50/80 dark:bg-red-900/30 backdrop-blur-md rounded-md transition-colors"
                   >
                     <Trash2 size={14} />
                   </button>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resumen Final (Súper Compacto y Glass) */}
      <div className="p-3 border-t border-gray-100/50 dark:border-white/5 bg-transparent shrink-0 pb-4 md:pb-3 transition-colors">
        <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-100/50 dark:border-white/5 rounded-xl p-3 mb-3 transition-colors">
           <div className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-blue-300/70 mb-1 transition-colors">
             <span>Subtotal ({items.length} íts)</span>
             <span>S/ {subtotal.toFixed(2)}</span>
           </div>
           <div className="flex justify-between text-[10px] font-bold text-gray-500 dark:text-blue-300/70 mb-2 pb-2 border-b border-dashed border-gray-200/80 dark:border-slate-700 transition-colors">
             <span>IGV (18%)</span>
             <span>S/ {igv.toFixed(2)}</span>
           </div>
           <div className="flex justify-between items-end">
             <span className="font-black text-gray-800 dark:text-white uppercase tracking-widest text-[9px] transition-colors">Total a Cobrar</span>
             <span className="font-black text-blue-600 dark:text-blue-400 text-lg leading-none transition-colors">S/ {total.toFixed(2)}</span>
           </div>
        </div>
        
        <button
          type="button"
          onClick={onFinalizarVenta}
          disabled={items.length === 0}
          className="w-full bg-blue-600/90 dark:bg-blue-600 backdrop-blur-md hover:bg-blue-700 active:scale-[0.98] disabled:bg-slate-200 disabled:dark:bg-slate-800 disabled:text-gray-400 disabled:dark:text-slate-500 disabled:active:scale-100 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 text-xs flex items-center justify-center gap-2 group border border-transparent dark:border-white/10 disabled:border-transparent"
        >
          Procesar Pago <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default CartSection;