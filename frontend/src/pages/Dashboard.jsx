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
          <Activity className="animate-spin text-blue-600" size={48} />
          <p className="text-gray-500 font-medium text-base md:text-lg">Cargando el resumen de la sucursal...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Panel de Control">
      
      {/* 1. SUBTÍTULO Y BOTÓN ACTUALIZAR EN LA ESQUINA */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <p className="text-xs md:text-sm text-gray-500 flex items-center gap-2">
          <CalendarDays size={16}/> Resumen general y estadísticas en vivo.
        </p>
        
        <button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 md:px-4 md:py-2.5 rounded-xl font-bold transition-colors shadow-sm text-xs md:text-sm">
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-blue-600' : ''} /> 
          <span className="hidden sm:inline">{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
        </button>
      </div>

      {/* 2. ACCIONES RÁPIDAS (ESTILO YAPE) */}
      <div className="mb-8 print:hidden">
        <h2 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">Acciones Rápidas</h2>
        <div className="flex flex-wrap md:flex-nowrap gap-4 md:gap-6">
          
          <Link to="/ventas" className="flex flex-col items-center gap-2 group w-16 md:w-20">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-105 group-hover:bg-blue-700 transition-all">
              <Store size={26} className="md:w-8 md:h-8" />
            </div>
            <span className="text-[11px] md:text-xs font-bold text-gray-700 text-center leading-tight">Vender<br/>(POS)</span>
          </Link>

          <Link to="/inventario" className="flex flex-col items-center gap-2 group w-16 md:w-20">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-purple-100 text-purple-600 rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-purple-200 transition-all">
              <Package size={26} className="md:w-8 md:h-8" />
            </div>
            <span className="text-[11px] md:text-xs font-bold text-gray-700 text-center leading-tight">Inventario</span>
          </Link>

          <Link to="/clientes" className="flex flex-col items-center gap-2 group w-16 md:w-20">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-100 text-amber-600 rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-amber-200 transition-all">
              <Users size={26} className="md:w-8 md:h-8" />
            </div>
            <span className="text-[11px] md:text-xs font-bold text-gray-700 text-center leading-tight">Clientes</span>
          </Link>

          <Link to="/compras" className="flex flex-col items-center gap-2 group w-16 md:w-20">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-100 text-emerald-600 rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-emerald-200 transition-all">
              <ShoppingCart size={26} className="md:w-8 md:h-8" />
            </div>
            <span className="text-[11px] md:text-xs font-bold text-gray-700 text-center leading-tight">Compras</span>
          </Link>

          <button onClick={handlePrint} className="flex flex-col items-center gap-2 group w-16 md:w-20 bg-transparent border-none outline-none cursor-pointer">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-200 text-slate-700 rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-slate-300 transition-all">
              <Printer size={26} className="md:w-8 md:h-8" />
            </div>
            <span className="text-[11px] md:text-xs font-bold text-gray-700 text-center leading-tight">Imprimir<br/>Reporte</span>
          </button>

        </div>
      </div>

      {/* 3. RESUMEN FINANCIERO (GRID 2 COLUMNAS EN MÓVIL) */}
      <h2 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-1 print:hidden">Resumen Financiero</h2>
      
      {/* Esto se ve perfecto en 2 columnas en móviles */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-5 mb-6 md:mb-8">
        
        <div className="bg-white p-3.5 md:p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-3 md:gap-4 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-emerald-50 opacity-40 transition-opacity group-hover:opacity-70"><TrendingUp size={80}/></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 text-emerald-600 rounded-[1rem] flex items-center justify-center shrink-0 z-10">
            <TrendingUp size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="z-10 w-full truncate">
            <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Ventas HOY</p>
            <h3 className="text-lg md:text-xl font-black text-gray-800 truncate w-full">S/ {(stats.ventasHoy || 0).toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-3.5 md:p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-3 md:gap-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-blue-50 opacity-40 transition-opacity group-hover:opacity-70"><CalendarDays size={80}/></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-[1rem] flex items-center justify-center shrink-0 z-10">
            <CalendarDays size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="z-10 w-full truncate">
            <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Ventas (Mes)</p>
            <h3 className="text-lg md:text-xl font-black text-gray-800 truncate w-full">S/ {(stats.ventasDelMes || 0).toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-3.5 md:p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-3 md:gap-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-indigo-50 opacity-40 transition-opacity group-hover:opacity-70"><ShoppingCart size={80}/></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 text-indigo-600 rounded-[1rem] flex items-center justify-center shrink-0 z-10">
            <ShoppingCart size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="z-10 w-full truncate">
            <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Compras (Mes)</p>
            <h3 className="text-lg md:text-xl font-black text-gray-800 truncate w-full">S/ {(stats.comprasDelMes || 0).toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-3.5 md:p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-3 md:gap-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-purple-50 opacity-40 transition-opacity group-hover:opacity-70"><Package size={80}/></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-50 text-purple-600 rounded-[1rem] flex items-center justify-center shrink-0 z-10">
            <Package size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="z-10 w-full truncate">
            <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Catálogo</p>
            <h3 className="text-lg md:text-xl font-black text-gray-800 w-full">{stats.totalProductos || 0} <span className="text-[10px] md:text-xs font-medium text-gray-500">ítems</span></h3>
          </div>
        </div>

        <div className="bg-white p-3.5 md:p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-3 md:gap-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-amber-50 opacity-40 transition-opacity group-hover:opacity-70"><Users size={80}/></div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-50 text-amber-600 rounded-[1rem] flex items-center justify-center shrink-0 z-10">
            <Users size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="z-10 w-full truncate">
            <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Clientes</p>
            <h3 className="text-lg md:text-xl font-black text-gray-800 w-full">{stats.clientesTotales || 0} <span className="text-[10px] md:text-xs font-medium text-gray-500">un.</span></h3>
          </div>
        </div>

        <div className="bg-white p-3.5 md:p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-3 md:gap-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 text-orange-50 opacity-40 transition-opacity group-hover:opacity-70"><AlertTriangle size={80}/></div>
          {stats.productosStockBajo > 0 && <div className="absolute top-0 right-0 w-1.5 h-full bg-orange-500 rounded-r-3xl animate-pulse"></div>}
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-[1rem] flex items-center justify-center shrink-0 z-10 transition-colors ${stats.productosStockBajo > 0 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-600'}`}>
            <AlertTriangle size={20} className="md:w-6 md:h-6" />
          </div>
          <div className="z-10 w-full truncate">
            <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Stock Bajo</p>
            <h3 className="text-lg md:text-xl font-black text-gray-800 w-full">{stats.productosStockBajo || 0} <span className="text-[10px] md:text-xs font-medium text-gray-500">ítems</span></h3>
          </div>
        </div>
      </div>

      {/* 4. ✨ NUEVO: TABLAS Y RANKINGS CON DISEÑO APP ✨ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 mb-8">
        
        {/* ÚLTIMAS TRANSACCIONES (Diseño de Lista Elegante) */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-1 xl:col-span-2 flex flex-col">
          <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
            <h2 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2">
              <Activity size={18} className="text-blue-600"/> Últimas Ventas
            </h2>
            <Link to="/ventas" className="text-blue-600 text-xs md:text-sm font-bold hover:text-blue-800 flex items-center gap-1 transition-colors print:hidden bg-blue-50 px-3 py-1.5 rounded-lg">
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="flex flex-col p-2 md:p-3 divide-y divide-gray-50">
            {stats.ultimasVentas && stats.ultimasVentas.length > 0 ? (
              stats.ultimasVentas.map((venta) => (
                <div key={venta.id} className="flex items-center justify-between p-3 md:p-4 hover:bg-gray-50 rounded-2xl transition-colors group">
                  <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 border border-slate-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                      <ReceiptText size={20} className="md:w-6 md:h-6 opacity-80" />
                    </div>
                    <div className="flex flex-col truncate">
                      <p className="font-bold text-gray-800 text-sm md:text-base truncate">{venta.cliente || 'Cliente General'}</p>
                      <p className="text-[10px] md:text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">#{venta.id}</span> 
                        {new Date(venta.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <p className="font-black text-emerald-600 text-sm md:text-base">S/ {(parseFloat(venta.total) || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-xs md:text-sm text-gray-400 py-12 flex items-center justify-center gap-2">
                <Package size={20} className="opacity-20"/> No hay ventas recientes.
              </p>
            )}
          </div>
        </div>

        {/* TOP 5 PRODUCTOS MÁS VENDIDOS (Diseño Oro, Plata, Bronce) */}
        <div className="flex flex-col lg:col-span-1 xl:col-span-1 h-full overflow-hidden">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex-1 h-full">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
              <h2 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2">
                <Star size={18} className="text-amber-500 fill-amber-500"/> Top 5 Vendidos
              </h2>
            </div>
            
            <div className="flex flex-col p-2 md:p-3 divide-y divide-gray-50 h-full">
              {stats.topProductos && stats.topProductos.length > 0 ? (
                stats.topProductos.map((prod, index) => {
                  // ✨ Lógica para darle diseño Premium al Top 3 y ARREGLAR alineación ✨
                  const isGold = index === 0;
                  const isSilver = index === 1;
                  const isBronze = index === 2;
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 md:p-4 hover:bg-gray-50 rounded-2xl transition-colors group">
                      <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        {/* Medalla circular Fija y con degradados */}
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-black text-xs md:text-sm shrink-0 transition-all
                          ${isGold ? 'bg-gradient-to-tr from-yellow-300 to-yellow-500 text-white shadow-md shadow-yellow-500/30' : 
                            isSilver ? 'bg-gradient-to-tr from-gray-300 to-slate-400 text-white shadow-md shadow-slate-400/30' : 
                            isBronze ? 'bg-gradient-to-tr from-orange-300 to-orange-500 text-white shadow-md shadow-orange-500/30' : 
                            'bg-slate-50 text-slate-400 border border-slate-100 group-hover:bg-white'}`}>
                          {index + 1}
                        </div>
                        
                        <div className="flex flex-col truncate w-full">
                          <p className="font-bold text-gray-700 text-xs md:text-sm truncate w-full" title={prod.nombre}>{prod.nombre}</p>
                          <p className="text-[10px] md:text-xs text-gray-400 mt-0.5">{prod.cantidad_vendida} unidades vendidas</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-xs md:text-sm text-gray-400 py-12 flex items-center justify-center gap-2 flex-1">
                  <Package size={20} className="opacity-20"/> Aún no hay datos de ventas.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
    </Layout>
  );
};

export default Dashboard;