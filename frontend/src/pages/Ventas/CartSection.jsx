import React from 'react';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import ClienteCombobox from './ClienteCombobox';

const IGV_PERCENT = 18;

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
    // 👇 EL SECRETO ESTÁ AQUÍ: Bloqueamos la caja al tamaño del monitor
    <div className="flex flex-col h-full max-h-[calc(100vh-200px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      <div className="p-4 border-b border-gray-200 shrink-0">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <ShoppingBag size={20} />
          Carrito
        </h2>
      </div>

      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <ClienteCombobox
          clientes={clientes}
          selectedCliente={selectedCliente}
          onSelect={onClienteSelect}
          onOpenQuickRegister={onOpenQuickRegister}
        />
      </div>

      {/* 👇 La lista ocupa lo del medio sin espacio blanco abajo (pb-0) 👇 */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-0 space-y-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm">
            <ShoppingBag size={32} className="mb-2 opacity-40" />
            <p>Agrega productos desde el catálogo</p>
          </div>
        ) : (
          items.map((it) => (
            <div
              key={it.id + (it.codigo || '')}
              className="flex items-center gap-2 p-2 border border-gray-100 rounded-lg bg-gray-50/50 shrink-0"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{it.nombre}</p>
                <p className="text-xs text-gray-500">S/ {parseFloat(it.precio || 0).toFixed(2)} c/u</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdateQty(it, (it.cantidad || 1) - 1)}
                  disabled={(it.cantidad || 0) <= 1}
                  className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm font-medium">{it.cantidad || 1}</span>
                <button
                  type="button"
                  onClick={() => onUpdateQty(it, (it.cantidad || 1) + 1)}
                  className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onRemoveItem(it)}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
                title="Quitar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-5 border-t border-gray-200 space-y-3 bg-gray-50 shrink-0">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>S/ {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>IGV (18%)</span>
          <span>S/ {igv.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-200 text-base">
          <span>Total</span>
          <span>S/ {total.toFixed(2)}</span>
        </div>
        <button
          type="button"
          onClick={onFinalizarVenta}
          disabled={items.length === 0}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Finalizar Venta
        </button>
      </div>
    </div>
  );
};

export default CartSection;