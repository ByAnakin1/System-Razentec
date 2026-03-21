import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import api from '../services/api';
import Layout from '../components/Layout';
import { 
  TrendingUp, ShoppingCart, Package, AlertTriangle, ArrowRight, Activity, 
  Users, RefreshCw, Printer, Star, CalendarDays, Store, ReceiptText, LayoutDashboard 
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
      <Layout title="Panel de Control" moduleIcon={<LayoutDashboard />}>
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
          <Activity className="animate-spin text-blue-600" size={40} />
          <p className="text-gray-400 dark:text-blue-300 font-bold text-sm tracking-widest uppercase transition-colors">Analizando Datos...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Panel de Control" moduleIcon={<LayoutDashboard />}>
      
      {/* 1. SUBTÍTULO Y BOTÓN ACTUALIZAR (LIQUID GLASS) */}
      <div className="flex justify-between items-center mb-6 md:mb-8 print:hidden bg-white/60 dark:bg-blue-950/30 backdrop-blur-2xl p-3 md:p-4 rounded-[1.5rem] shadow-sm border border-white/80 dark:border-white/5 transition-colors duration-300">
        <p className="text-[10px] md:text-sm text-gray-500 dark:text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5 md:gap-2 transition-colors">
          <CalendarDays size={16} className="text-blue-500 dark:text-blue-400"/> <span className="hidden sm:inline">Resumen y</span> Estadísticas en vivo
        </p>
        
        <button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-2 md:px-4 md:py-2 rounded-xl font-bold transition-all shadow-sm border border-transparent dark:border-blue-500/20 text-xs md:text-sm active:scale-95">
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600 dark:text-blue-400' : ''} /> 
          <span className="hidden sm:inline">{isRefreshing ? 'Actualizando...' : 'Actualizar Info'}</span>
        </button>
      </div>

      {/* 2. ACCIONES RÁPIDAS (LIQUID GLASS ADAPTATIVO) */}
      <div className="mb-8 md:mb-10 print:hidden">
        <h2 className="text-[11px] md:text-xs font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest mb-3 md:mb-4 px-1 flex items-center gap-2 transition-colors">
          <Activity size={14}/> Acciones Rápidas
        </h2>
        <div className="flex flex-wrap gap-3 md:gap-5">
          
          <Link to="/ventas" className="flex flex-col items-center gap-2 group flex-1 min-w-[70px] max-w-[100px]">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-600/90 text-white rounded-[1.25rem] md:rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-600/30 backdrop-blur-md border border-white/20 group-hover:scale-105 group-hover:bg-blue-600 transition-all active:scale-95">
              <Store size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-[9px] md:text-[11px] font-extrabold text-gray-600 dark:text-slate-300 text-center leading-tight uppercase tracking-wider transition-colors">Vender</span>
          </Link>

          <Link to="/inventario" className="flex flex-col items-center gap-2 group flex-1 min-w-[70px] max-w-[100px]">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-purple-50/80 dark:bg-purple-900/20 backdrop-blur-md border border-purple-100/50 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-[1.25rem] md:rounded-[1.5rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-all active:scale-95">
              <Package size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-[9px] md:text-[11px] font-extrabold text-gray-600 dark:text-slate-300 text-center leading-tight uppercase tracking-wider transition-colors">Catálogo</span>
          </Link>

          <Link to="/clientes" className="flex flex-col items-center gap-2 group flex-1 min-w-[70px] max-w-[100px]">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-md border border-amber-100/50 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-[1.25rem] md:rounded-[1.5rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-all active:scale-95">
              <Users size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-[9px] md:text-[11px] font-extrabold text-gray-600 dark:text-slate-300 text-center leading-tight uppercase tracking-wider transition-colors">Clientes</span>
          </Link>

          <Link to="/compras" className="flex flex-col items-center gap-2 group flex-1 min-w-[70px] max-w-[100px]">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-50/80 dark:bg-emerald-900/20 backdrop-blur-md border border-emerald-100/50 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-[1.25rem] md:rounded-[1.5rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-all active:scale-95">
              <ShoppingCart size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-[9px] md:text-[11px] font-extrabold text-gray-600 dark:text-slate-300 text-center leading-tight uppercase tracking-wider transition-colors">Compras</span>
          </Link>

          <button onClick={handlePrint} className="flex flex-col items-center gap-2 group flex-1 min-w-[70px] max-w-[100px] outline-none">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-100/80 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-300 rounded-[1.25rem] md:rounded-[1.5rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-all active:scale-95">
              <Printer size={24} className="md:w-8 md:h-8" />
            </div>
            <span className="text-[9px] md:text-[11px] font-extrabold text-gray-600 dark:text-slate-300 text-center leading-tight uppercase tracking-wider transition-colors">Imprimir</span>
          </button>

        </div>
      </div>

      {/* 3. RESUMEN FINANCIERO (TARJETAS LIQUID GLASS) */}
      <h2 className="text-[11px] md:text-xs font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest mb-3 md:mb-4 px-1 print:hidden flex items-center gap-2 transition-colors">
        <TrendingUp size={14}/> Resumen Financiero
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-5 mb-8 md:mb-10">
        
        {/* Tarjeta 1: Ventas Hoy */}
        <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-white/80 dark:border-white/5 flex flex-col relative overflow-hidden group transition-colors duration-300">
          <div className="absolute -right-4 -top-4 text-emerald-50 dark:text-emerald-900/30 opacity-40 transition-opacity group-hover:opacity-70 pointer-events-none"><TrendingUp size={80}/></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-500/20 rounded-[1rem] flex items-center justify-center shrink-0 z-10 mb-3 md:mb-4 backdrop-blur-md">
            <TrendingUp size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="z-10 w-full truncate">
            <p className="text-[9px] md:text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest mb-0.5">Ventas Hoy</p>
            <h3 className="text-base md:text-xl font-black text-gray-800 dark:text-white truncate w-full" title={`S/ ${(stats.ventasHoy || 0).toFixed(2)}`}>
              S/ {(stats.ventasHoy || 0).toFixed(2)}
            </h3>
          </div>
        </div>

        {/* Tarjeta 2: Ventas Mes */}
        <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-white/80 dark:border-white/5 flex flex-col relative overflow-hidden group transition-colors duration-300">
          <div className="absolute -right-4 -top-4 text-blue-50 dark:text-blue-900/20 opacity-40 transition-opacity group-hover:opacity-70 pointer-events-none"><CalendarDays size={80}/></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-500/20 rounded-[1rem] flex items-center justify-center shrink-0 z-10 mb-3 md:mb-4 backdrop-blur-md">
            <CalendarDays size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="z-10 w-full truncate">
            <p className="text-[9px] md:text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest mb-0.5">Ventas (Mes)</p>
            <h3 className="text-base md:text-xl font-black text-gray-800 dark:text-white truncate w-full" title={`S/ ${(stats.ventasDelMes || 0).toFixed(2)}`}>
              S/ {(stats.ventasDelMes || 0).toFixed(2)}
            </h3>
          </div>
        </div>

        {/* Tarjeta 3: Compras Mes */}
        <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-white/80 dark:border-white/5 flex flex-col relative overflow-hidden group transition-colors duration-300">
          <div className="absolute -right-4 -top-4 text-indigo-50 dark:text-indigo-900/20 opacity-40 transition-opacity group-hover:opacity-70 pointer-events-none"><ShoppingCart size={80}/></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50/80 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-500/20 rounded-[1rem] flex items-center justify-center shrink-0 z-10 mb-3 md:mb-4 backdrop-blur-md">
            <ShoppingCart size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="z-10 w-full truncate">
            <p className="text-[9px] md:text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest mb-0.5">Compras (Mes)</p>
            <h3 className="text-base md:text-xl font-black text-gray-800 dark:text-white truncate w-full" title={`S/ ${(stats.comprasDelMes || 0).toFixed(2)}`}>
              S/ {(stats.comprasDelMes || 0).toFixed(2)}
            </h3>
          </div>
        </div>

        {/* Tarjeta 4: Catálogo */}
        <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-white/80 dark:border-white/5 flex flex-col relative overflow-hidden group transition-colors duration-300">
          <div className="absolute -right-4 -top-4 text-purple-50 dark:text-purple-900/20 opacity-40 transition-opacity group-hover:opacity-70 pointer-events-none"><Package size={80}/></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-50/80 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-100/50 dark:border-purple-500/20 rounded-[1rem] flex items-center justify-center shrink-0 z-10 mb-3 md:mb-4 backdrop-blur-md">
            <Package size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="z-10 w-full truncate">
            <p className="text-[9px] md:text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest mb-0.5">Catálogo</p>
            <h3 className="text-base md:text-xl font-black text-gray-800 dark:text-white truncate w-full">
              {stats.totalProductos || 0} <span className="text-[9px] md:text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">ítems</span>
            </h3>
          </div>
        </div>

        {/* Tarjeta 5: Clientes */}
        <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-white/80 dark:border-white/5 flex flex-col relative overflow-hidden group transition-colors duration-300">
          <div className="absolute -right-4 -top-4 text-amber-50 dark:text-amber-900/20 opacity-40 transition-opacity group-hover:opacity-70 pointer-events-none"><Users size={80}/></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-50/80 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-500/20 rounded-[1rem] flex items-center justify-center shrink-0 z-10 mb-3 md:mb-4 backdrop-blur-md">
            <Users size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="z-10 w-full truncate">
            <p className="text-[9px] md:text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest mb-0.5">Clientes</p>
            <h3 className="text-base md:text-xl font-black text-gray-800 dark:text-white truncate w-full">
              {stats.clientesTotales || 0} <span className="text-[9px] md:text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">personas</span>
            </h3>
          </div>
        </div>

        {/* Tarjeta 6: Alertas (Stock Crítico) */}
        <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-white/80 dark:border-white/5 flex flex-col relative overflow-hidden group transition-colors duration-300">
          <div className="absolute -right-4 -top-4 text-orange-50 dark:text-orange-900/20 opacity-40 transition-opacity group-hover:opacity-70 pointer-events-none"><AlertTriangle size={80}/></div>
          {stats.productosStockBajo > 0 && <div className="absolute top-0 right-0 w-2 h-full bg-orange-500 rounded-r-[1.5rem] md:rounded-r-[2rem] animate-pulse"></div>}
          
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-[1rem] border flex items-center justify-center shrink-0 z-10 mb-3 md:mb-4 transition-colors backdrop-blur-md ${stats.productosStockBajo > 0 ? 'bg-orange-50/80 dark:bg-orange-900/20 border-orange-100/50 dark:border-orange-500/20 text-orange-600 dark:text-orange-400' : 'bg-gray-50/80 dark:bg-slate-800/50 border-gray-100/50 dark:border-white/5 text-gray-400 dark:text-slate-400 group-hover:bg-orange-50/80 dark:group-hover:bg-orange-900/20 group-hover:border-orange-100/50 dark:group-hover:border-orange-500/20 group-hover:text-orange-600 dark:group-hover:text-orange-400'}`}>
            <AlertTriangle size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="z-10 w-full truncate">
            <p className={`text-[9px] md:text-[10px] font-extrabold uppercase tracking-widest mb-0.5 transition-colors ${stats.productosStockBajo > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-blue-300/70'}`}>Stock Crítico</p>
            <h3 className="text-base md:text-xl font-black text-gray-800 dark:text-white truncate w-full transition-colors">
              {stats.productosStockBajo || 0} <span className="text-[9px] md:text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">alertas</span>
            </h3>
          </div>
        </div>

      </div>

      {/* 4. LISTAS Y RANKINGS (LIQUID GLASS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 mb-8 h-auto">
        
        {/* ÚLTIMAS VENTAS */}
        <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/80 dark:border-white/5 overflow-hidden lg:col-span-1 xl:col-span-2 flex flex-col transition-colors duration-300">
          <div className="p-4 md:p-5 border-b border-gray-100/50 dark:border-white/5 flex justify-between items-center bg-transparent shrink-0">
            <h2 className="text-sm md:text-base font-extrabold text-gray-800 dark:text-white flex items-center gap-2 transition-colors">
              <ReceiptText size={18} className="text-blue-600 dark:text-blue-400"/> Actividad Reciente
            </h2>
            <Link to="/ventas" className="text-blue-600 dark:text-blue-400 text-[10px] md:text-xs font-black uppercase tracking-widest hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 transition-colors print:hidden bg-blue-50/80 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 backdrop-blur-md px-3 py-1.5 rounded-lg active:scale-95 border border-transparent dark:border-blue-500/20">
              Ver Historial <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="flex flex-col p-2 md:p-3 divide-y divide-gray-100/50 dark:divide-white/5">
            {stats.ultimasVentas && stats.ultimasVentas.length > 0 ? (
              stats.ultimasVentas.map((venta) => (
                <div key={venta.id} className="flex items-center justify-between p-3 md:p-4 hover:bg-white/40 dark:hover:bg-blue-900/10 rounded-2xl transition-colors duration-200 group">
                  <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center shrink-0 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white backdrop-blur-md transition-colors">
                      <ReceiptText size={18} className="md:w-5 md:h-5" />
                    </div>
                    <div className="flex flex-col truncate">
                      <p className="font-extrabold text-gray-800 dark:text-slate-100 text-[11px] md:text-sm truncate leading-tight transition-colors">{venta.cliente || 'Público General'}</p>
                      <p className="text-[9px] md:text-[10px] font-bold text-gray-400 dark:text-blue-300/70 mt-1 flex items-center gap-1.5 uppercase tracking-wider transition-colors">
                        <span className="text-slate-600 dark:text-blue-400">#{String(venta.id).padStart(5, '0')}</span> 
                        • {new Date(venta.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm md:text-base transition-colors">S/ {(parseFloat(venta.total) || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-white/50 dark:bg-slate-800/30 rounded-full flex items-center justify-center mb-3 border border-white/20 dark:border-white/5 backdrop-blur-md">
                  <Package size={24} className="text-slate-300 dark:text-slate-500"/>
                </div>
                <p className="text-[11px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">No hay transacciones aún</p>
              </div>
            )}
          </div>
        </div>

        {/* TOP 5 PRODUCTOS MÁS VENDIDOS */}
        <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/80 dark:border-white/5 overflow-hidden flex flex-col h-full lg:col-span-1 xl:col-span-1 transition-colors duration-300">
          <div className="p-4 md:p-5 border-b border-gray-100/50 dark:border-white/5 flex justify-between items-center bg-transparent shrink-0">
            <h2 className="text-sm md:text-base font-extrabold text-gray-800 dark:text-white flex items-center gap-2 transition-colors">
              <Star size={18} className="text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400"/> Top 5 Demandados
            </h2>
          </div>
          
          <div className="flex flex-col p-2 md:p-3 divide-y divide-gray-100/50 dark:divide-white/5 h-full">
            {stats.topProductos && stats.topProductos.length > 0 ? (
              stats.topProductos.map((prod, index) => {
                const isGold = index === 0;
                const isSilver = index === 1;
                const isBronze = index === 2;
                
                return (
                  <div key={index} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-white/40 dark:hover:bg-blue-900/10 rounded-2xl transition-colors duration-200 group">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-[1rem] flex items-center justify-center font-black text-[10px] md:text-xs shrink-0 transition-transform group-hover:scale-110
                      ${isGold ? 'bg-gradient-to-tr from-yellow-300 to-amber-500 dark:from-yellow-500 dark:to-amber-600 text-white shadow-md shadow-amber-500/30 border border-amber-200 dark:border-amber-500/30' : 
                        isSilver ? 'bg-gradient-to-tr from-slate-300 to-slate-400 dark:from-slate-400 dark:to-slate-500 text-white shadow-md shadow-slate-400/30 border border-slate-200 dark:border-slate-400/30' : 
                        isBronze ? 'bg-gradient-to-tr from-orange-300 to-orange-500 dark:from-orange-500 dark:to-orange-600 text-white shadow-md shadow-orange-500/30 border border-orange-200 dark:border-orange-500/30' : 
                        'bg-white/50 dark:bg-slate-800/50 backdrop-blur-md text-slate-400 dark:text-slate-500 border border-white/20 dark:border-white/5'}`}>
                      #{index + 1}
                    </div>
                    
                    <div className="flex flex-col truncate w-full min-w-0">
                      <p className="font-extrabold text-gray-700 dark:text-slate-100 text-[11px] md:text-sm truncate w-full leading-tight mb-1 transition-colors" title={prod.nombre}>{prod.nombre}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] md:text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-md px-1.5 py-0.5 rounded border border-blue-100/50 dark:border-blue-500/20 transition-colors">
                          {prod.cantidad_vendida} Unid.
                        </span>
                        <span className="text-[8px] md:text-[9px] font-bold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest transition-colors">Despachadas</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-white/50 dark:bg-slate-800/30 rounded-full flex items-center justify-center mb-3 border border-white/20 dark:border-white/5 backdrop-blur-md">
                  <Star size={24} className="text-slate-300 dark:text-slate-500"/>
                </div>
                <p className="text-[11px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Sin datos de demanda</p>
              </div>
            )}
          </div>
        </div>

      </div>
      
    </Layout>
  );
};

export default Dashboard;