import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Users, LogOut, Menu, Tag } from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{"nombre": "Usuario"}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b border-slate-700">
          <h1 className={`font-bold text-xl ${!sidebarOpen && 'hidden'}`}>Razentec SaaS</h1>
          {!sidebarOpen && <span className="font-bold text-xl">R</span>}
        </div>

        <nav className="flex-1 py-6 space-y-2 px-3">
          <BotonMenu to="/dashboard" icon={<LayoutDashboard size={20} />} text="Dashboard" isOpen={sidebarOpen} currentPath={location.pathname} />
          <BotonMenu to="/productos" icon={<Package size={20} />} text="Inventario" isOpen={sidebarOpen} currentPath={location.pathname} />
          <BotonMenu to="/ventas" icon={<ShoppingCart size={20} />} text="Ventas" isOpen={sidebarOpen} currentPath={location.pathname} />
          <BotonMenu to="/clientes" icon={<Users size={20} />} text="Clientes" isOpen={sidebarOpen} currentPath={location.pathname} />
          <BotonMenu to="/categorias" icon={<Tag size={20} />} text="Categorías" isOpen={sidebarOpen} currentPath={location.pathname} />
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full p-2 text-red-400 hover:bg-slate-800 rounded transition-colors">
            <LogOut size={20} />
            <span className={`${!sidebarOpen && 'hidden'}`}>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white shadow flex items-center justify-between px-6">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded">
            <Menu size={24} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-800">{usuario.nombre}</span>
            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              {usuario.nombre.charAt(0)}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children} {/* <--- Aquí se inyectará cada página diferente */}
        </main>
      </div>
    </div>
  );
};

// Componente pequeño para los botones del menú
const BotonMenu = ({ to, icon, text, isOpen, currentPath }) => {
  const active = currentPath === to;
  return (
    <Link to={to} className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>
      {icon}
      <span className={`${!isOpen && 'hidden'}`}>{text}</span>
    </Link>
  );
};

export default Layout;