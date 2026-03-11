import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { 
  TrendingUp, ShoppingCart, Package, AlertTriangle, ArrowRight, Activity, 
  Users, RefreshCw, Printer, Star, CalendarDays
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    ventasDelMes: 0, ventasHoy: 0, comprasDelMes: 0,
    totalProductos: 0, productosStockBajo: 0, clientesTotales: 0,
    ultimasVentas: [], topProductos: []
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/dashboard');
      setStats(res.data);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ✨ FUNCIÓN DEL BOTÓN ACTUALIZAR
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setIsRefreshing(false), 500); // Pequeña pausa para el efecto visual
  };

  // ✨ FUNCIÓN DEL BOTÓN IMPRIMIR
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
          <Activity className="animate-spin text-blue-600" size={48} />
          <p className="text-gray-500 font-medium text-lg">Cargando el resumen de tu negocio...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* 🚀 CABECERA Y BOTONES DE ACCIÓN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Panel de Control</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <CalendarDays size={16}/> Resumen general y estadísticas en vivo.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 font-bold text-gray-700 transition-colors shadow-sm"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-blue-600' : ''} /> 
            {isRefreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 px-4 py-2.5 rounded-xl hover:bg-blue-700 font-bold text-white transition-colors shadow-md shadow-blue-600/20"
          >
            <Printer size={18} /> Imprimir Reporte
          </button>
        </div>
      </div>

      {/* 📊 SECCIÓN 1: TARJETAS DE INDICADORES (KPIs) - AHORA SON 6 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-emerald-50 opacity-50"><TrendingUp size={100}/></div>
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 z-10"><TrendingUp size={28} /></div>
          <div className="z-10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ventas de HOY</p>
            <h3 className="text-2xl font-black text-gray-800">S/ {stats.ventasHoy.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><CalendarDays size={28} /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ventas del Mes</p>
            <h3 className="text-2xl font-black text-gray-800">S/ {stats.ventasDelMes.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0"><ShoppingCart size={28} /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Compras del Mes</p>
            <h3 className="text-2xl font-black text-gray-800">S/ {stats.comprasDelMes.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0"><Package size={28} /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Catálogo</p>
            <h3 className="text-2xl font-black text-gray-800">{stats.totalProductos} <span className="text-sm font-medium text-gray-500">ítems</span></h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0"><Users size={28} /></div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Clientes Registrados</p>
            <h3 className="text-2xl font-black text-gray-800">{stats.clientesTotales} <span className="text-sm font-medium text-gray-500">personas</span></h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 relative">
          {stats.productosStockBajo > 0 && <div className="absolute top-0 right-0 w-2 h-full bg-orange-500 rounded-r-2xl animate-pulse"></div>}
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${stats.productosStockBajo > 0 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Stock Crítico</p>
            <h3 className="text-2xl font-black text-gray-800">{stats.productosStockBajo} <span className="text-sm font-medium text-gray-500">ítems</span></h3>
          </div>
        </div>

      </div>

      {/* 📋 SECCIÓN 2: TABLAS Y RANKINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LADO IZQUIERDO: Tabla de Ventas (Ocupa 2/3) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Activity size={20} className="text-blue-600"/> Últimas Transacciones</h2>
            <Link to="/ventas" className="text-blue-600 text-sm font-bold hover:text-blue-800 flex items-center gap-1 transition-colors print:hidden">
              Ver Historial <ArrowRight size={16} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white text-gray-400 uppercase text-xs font-bold border-b">
                <tr>
                  <th className="px-6 py-4">Boleta</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.ultimasVentas.length > 0 ? (
                  stats.ultimasVentas.map((venta) => (
                    <tr key={venta.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">#{venta.id}</td>
                      <td className="px-6 py-4">{new Date(venta.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-6 py-4 font-medium text-gray-700">{venta.cliente || 'Cliente General'}</td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600">S/ {parseFloat(venta.total).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="px-6 py-12 text-center text-gray-400">No hay ventas recientes.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LADO DERECHO: Ranking de Productos y Acceso Rápido (Ocupa 1/3) */}
        <div className="flex flex-col gap-8">
          
          {/* TOP 5 Productos */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-amber-50/30">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Star size={20} className="text-amber-500 fill-amber-500"/> Top 5 Más Vendidos</h2>
            </div>
            <div className="p-5">
              {stats.topProductos.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {stats.topProductos.map((prod, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-gray-100 text-gray-600' : index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-blue-50 text-blue-600'}`}>
                          {index + 1}
                        </div>
                        <p className="font-bold text-gray-700 truncate text-sm" title={prod.nombre}>{prod.nombre}</p>
                      </div>
                      <div className="text-right pl-2 shrink-0">
                        <p className="text-xs font-bold text-gray-400">{prod.cantidad_vendida} un.</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-400 py-4">Aún no hay datos de ventas.</p>
              )}
            </div>
          </div>

          {/* Panel de Acceso Rápido */}
          <div className="bg-slate-900 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden print:hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
            <h3 className="text-xl font-bold mb-2">Acciones Rápidas</h3>
            <p className="text-slate-400 text-sm mb-6">Atajos para las operaciones más comunes de tu negocio.</p>
            <div className="flex flex-col gap-3">
              <Link to="/pos" className="bg-blue-600 text-white font-bold py-3 px-4 rounded-xl text-center hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30">
                Punto de Venta (POS)
              </Link>
              <Link to="/productos" className="bg-slate-800 text-slate-300 border border-slate-700 font-bold py-3 px-4 rounded-xl text-center hover:bg-slate-700 transition-colors">
                Gestión de Inventario
              </Link>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;