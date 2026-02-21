import React, { useState, useRef, useEffect } from 'react';
import { User, Plus, ChevronDown } from 'lucide-react';

/**
 * Combobox/Autosuggest: búsqueda por nombre o DNI.
 * Muestra lista filtrada y botón (+) para registro rápido.
 */
const ClienteCombobox = ({
  clientes,
  selectedCliente,
  onSelect,
  onOpenQuickRegister,
  placeholder = 'Buscar por nombre o DNI...',
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const displayValue = selectedCliente
    ? `${selectedCliente.nombre}${selectedCliente.dni ? ` (${selectedCliente.dni})` : ''}`
    : '';

  const filtered = clientes.filter((c) => {
    if (!c.id) return true; // "Sin cliente"
    const q = (query || '').toLowerCase();
    const matchNombre = (c.nombre || '').toLowerCase().includes(q);
    const matchDni = (c.dni || '').toString().includes(q);
    return matchNombre || matchDni;
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
        <User size={16} />
        Cliente
      </label>
      <div className="flex gap-1">
        <div className="flex-1 relative">
          <input
            type="text"
            value={open ? query : displayValue}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <ChevronDown size={18} />
          </button>
        </div>
        <button
          type="button"
          onClick={onOpenQuickRegister}
          className="p-2 border border-gray-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
          title="Nuevo cliente"
        >
          <Plus size={20} />
        </button>
      </div>

      {open && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto py-1">
          {filtered.map((c) => (
            <li key={c.id || 'sin-cliente'}>
              <button
                type="button"
                onClick={() => {
                  onSelect(c.id ? c : null);
                  setQuery('');
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex justify-between items-center"
              >
                <span className="text-gray-900">
                  {c.nombre || 'Sin cliente'}
                </span>
                {c.dni && <span className="text-gray-500 text-xs">{c.dni}</span>}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">Sin coincidencias</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default ClienteCombobox;
