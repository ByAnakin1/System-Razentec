import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Play, BarChart3 } from 'lucide-react';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 dark:bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6 drop-shadow-sm text-gray-900 dark:text-white">
          Vende, controla y crece <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            sin complicaciones.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
          El sistema de Punto de Venta e Inventario diseñado con la simplicidad en mente. Sincroniza tus sucursales en tiempo real y toma el control de tu negocio desde cualquier dispositivo.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={() => navigate('/registro')} className="w-full sm:w-auto bg-gray-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-full text-base font-black hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2">
            Comienza tus 14 días gratis <ChevronRight size={18}/>
          </button>
          <button className="w-full sm:w-auto bg-white/80 dark:bg-white/10 text-gray-800 dark:text-white border border-gray-200/50 dark:border-white/10 backdrop-blur-xl px-8 py-4 rounded-full text-base font-black hover:bg-gray-50 dark:hover:bg-white/20 transition-all flex items-center justify-center gap-2 shadow-sm">
            <Play size={18} fill="currentColor"/> Ver Demo
          </button>
        </div>
        <p className="mt-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">No requiere tarjeta de crédito</p>
      </div>

      <div className="max-w-5xl mx-auto mt-16 md:mt-24 relative z-10 animate-fade-in-up">
        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2rem] md:rounded-[3rem] p-2 md:p-4 border border-white/60 dark:border-white/10 shadow-2xl">
           <div className="bg-gray-100 dark:bg-[#0A0A0A] rounded-[1.5rem] md:rounded-[2.5rem] aspect-video md:aspect-[16/9] w-full overflow-hidden border border-gray-200/50 dark:border-white/5 flex items-center justify-center shadow-inner relative">
              <div className="text-center text-gray-400 dark:text-gray-600">
                <BarChart3 size={64} className="mx-auto mb-4 opacity-50"/>
                <p className="font-bold tracking-widest uppercase">Mockup de tu Dashboard</p>
              </div>
           </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;