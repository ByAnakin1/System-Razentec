import React from 'react';
import { Zap } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-gray-200/50 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-xl py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-blue-600" />
          <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white">RazenPOS</span>
        </div>
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Razentec. Diseñado en Lima, Perú.
        </p>
      </div>
    </footer>
  );
};

export default Footer;