import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, Activity } from 'lucide-react';
import api from '../services/api';
import { CATEGORIA_A_RUTA } from '../config/menuConfig';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [usuario, setUsuario] = useState(JSON.parse(localStorage.getItem('usuario') || '{"nombre": "Usuario"}'));
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const res = await api.get('/auth/me');
        const u = res.data;
        setUsuario(u);

        // Menú 100% dinámico: procesa el array de categorías (sin Dashboard fijo)
        // Si vendedor solo tiene Ventas → menú muestra solo "Ventas" + "Cerrar Sesión"
        const categorias = u.categorias || [];
        const items = [];

        // Dashboard solo para Administrador; resto ve solo sus categorías
        if (u.rol === 'Administrador') {
          items.push({ path: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard });
        }

        // Módulos según categorías (excluir Modificador y Modificador_X - no son dashboards)
        const categoriasDashboard = categorias.filter(c => c !== 'Modificador' && !c.startsWith('Modificador_'));
        categoriasDashboard.forEach(cat => {
          const config = CATEGORIA_A_RUTA[cat];
          if (config) {
            items.push(config);
          }
        });

        // Auditoría solo para Administrador
        if (u.rol === 'Administrador') {
          items.push({ path: '/logs', label: 'Auditoría', Icon: Activity });
        }

        setMenuItems(items);
      } catch {
        const u = JSON.parse(localStorage.getItem('usuario') || '{}');
        setUsuario(u);
        const cat = u.categorias || [];
        const fallback = [];
        if (u.rol === 'Administrador') fallback.push({ path: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard });
        cat.filter(c => c !== 'Modificador' && !c?.startsWith?.('Modificador_')).forEach(c => {
          const cfg = CATEGORIA_A_RUTA[c];
          if (cfg) fallback.push(cfg);
        });
        setMenuItems(fallback.length ? fallback : [{ path: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard }]);
      }
    };
    loadMenu();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-white">
      {/* SIDEBAR - Azul oscuro */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b border-slate-700">
          <h1 className={`font-bold text-xl ${!sidebarOpen && 'hidden'}`}>Razentec SaaS</h1>
          {!sidebarOpen && <span className="font-bold text-xl">R</span>}
        </div>

        <nav className="flex-1 py-6 space-y-2 px-3">
          {menuItems.map((item) => (
            <BotonMenu
              key={item.path}
              to={item.path}
              icon={<item.Icon size={20} />}
              text={item.label}
              isOpen={sidebarOpen}
              currentPath={location.pathname}
            />
          ))}
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
              {usuario.nombre?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

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
