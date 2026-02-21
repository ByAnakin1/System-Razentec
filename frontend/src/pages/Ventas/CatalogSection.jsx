import React from 'react';
import { Search, Package } from 'lucide-react';

/**
 * Catálogo de productos con buscador por nombre o SKU.
 * Lista en grid de tarjetas clicables para agregar al carrito.
 */
const CatalogSection = ({ productos, loading, searchTerm, onSearchChange, onAddProduct }) => {
  const filtered = productos.filter(
    (p) =>
      (p.nombre || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (p.codigo || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Catálogo</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-500">Cargando productos...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <Package size={40} className="mb-2 opacity-50" />
            <p>{searchTerm ? 'No hay coincidencias' : 'No hay productos'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => onAddProduct(prod)}
                className="text-left p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
              >
                <p className="font-medium text-gray-900 truncate">{prod.nombre}</p>
                <p className="text-xs text-gray-500 mt-0.5">{prod.codigo || 'Sin SKU'}</p>
                <p className="text-green-600 font-bold mt-1">S/ {parseFloat(prod.precio || 0).toFixed(2)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogSection;
