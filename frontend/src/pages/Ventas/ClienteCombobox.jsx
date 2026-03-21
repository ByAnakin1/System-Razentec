import React, { useState, useRef, useEffect } from 'react';
import { User, Plus, ChevronDown, Search } from 'lucide-react';

const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

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
    if (!c.id) return true;
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
    <div ref={containerRef} className="relative z-50">
      <label className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 transition-colors">
        <User size={14} className="text-blue-500 dark:text-blue-400"/>
        Cliente / Facturación
      </label>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-blue-400/70" size={14} />
          <input
            type="text"
            value={open ? query : displayValue}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full pl-8 pr-8 py-2.5 bg-white/80 dark:bg-blue-950/50 backdrop-blur-md border border-gray-200/80 dark:border-white/10 rounded-xl focus:bg-white dark:focus:bg-blue-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none text-xs font-bold text-gray-800 dark:text-white transition-all shadow-sm"
          />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ChevronDown size={16} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <button
          type="button"
          onClick={onOpenQuickRegister}
          className="w-10 h-[38px] bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-md border border-blue-100/50 dark:border-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-800/50 active:scale-95 transition-all shadow-sm shrink-0"
          title="Nuevo cliente"
        >
          <Plus size={18} />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl border border-white/50 dark:border-slate-700 rounded-2xl shadow-2xl animate-fade-in-down overflow-hidden">
          <ul className={`max-h-56 overflow-y-auto p-1.5 ${hideScrollbar}`}>
            {filtered.map((c) => (
              <li key={c.id || 'sin-cliente'}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(c.id ? c : null);
                    setQuery('');
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-colors flex justify-between items-center mb-0.5 last:mb-0 ${
                    selectedCliente?.id === c.id
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                      : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="truncate mr-2">
                    {c.nombre || 'Público General'}
                  </span>
                  {c.dni && <span className="text-[9px] text-gray-400 dark:text-slate-500 font-extrabold uppercase tracking-wider shrink-0 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-gray-100 dark:border-slate-700">{c.dni}</span>}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-4 text-xs font-bold text-gray-400 dark:text-slate-500 text-center">Sin coincidencias</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ClienteCombobox;