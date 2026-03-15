import React from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, X } from 'lucide-react';
import ClienteCombobox from './ClienteCombobox';
import api from '../../services/api'; 

const IGV_PERCENT = 18;
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
    <div className="flex flex-col h-full bg-white rounded-[2rem] shadow-sm border border-gray-200/60 overflow-hidden">
      
      {/* Buscador de Cliente */}
      <div className="p-3 border-b border-gray-100 shrink-0 bg-white z-10">
        <ClienteCombobox
          clientes={clientes}
          selectedCliente={selectedCliente}
          onSelect={onClienteSelect}
          onOpenQuickRegister={onOpenQuickRegister}
        />
      </div>

      {/* Lista de Items (Compacta) */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-slate-50/30">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 min-h-[150px]">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3 border-[3px] border-white shadow-sm">
               <ShoppingBag size={24} className="text-slate-300" />
            </div>
            <p className="text-xs font-bold text-gray-600">Carrito vacío</p>
          </div>
        ) : (
          items.map((it) => (
            <div
              key={it.id + (it.codigo || '')}
              className="flex items-center gap-2.5 p-2 border border-gray-100 rounded-2xl bg-white shadow-sm hover:border-blue-200 transition-colors shrink-0"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden p-1">
                 {it.imagen ? <img src={renderImagen(it.imagen)} className="max-w-full max-h-full object-contain"/> : <ShoppingBag size={16} className="text-gray-300"/>}
              </div>

              <div className="flex-1 min-w-0 py-0.5">
                <p className="font-bold text-gray-800 text-[11px] line-clamp-2 leading-tight mb-0.5" title={it.nombre}>{it.nombre}</p>
                <p className="text-[9px] font-black text-gray-500">S/ {parseFloat(it.precio || 0).toFixed(2)} <span className="font-medium">x unid.</span></p>
              </div>
              
              <div className="flex flex-col items-end gap-1 shrink-0">
                 <p className="font-black text-emerald-600 text-xs">S/ {(parseFloat(it.precio || 0) * it.cantidad).toFixed(2)}</p>
                 
                 <div className="flex items-center gap-1">
                   <div className="flex items-center bg-slate-100/80 border border-slate-200/60 rounded-md p-0.5">
                     <button
                       type="button"
                       onClick={() => onUpdateQty(it, (it.cantidad || 1) - 1)}
                       disabled={(it.cantidad || 0) <= 1}
                       className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-red-600 hover:bg-white active:scale-90 transition-all disabled:opacity-40"
                     >
                       <Minus size={12} />
                     </button>
                     <span className="w-5 text-center font-extrabold text-[10px] text-gray-800">{it.cantidad || 1}</span>
                     <button
                       type="button"
                       onClick={() => onUpdateQty(it, (it.cantidad || 1) + 1)}
                       className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-blue-600 hover:bg-white active:scale-90 transition-all"
                     >
                       <Plus size={12} />
                     </button>
                   </div>
                   <button
                     type="button"
                     onClick={() => onRemoveItem(it)}
                     className="p-1 text-red-400 hover:text-red-600 bg-red-50 rounded-md transition-colors"
                   >
                     <Trash2 size={14} />
                   </button>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resumen Final (Súper Compacto) */}
      <div className="p-3 border-t border-gray-100 bg-white shrink-0 pb-4 md:pb-3">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-3">
           <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
             <span>Subtotal ({items.length} íts)</span>
             <span>S/ {subtotal.toFixed(2)}</span>
           </div>
           <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-2 pb-2 border-b border-dashed border-gray-300">
             <span>IGV (18%)</span>
             <span>S/ {igv.toFixed(2)}</span>
           </div>
           <div className="flex justify-between items-end">
             <span className="font-extrabold text-gray-800 uppercase tracking-widest text-[9px]">Total a Cobrar</span>
             <span className="font-black text-blue-600 text-lg leading-none">S/ {total.toFixed(2)}</span>
           </div>
        </div>
        
        <button
          type="button"
          onClick={onFinalizarVenta}
          disabled={items.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:bg-slate-200 disabled:text-gray-400 disabled:active:scale-100 text-white font-black py-3 rounded-xl transition-all shadow-md text-xs flex items-center justify-center gap-2 group"
        >
          Procesar Pago <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default CartSection;