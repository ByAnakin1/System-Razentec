import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  ArrowRight,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom'; // Para el botón de "Ver todas"

const Dashboard = () => {
  const [stats, setStats] = useState({
    ventasDelMes: 0,
    comprasDelMes: 0,
    totalProductos: 0,
    productosStockBajo: 0,
    ultimasVentas: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/dashboard'); // Llamamos a tu nueva ruta mágica
        setStats(res.data);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Panel de Control</h1>
        <p className="text-gray-500 mt-1">Resumen general de tu negocio en este mes.</p>
      </div>

      {/* 🚀 TARJETAS DE INDICADORES (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Tarjeta Ventas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ventas del Mes</p>
            <h3 className="text-2xl font-black text-gray-800">S/ {stats.ventasDelMes.toFixed(2)}</h3>
          </div>
        </div>

        {/* Tarjeta Compras */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <ShoppingCart size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Compras del Mes</p>
            <h3 className="text-2xl font-black text-gray-800">S/ {stats.comprasDelMes.toFixed(2)}</h3>
          </div>
        </div>

        {/* Tarjeta Productos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <Package size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Catálogo</p>
            <h3 className="text-2xl font-black text-gray-800">{stats.totalProductos} <span className="text-sm font-medium text-gray-500">ítems</span></h3>
          </div>
        </div>

        {/* Tarjeta Alertas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow relative overflow-hidden">
          {stats.productosStockBajo > 0 && (
            <div className="absolute top-0 right-0 w-2 h-full bg-orange-500"></div>
          )}
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${stats.productosStockBajo > 0 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Stock Crítico</p>
            <h3 className="text-2xl font-black text-gray-800">
              {stats.productosStockBajo} <span className="text-sm font-medium text-gray-500">ítems</span>
            </h3>
          </div>
        </div>

      </div>

      {/* 📋 SECCIÓN INFERIOR: ÚLTIMAS VENTAS Y ACCOS RÁPIDOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Tabla de Ventas (Ocupa 2/3 del espacio) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800">Últimas Ventas (En vivo)</h2>
            {/* Si tienes una ruta /ventas configurada, este link funcionará perfecto */}
            <Link to="/ventas" className="text-blue-600 text-sm font-bold hover:text-blue-800 flex items-center gap-1 transition-colors">
              Ver todas <ArrowRight size={16} />
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
                      <td className="px-6 py-4">
                        {new Date(venta.created_at).toLocaleDateString('es-PE', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700">{venta.cliente || 'Cliente General'}</td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600">
                        S/ {parseFloat(venta.total).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                      <ShoppingCart className="mx-auto mb-3 opacity-30" size={40} />
                      Aún no hay ventas registradas este mes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel lateral derecho (Ocupa 1/3) */}
        <div className="bg-blue-600 rounded-2xl shadow-sm border border-blue-700 p-6 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Decoración de fondo abstracta */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div>
            <h3 className="text-xl font-bold mb-2">Bienvenido a Razentec</h3>
            <p className="text-blue-100 text-sm mb-6 leading-relaxed">
              Mantén el control total de tu inventario, ventas y proveedores desde un solo lugar.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Link to="/pos" className="bg-white text-blue-600 font-bold py-3 px-4 rounded-xl text-center hover:bg-blue-50 transition-colors shadow-lg">
              Ir al Punto de Venta (POS)
            </Link>
            <Link to="/productos" className="bg-blue-700 text-white border border-blue-500 font-bold py-3 px-4 rounded-xl text-center hover:bg-blue-800 transition-colors">
              Agregar Producto
            </Link>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;