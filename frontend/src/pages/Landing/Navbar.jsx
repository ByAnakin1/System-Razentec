import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/70 dark:bg-black/70 backdrop-blur-2xl border-b border-gray-200/50 dark:border-white/10 shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white">RazenPOS</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 font-bold text-sm text-gray-500 dark:text-gray-400">
          <a href="#caracteristicas" className="hover:text-gray-900 dark:hover:text-white transition-colors">Características</a>
          <a href="#precios" className="hover:text-gray-900 dark:hover:text-white transition-colors">Precios</a>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={() => navigate('/login')} className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors hidden sm:block">
            Iniciar Sesión
          </button>
          <button onClick={() => navigate('/registro')} className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-black hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-600/20">
            Prueba Gratis
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;