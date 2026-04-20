import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <section id="precios" className="py-20 md:py-32 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-gray-900 dark:text-white">Precios claros. Sin sorpresas.</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Paga solo por lo que usas. Cancela cuando quieras.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] border border-gray-200/50 dark:border-white/10 shadow-sm flex flex-col text-gray-900 dark:text-white">
            <h3 className="text-2xl font-black mb-2">Emprendedor</h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-6">Perfecto para un solo local.</p>
            <div className="mb-8">
              <span className="text-5xl font-black tracking-tight">S/ 49</span>
              <span className="text-gray-500 dark:text-gray-400 font-bold"> /mes</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-center gap-3 font-bold text-gray-700 dark:text-gray-300"><CheckCircle size={18} className="text-emerald-500"/> 1 Sucursal incluida</li>
              <li className="flex items-center gap-3 font-bold text-gray-700 dark:text-gray-300"><CheckCircle size={18} className="text-emerald-500"/> Usuarios ilimitados</li>
              <li className="flex items-center gap-3 font-bold text-gray-700 dark:text-gray-300"><CheckCircle size={18} className="text-emerald-500"/> Soporte por WhatsApp</li>
            </ul>
            <button onClick={() => navigate('/registro')} className="w-full bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white py-4 rounded-2xl font-black hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
              Comenzar Prueba
            </button>
          </div>

          <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative transform md:-translate-y-4 flex flex-col border border-gray-800 dark:border-white">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">El más popular</div>
            <h3 className="text-2xl font-black mb-2">Empresa Pro</h3>
            <p className="text-gray-400 dark:text-gray-500 font-medium mb-6">Para negocios en expansión.</p>
            <div className="mb-8">
              <span className="text-5xl font-black tracking-tight">S/ 119</span>
              <span className="text-gray-400 dark:text-gray-500 font-bold"> /mes</span>
            </div>
            <ul className="space-y-4 mb-10 flex-1">
              <li className="flex items-center gap-3 font-bold"><CheckCircle size={18} className="text-blue-400 dark:text-blue-600"/> Hasta 5 Sucursales</li>
              <li className="flex items-center gap-3 font-bold"><CheckCircle size={18} className="text-blue-400 dark:text-blue-600"/> Usuarios ilimitados</li>
              <li className="flex items-center gap-3 font-bold"><CheckCircle size={18} className="text-blue-400 dark:text-blue-600"/> Auditoría Avanzada</li>
              <li className="flex items-center gap-3 font-bold"><CheckCircle size={18} className="text-blue-400 dark:text-blue-600"/> Soporte Prioritario 24/7</li>
            </ul>
            <button onClick={() => navigate('/registro')} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95">
              Comenzar Prueba
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;