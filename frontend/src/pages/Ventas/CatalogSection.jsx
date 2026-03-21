import React, { useState, useMemo } from 'react';
import { Search, Package, Image as ImageIcon, Plus, Check, ArrowDownAZ, ArrowDownZA, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import api from '../../services/api'; 

const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";
const baseURL = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:3000';

const renderImagen = (path) => {
  if (!path) return null;
  if (path.startsWith('data:image') || path.startsWith('http')) return path;
  return `${baseURL}${path}`;
};

const CatalogSection = ({ productos, loading, searchTerm, onSearchChange, onAddProduct, obtenerStockLocal }) => {
  const [soloStock, setSoloStock] = useState(true);
  const [orden, setOrden] = useState('az');

  const productosProcesados = useMemo(() => {
    let filtrados = productos.filter((p) =>
      (p.nombre || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (p.codigo || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    if (soloStock) {
      filtrados = filtrados.filter(p => (obtenerStockLocal ? obtenerStockLocal(p) : 0) > 0);
    }

    filtrados.sort((a, b) => {
      const stockA = obtenerStockLocal ? obtenerStockLocal(a) : 0;
      const stockB = obtenerStockLocal ? obtenerStockLocal(b) : 0;

      if (stockA > 0 && stockB <= 0) return -1;
      if (stockA <= 0 && stockB > 0) return 1;

      switch (orden) {
        case 'az': return (a.nombre || '').localeCompare(b.nombre || '');
        case 'za': return (b.nombre || '').localeCompare(a.nombre || '');
        case 'precio_asc': return parseFloat(a.precio || 0) - parseFloat(b.precio || 0);
        case 'precio_desc': return parseFloat(b.precio || 0) - parseFloat(a.precio || 0);
        case 'recientes': return b.id - a.id;
        default: return 0;
      }
    });

    return filtrados;
  }, [productos, searchTerm, soloStock, orden, obtenerStockLocal]);

  return (
    <div className="flex flex-col h-full bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[1.5rem] lg:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/80 dark:border-white/5 overflow-hidden relative transition-colors duration-300">
      
      {/* CABECERA (Buscador) */}
      <div className="pt-3 px-3 pb-2 shrink-0 bg-transparent z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-blue-400/70" size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white/80 dark:bg-blue-950/50 backdrop-blur-md border border-gray-200/80 dark:border-white/10 rounded-xl focus:bg-white dark:focus:bg-blue-950 focus:ring-2 focus:ring-blue-500/20 outline-none text-xs md:text-sm font-bold text-gray-800 dark:text-white transition-all shadow-sm"
          />
        </div>
      </div>
      
      {/* FILTROS RÁPIDOS */}
      <div className={`flex gap-2 px-3 pb-3 overflow-x-auto ${hideScrollbar} border-b border-gray-100/50 dark:border-white/5 shrink-0 bg-transparent`}>
        <button 
          onClick={() => setSoloStock(!soloStock)} 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-all shrink-0 border backdrop-blur-md ${soloStock ? 'bg-emerald-500/90 border-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-white/50 dark:bg-slate-800/50 border-gray-200/50 dark:border-white/5 text-slate-500 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'}`}
        >
          {soloStock ? <Check size={12}/> : <Package size={12}/>} Solo Disponibles
        </button>
        <button 
          onClick={() => setOrden(orden === 'az' ? 'za' : 'az')} 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-all shrink-0 border backdrop-blur-md ${orden.includes('z') ? 'bg-slate-800 dark:bg-blue-600 border-slate-800 dark:border-blue-500 text-white shadow-md shadow-slate-900/20 dark:shadow-blue-900/40' : 'bg-white/50 dark:bg-slate-800/50 border-gray-200/50 dark:border-white/5 text-slate-500 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'}`}
        >
          {orden === 'za' ? <ArrowDownZA size={12}/> : <ArrowDownAZ size={12}/>} A - Z
        </button>
        <button 
          onClick={() => setOrden('recientes')} 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-all shrink-0 border backdrop-blur-md ${orden === 'recientes' ? 'bg-slate-800 dark:bg-blue-600 border-slate-800 dark:border-blue-500 text-white shadow-md shadow-slate-900/20 dark:shadow-blue-900/40' : 'bg-white/50 dark:bg-slate-800/50 border-gray-200/50 dark:border-white/5 text-slate-500 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'}`}
        >
          <Sparkles size={12}/> Novedades
        </button>
        <button 
          onClick={() => setOrden(orden === 'precio_asc' ? 'precio_desc' : 'precio_asc')} 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-all shrink-0 border backdrop-blur-md ${orden.includes('precio') ? 'bg-slate-800 dark:bg-blue-600 border-slate-800 dark:border-blue-500 text-white shadow-md shadow-slate-900/20 dark:shadow-blue-900/40' : 'bg-white/50 dark:bg-slate-800/50 border-gray-200/50 dark:border-white/5 text-slate-500 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'}`}
        >
          {orden === 'precio_desc' ? <TrendingDown size={12}/> : <TrendingUp size={12}/>} Precio
        </button>
      </div>
      
      {/* ÁREA DE TARJETAS (Catálogo) */}
      <div className={`flex-1 overflow-y-auto p-3 ${hideScrollbar} bg-transparent`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-blue-300/70 gap-3 min-h-[150px]">
             <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-xs font-bold uppercase tracking-widest">Cargando catálogo...</p>
          </div>
        ) : productosProcesados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-slate-500 min-h-[150px]">
            <Package size={40} className="mb-3 opacity-30 dark:opacity-50" strokeWidth={1.5} />
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400">{searchTerm ? 'Sin resultados' : 'Catálogo vacío'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pb-10">
            {productosProcesados.map((prod) => {
              const stockAca = obtenerStockLocal ? obtenerStockLocal(prod) : 0;
              const agotado = stockAca <= 0;
              
              return (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => onAddProduct(prod)}
                  disabled={agotado}
                  className={`bg-white/80 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/50 dark:border-white/5 text-left transition-all flex flex-col group overflow-hidden relative ${agotado ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 dark:hover:border-blue-500/50 active:scale-95'}`}
                >
                  <div className={`h-24 md:h-28 bg-white/50 dark:bg-slate-800/50 border-b border-gray-100/50 dark:border-white/5 flex items-center justify-center p-2 relative shrink-0 transition-colors ${agotado && 'grayscale'}`}>
                    {prod.imagen ? (
                      <img src={renderImagen(prod.imagen)} alt={prod.nombre} className="max-w-full max-h-full object-contain rounded drop-shadow-sm group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="text-slate-200 dark:text-slate-600 flex flex-col items-center group-hover:scale-105 transition-transform"><ImageIcon size={32} strokeWidth={1.5} /></div>
                    )}
                    
                    {agotado && (
                      <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center">
                         <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-lg border border-red-500">Agotado</span>
                      </div>
                    )}

                    {!agotado && (
                      <div className="absolute bottom-1.5 right-1.5 w-7 h-7 bg-blue-600/90 backdrop-blur-md text-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30 opacity-0 group-hover:opacity-100 transition-all md:flex hidden translate-y-2 group-hover:translate-y-0">
                        <Plus size={16}/>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-2.5 flex-1 flex flex-col justify-between bg-transparent">
                    <div>
                      <p className="text-[8px] font-extrabold text-slate-400 dark:text-blue-400 mb-0.5 tracking-widest uppercase truncate transition-colors">{prod.codigo || 'SIN CÓDIGO'}</p>
                      <h3 className="font-extrabold text-gray-800 dark:text-white text-[10px] md:text-xs leading-tight mb-1.5 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={prod.nombre}>{prod.nombre}</h3>
                    </div>
                    <div className="flex justify-between items-end mt-0.5 pt-1.5 border-t border-gray-100/50 dark:border-white/5">
                      <span className="text-xs md:text-sm font-black text-emerald-600 dark:text-emerald-400 transition-colors">S/ {parseFloat(prod.precio || 0).toFixed(2)}</span>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md border backdrop-blur-md transition-colors ${agotado ? 'bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20' : 'bg-slate-50/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/5'}`}>
                        Stk: {stockAca}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogSection;