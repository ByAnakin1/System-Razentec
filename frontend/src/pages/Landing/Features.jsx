import React from 'react';
import { Zap, Store, ShieldCheck } from 'lucide-react';

const Features = () => {
  return (
    <section id="caracteristicas" className="py-20 md:py-32 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 md:mb-24">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-gray-900 dark:text-white">Todo lo que necesitas, <br/> en un solo lugar.</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Olvídate de Excel y de los sistemas lentos de los años 90.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-8 md:p-10 rounded-[2rem] border border-gray-200/50 dark:border-white/10 hover:-translate-y-2 transition-transform duration-300 shadow-sm text-gray-900 dark:text-white">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
              <Zap size={28} />
            </div>
            <h3 className="text-xl font-black mb-3">Punto de Venta Rápido</h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              Vende en segundos. Buscador inteligente, lector de código de barras y cálculo de vuelto automático. Diseñado para no hacer esperar a tus clientes.
            </p>
          </div>

          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-8 md:p-10 rounded-[2rem] border border-gray-200/50 dark:border-white/10 hover:-translate-y-2 transition-transform duration-300 shadow-sm text-gray-900 dark:text-white">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
              <Store size={28} />
            </div>
            <h3 className="text-xl font-black mb-3">Multi-Sucursal</h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              ¿Tienes más de un local? Controla el inventario, los traslados y las ventas de todas tus tiendas desde un solo panel de control centralizado.
            </p>
          </div>

          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-8 md:p-10 rounded-[2rem] border border-gray-200/50 dark:border-white/10 hover:-translate-y-2 transition-transform duration-300 shadow-sm text-gray-900 dark:text-white">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-xl font-black mb-3">Auditoría Ciega</h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
              Seguridad total. Cada acción de tus empleados queda registrada en la Bóveda de Auditoría, accesible solo para ti mediante clave maestra.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;