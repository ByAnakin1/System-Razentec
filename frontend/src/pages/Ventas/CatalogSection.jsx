import React, { useState, useMemo } from 'react';
import { Search, Package, Image as ImageIcon, Plus, Check, ArrowDownAZ, ArrowDownZA, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import api from '../../services/api'; 

const baseURL = api.defaults.baseURL ? api.defaults.baseURL.replace('/api', '') : 'http://localhost:3000';

const renderImagen = (path) => {
  if (!path) return null;
  if (path.startsWith('data:image') || path.startsWith('http')) return path;
  return `${baseURL}${path}`;
};

const CatalogSection = ({ productos, loading, searchTerm, onSearchChange, onAddProduct, obtenerStockLocal }) => {
  
  // ✨ NUEVOS ESTADOS PARA LOS FILTROS RÁPIDOS ✨
  const [soloStock, setSoloStock] = useState(true); // TRUE por defecto: Oculta los agotados
  const [orden, setOrden] = useState('az'); // Opciones: 'az', 'za', 'precio_asc', 'precio_desc', 'recientes'

  // ✨ LÓGICA DE PROCESAMIENTO INTEGLIGENTE ✨
  const productosProcesados = useMemo(() => {
    // 1. Filtrar por búsqueda (Buscador superior)
    let filtrados = productos.filter((p) =>
      (p.nombre || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (p.codigo || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    // 2. Filtro: Ocultar agotados si el botón "Solo Disponibles" está activo
    if (soloStock) {
      filtrados = filtrados.filter(p => (obtenerStockLocal ? obtenerStockLocal(p) : 0) > 0);
    }

    // 3. Ordenamiento
    filtrados.sort((a, b) => {
      const stockA = obtenerStockLocal ? obtenerStockLocal(a) : 0;
      const stockB = obtenerStockLocal ? obtenerStockLocal(b) : 0;

      // REGLA DE ORO: Siempre mandar los agotados al fondo (Incluso si están visibles)
      if (stockA > 0 && stockB <= 0) return -1;
      if (stockA <= 0 && stockB > 0) return 1;

      // Aplicar el orden seleccionado por el usuario
      switch (orden) {
        case 'az':
          return (a.nombre || '').localeCompare(b.nombre || '');
        case 'za':
          return (b.nombre || '').localeCompare(a.nombre || '');
        case 'precio_asc':
          return parseFloat(a.precio || 0) - parseFloat(b.precio || 0);
        case 'precio_desc':
          return parseFloat(b.precio || 0) - parseFloat(a.precio || 0);
        case 'recientes':
          return b.id - a.id; // Asume que un ID mayor significa que es más nuevo/relevante
        default:
          return 0;
      }
    });

    return filtrados;
  }, [productos, searchTerm, soloStock, orden, obtenerStockLocal]);

  return (
    <div className="flex flex-col h-full bg-white rounded-[2rem] shadow-sm border border-gray-200/60 overflow-hidden relative">
      
      {/* CABECERA (Buscador) */}
      <div className="pt-3 px-3 pb-2 shrink-0 bg-white z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-xs md:text-sm font-medium transition-all"
          />
        </div>
      </div>
      
      {/* ✨ NUEVO: FILTROS RÁPIDOS (Chips / Píldoras Horizontales) ✨ */}
      <div className="flex gap-2 px-3 pb-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-b border-gray-100 shrink-0 bg-white">
        <button 
          onClick={() => setSoloStock(!soloStock)} 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold whitespace-nowrap transition-all shrink-0 ${soloStock ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          {soloStock ? <Check size={14}/> : <Package size={14}/>} Solo Disponibles
        </button>
        <button 
          onClick={() => setOrden(orden === 'az' ? 'za' : 'az')} 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold whitespace-nowrap transition-all shrink-0 ${orden.includes('z') ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          {orden === 'za' ? <ArrowDownZA size={14}/> : <ArrowDownAZ size={14}/>} A - Z
        </button>
        <button 
          onClick={() => setOrden('recientes')} 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold whitespace-nowrap transition-all shrink-0 ${orden === 'recientes' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          <Sparkles size={14}/> Novedades
        </button>
        <button 
          onClick={() => setOrden(orden === 'precio_asc' ? 'precio_desc' : 'precio_asc')} 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold whitespace-nowrap transition-all shrink-0 ${orden.includes('precio') ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
        >
          {orden === 'precio_desc' ? <TrendingDown size={14}/> : <TrendingUp size={14}/>} Precio
        </button>
      </div>
      
      {/* ÁREA DE TARJETAS (Catálogo) */}
      <div className="flex-1 overflow-y-auto p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-slate-50/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 min-h-[150px]">
             <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-xs font-medium">Cargando catálogo...</p>
          </div>
        ) : productosProcesados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 min-h-[150px]">
            <Package size={36} className="mb-2 opacity-20" />
            <p className="text-xs font-bold text-gray-600">{searchTerm ? 'Sin resultados' : 'Catálogo vacío'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 pb-10">
            {productosProcesados.map((prod) => {
              const stockAca = obtenerStockLocal ? obtenerStockLocal(prod) : 0;
              const agotado = stockAca <= 0;
              
              return (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => onAddProduct(prod)}
                  disabled={agotado}
                  className={`bg-white rounded-2xl border border-gray-200 text-left transition-all flex flex-col group overflow-hidden relative ${agotado ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md hover:-translate-y-0.5 hover:border-blue-300 active:scale-95'}`}
                >
                  <div className={`h-24 md:h-28 bg-white border-b border-gray-100 flex items-center justify-center p-1.5 relative shrink-0 ${agotado && 'grayscale opacity-70'}`}>
                    {prod.imagen ? (
                      <img src={renderImagen(prod.imagen)} alt={prod.nombre} className="max-w-full max-h-full object-contain rounded drop-shadow-sm" />
                    ) : (
                      <div className="text-slate-200 flex flex-col items-center"><ImageIcon size={32} strokeWidth={1} /></div>
                    )}
                    
                    {agotado && (
                      <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                         <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg">Agotado</span>
                      </div>
                    )}

                    {!agotado && (
                      <div className="absolute bottom-1.5 right-1.5 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity md:flex hidden">
                        <Plus size={14}/>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[8px] font-extrabold text-slate-400 mb-0.5 tracking-widest uppercase truncate">{prod.codigo || 'SIN CÓDIGO'}</p>
                      <h3 className="font-bold text-gray-800 text-[10px] md:text-xs leading-tight mb-1.5 line-clamp-2" title={prod.nombre}>{prod.nombre}</h3>
                    </div>
                    <div className="flex justify-between items-end mt-0.5 pt-1.5 border-t border-gray-50 border-dashed">
                      <span className="text-xs md:text-sm font-black text-emerald-600">S/ {parseFloat(prod.precio || 0).toFixed(2)}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${agotado ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
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