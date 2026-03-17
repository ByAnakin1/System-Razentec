import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import api from '../services/api';
import Layout from '../components/Layout';
import { 
  TrendingUp, ShoppingCart, Package, AlertTriangle, ArrowRight, Activity, 
  Users, RefreshCw, Printer, Star, CalendarDays, Store, ReceiptText
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate(); 
  const [stats, setStats] = useState({
    ventasDelMes: 0, ventasHoy: 0, comprasDelMes: 0,
    totalProductos: 0, productosStockBajo: 0, clientesTotales: 0,
    ultimasVentas: [], topProductos: []
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const obtenerSucursalDelLayout = () => {
    const sucursalGuardada = localStorage.getItem('sucursalActiva');
    if (sucursalGuardada) {
      try {
        const suc = JSON.parse(sucursalGuardada);
        return suc.id === 'ALL' ? 'general' : suc.id; 
      } catch (e) { return 'general'; }
    }
    return 'general';
  };

  const [sucursalActiva, setSucursalActiva] = useState(obtenerSucursalDelLayout());

  useEffect(() => {
    const escucharCambioSucursal = () => setSucursalActiva(obtenerSucursalDelLayout());
    window.addEventListener('sucursalCambiada', escucharCambioSucursal);
    return () => window.removeEventListener('sucursalCambiada', escucharCambioSucursal);
  }, []);

  const fetchDashboardData = async (sucursalId) => {
    setLoading(true);
    try {
      const url = sucursalId === 'general' ? '/dashboard' : `/dashboard?sucursal_id=${sucursalId}`;
      const res = await api.get(url);
      if (res.data) setStats(res.data);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(sucursalActiva);
  }, [sucursalActiva]); 

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData(sucursalActiva);
    setTimeout(() => setIsRefreshing(false), 500); 
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Layout title="Panel de Control">
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
          <Activity className="animate-spin text-blue-600" size={40} />
          <p className="text-gray-400 font-bold text-sm tracking-widest uppercase">Analizando Datos...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Panel de Control">
      
      {/* 1. SUBTÍTULO Y BOTÓN ACTUALIZAR */}
      <div className="flex justify-between items-center mb-6 md:mb-8 print:hidden bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-[10px] md:text-sm text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1.5 md:gap-2">
          <CalendarDays size={16} className="text-blue-500"/> <span className="hidden sm:inline">Resumen y</span> Estadísticas en vivo
        </p>
        
        <button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 md:px-4 md:py-2 rounded-xl font-bold transition-colors shadow-sm text-xs md:text-sm active:scale-95">
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''} /> 
          <span className="hidden sm:inline">{isRefreshing ? 'Actualizando...' : 'Actualizar Info'}</span>
        </button>
      </div>

      {/* 2. ACCIONES RÁPIDAS (Flujo Adaptativo) */}
      <div className="mb-8 md:mb-10 print:hidden">
        <h2 className="text-[11px] md:text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3 md:mb-4 px-1 flex items-center gap-2">
          <Activity size={14}/> Acciones Rápidas
        </h2>
        {/* ✨ FIX: flex-wrap con gap calculado para que en móvil quepan bien ✨ */}
        <div className="flex flex-wrap gap-3 md:gap-5">
          
          <Link to="/ventas" className="flex flex-col items-center gap-2 group flex-1 min-w-[70px] max-w-[100px]">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-600 text-white rounded-2xl md:rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-105 group-hover:bg-blue-700 transition-all active:scale-95">
              <Store size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-[9px] md:text-[11px] font-extrabold text-gray-600 text-center leading-tight uppercase tracking-wider">Vender</span>
          </Link>

          <Link to="/inventario" className="flex flex-col items-center gap-2 group flex-1 min-w-[70px] max-w-[100px]">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-purple-50 border border-purple-100 text-purple-600 rounded-2xl md:rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-purple-100 transition-all active:scale-95">
              <Package size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-[9px] md:text-[11px] font-extrabold text-gray-600 text-center leading-tight uppercase tracking-wider">Catálogo</span>
          </Link>

          <Link to="/clientes" className="flex flex-col items-center gap-2 group flex-1 min-w-[70px] max-w-[100px]">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-50 border border-amber-100 text-amber-600 rounded-2xl md:rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-amber-100 transition-all active:scale-95">
              <Users size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-[9px] md:text-[11px] font-extrabold text-gray-600 text-center leading-tight uppercase tracking-wider">Clientes</span>
          </Link>

          <Link to="/compras" className="flex flex-col items-center gap-2 group flex-1 min-w-[70px] max-w-[100px]">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl md:rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-emerald-100 transition-all active:scale-95">
              <ShoppingCart size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-[9px] md:text-[11px] font-extrabold text-gray-600 text-center leading-tight uppercase tracking-wider">Compras</span>
          </Link>

          <button onClick={handlePrint} className="flex flex-col items-center gap-2 group flex-1 min-w-[70px] max-w-[100px] outline-none">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl md:rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-slate-200 transition-all active:scale-95">
              <Printer size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-[9px] md:text-[11px] font-extrabold text-gray-600 text-center leading-tight uppercase tracking-wider">Imprimir</span>
          </button>

        </div>
      </div>

      {/* 3. RESUMEN FINANCIERO */}
      <h2 className="text-[11px] md:text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3 md:mb-4 px-1 print:hidden flex items-center gap-2">
        <TrendingUp size={14}/> Resumen Financiero
      </h2>
      
      {/* ✨ FIX: grid-cols-2 en móvil, grid-cols-3 en iPad, grid-cols-6 en PC. Evita cortes de números ✨ */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-5 mb-8 md:mb-10">
        
        <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-emerald-50 opacity-40 transition-opacity group-hover:opacity-70 pointer-events-none"><TrendingUp size={80}/></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center shrink-0 z-10 mb-3 md:mb-4">
            <TrendingUp size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="z-10 w-full truncate">
            <p className="text-[9px] md:text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">Ventas Hoy</p>
            <h3 className="text-base md:text-xl font-black text-gray-800 truncate w-full" title={`S/ ${(stats.ventasHoy || 0).toFixed(2)}`}>
              S/ {(stats.ventasHoy || 0).toFixed(2)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-blue-50 opacity-40 transition-opacity group-hover:opacity-70 pointer-events-none"><CalendarDays size={80}/></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center shrink-0 z-10 mb-3 md:mb-4">
            <CalendarDays size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="z-10 w-full truncate">
            <p className="text-[9px] md:text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">Ventas (Mes)</p>
            <h3 className="text-base md:text-xl font-black text-gray-800 truncate w-full" title={`S/ ${(stats.ventasDelMes || 0).toFixed(2)}`}>
              S/ {(stats.ventasDelMes || 0).toFixed(2)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-indigo-50 opacity-40 transition-opacity group-hover:opacity-70 pointer-events-none"><ShoppingCart size={80}/></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl flex items-center justify-center shrink-0 z-10 mb-3 md:mb-4">
            <ShoppingCart size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="z-10 w-full truncate">
            <p className="text-[9px] md:text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">Compras (Mes)</p>
            <h3 className="text-base md:text-xl font-black text-gray-800 truncate w-full" title={`S/ ${(stats.comprasDelMes || 0).toFixed(2)}`}>
              S/ {(stats.comprasDelMes || 0).toFixed(2)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-purple-50 opacity-40 transition-opacity group-hover:opacity-70 pointer-events-none"><Package size={80}/></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-50 text-purple-600 border border-purple-100 rounded-xl flex items-center justify-center shrink-0 z-10 mb-3 md:mb-4">
            <Package size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="z-10 w-full truncate">
            <p className="text-[9px] md:text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">Catálogo</p>
            <h3 className="text-base md:text-xl font-black text-gray-800 truncate w-full">
              {stats.totalProductos || 0} <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">ítems</span>
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-amber-50 opacity-40 transition-opacity group-hover:opacity-70 pointer-events-none"><Users size={80}/></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl flex items-center justify-center shrink-0 z-10 mb-3 md:mb-4">
            <Users size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="z-10 w-full truncate">
            <p className="text-[9px] md:text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">Clientes</p>
            <h3 className="text-base md:text-xl font-black text-gray-800 truncate w-full">
              {stats.clientesTotales || 0} <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">personas</span>
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-orange-50 opacity-40 transition-opacity group-hover:opacity-70 pointer-events-none"><AlertTriangle size={80}/></div>
          {stats.productosStockBajo > 0 && <div className="absolute top-0 right-0 w-2 h-full bg-orange-500 rounded-r-2xl md:rounded-r-[1.5rem] animate-pulse"></div>}
          
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl border flex items-center justify-center shrink-0 z-10 mb-3 md:mb-4 transition-colors ${stats.productosStockBajo > 0 ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-gray-50 border-gray-100 text-gray-400 group-hover:bg-orange-50 group-hover:border-orange-100 group-hover:text-orange-600'}`}>
            <AlertTriangle size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="z-10 w-full truncate">
            <p className={`text-[9px] md:text-[10px] font-extrabold uppercase tracking-widest mb-0.5 ${stats.productosStockBajo > 0 ? 'text-orange-600' : 'text-gray-400'}`}>Stock Crítico</p>
            <h3 className="text-base md:text-xl font-black text-gray-800 truncate w-full">
              {stats.productosStockBajo || 0} <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">alertas</span>
            </h3>
          </div>
        </div>

      </div>

      {/* 4. LISTAS Y RANKINGS (Grid Responsive) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 mb-8 h-auto">
        
        {/* ÚLTIMAS VENTAS */}
        <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden lg:col-span-1 xl:col-span-2 flex flex-col">
          <div className="p-4 md:p-5 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
            <h2 className="text-sm md:text-base font-extrabold text-gray-800 flex items-center gap-2">
              <ReceiptText size={18} className="text-blue-600"/> Actividad Reciente
            </h2>
            <Link to="/ventas" className="text-blue-600 text-[10px] md:text-xs font-black uppercase tracking-widest hover:text-blue-800 flex items-center gap-1 transition-colors print:hidden bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg active:scale-95">
              Ver Historial <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="flex flex-col p-2 md:p-3 divide-y divide-gray-50">
            {stats.ultimasVentas && stats.ultimasVentas.length > 0 ? (
              stats.ultimasVentas.map((venta) => (
                <div key={venta.id} className="flex items-center justify-between p-3 md:p-4 hover:bg-gray-50/80 rounded-2xl transition-colors group">
                  <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <ReceiptText size={18} className="md:w-5 md:h-5" />
                    </div>
                    <div className="flex flex-col truncate">
                      <p className="font-extrabold text-gray-800 text-[11px] md:text-sm truncate leading-tight">{venta.cliente || 'Público General'}</p>
                      <p className="text-[9px] md:text-[10px] font-bold text-gray-400 mt-1 flex items-center gap-1.5 uppercase tracking-wider">
                        <span className="text-slate-600">#{String(venta.id).padStart(5, '0')}</span> 
                        • {new Date(venta.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <p className="font-black text-emerald-600 text-sm md:text-base">S/ {(parseFloat(venta.total) || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                  <Package size={24} className="text-slate-300"/>
                </div>
                <p className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">No hay transacciones aún</p>
              </div>
            )}
          </div>
        </div>

        {/* TOP 5 PRODUCTOS MÁS VENDIDOS */}
        <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full lg:col-span-1 xl:col-span-1">
          <div className="p-4 md:p-5 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
            <h2 className="text-sm md:text-base font-extrabold text-gray-800 flex items-center gap-2">
              <Star size={18} className="text-amber-500 fill-amber-500"/> Top 5 Demandados
            </h2>
          </div>
          
          <div className="flex flex-col p-2 md:p-3 divide-y divide-gray-50 h-full">
            {stats.topProductos && stats.topProductos.length > 0 ? (
              stats.topProductos.map((prod, index) => {
                const isGold = index === 0;
                const isSilver = index === 1;
                const isBronze = index === 2;
                
                return (
                  <div key={index} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-gray-50/80 rounded-2xl transition-colors group">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-[10px] md:text-xs shrink-0 transition-transform group-hover:scale-110
                      ${isGold ? 'bg-gradient-to-tr from-yellow-300 to-amber-500 text-white shadow-md shadow-amber-500/30 border border-amber-200' : 
                        isSilver ? 'bg-gradient-to-tr from-slate-300 to-slate-400 text-white shadow-md shadow-slate-400/30 border border-slate-200' : 
                        isBronze ? 'bg-gradient-to-tr from-orange-300 to-orange-500 text-white shadow-md shadow-orange-500/30 border border-orange-200' : 
                        'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                      #{index + 1}
                    </div>
                    
                    <div className="flex flex-col truncate w-full min-w-0">
                      <p className="font-extrabold text-gray-700 text-[11px] md:text-sm truncate w-full leading-tight mb-1" title={prod.nombre}>{prod.nombre}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] md:text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          {prod.cantidad_vendida} Unid.
                        </span>
                        <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest">Despachadas</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                  <Star size={24} className="text-slate-300"/>
                </div>
                <p className="text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Sin datos de demanda</p>
              </div>
            )}
          </div>
        </div>

      </div>
      
    </Layout>
  );
};

export default Dashboard;