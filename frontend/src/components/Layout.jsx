import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, Activity, User, Contact } from 'lucide-react';
import api from '../services/api';
import { CATEGORIA_A_RUTA } from '../config/menuConfig';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [usuario, setUsuario] = useState(JSON.parse(localStorage.getItem('usuario') || '{"nombre": "Usuario"}'));
  const [menuItems, setMenuItems] = useState([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const res = await api.get('/auth/me');
        const u = res.data;
        setUsuario(u);

        if (u.rol === 'Administrador') {
          const adminItems = [...Object.values(CATEGORIA_A_RUTA)];
          adminItems.push({ path: '/directorio', label: 'Directorio Staff', Icon: Contact });
          adminItems.push({ path: '/logs', label: 'Auditoría', Icon: Activity });
          setMenuItems(adminItems);
        } else {
          // 🐛 PROTECCIÓN ANTI-CRASH: Convertimos los permisos de forma segura sin importar cómo vengan de la DB
          let catsSeguras = [];
          try {
            if (Array.isArray(u.categorias)) {
              catsSeguras = u.categorias;
            } else if (typeof u.categorias === 'string') {
              let parsed = JSON.parse(u.categorias);
              if (typeof parsed === 'string') parsed = JSON.parse(parsed); // Doble parseo preventivo
              catsSeguras = Array.isArray(parsed) ? parsed : [];
            }
          } catch (error) {
            catsSeguras = [];
          }

          const categoriasDashboard = catsSeguras.filter(c => c !== 'Modificador' && !c.startsWith('Modificador_'));
          const items = [];
          categoriasDashboard.forEach(cat => {
            if (CATEGORIA_A_RUTA[cat]) items.push(CATEGORIA_A_RUTA[cat]);
          });
          
          setMenuItems(items.length > 0 ? items : [{ path: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard }]);
        }
      } catch {
        setMenuItems([{ path: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard }]);
      }
    };
    loadMenu();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-white">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col z-20`}>
        <div className="h-16 flex items-center justify-center border-b border-slate-700">
          <h1 className={`font-bold text-xl ${!sidebarOpen && 'hidden'}`}>Razentec SaaS</h1>
          {!sidebarOpen && <span className="font-bold text-xl">R</span>}
        </div>

        <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto">
          {menuItems.map((item) => (
            <BotonMenu key={item.path} to={item.path} icon={<item.Icon size={20} />} text={item.label} isOpen={sidebarOpen} currentPath={location.pathname} />
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded text-gray-600 transition-colors">
            <Menu size={24} />
          </button>
          
          <div className="relative flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-800 leading-tight">{usuario.nombre || 'Usuario'}</p>
              <p className="text-xs text-gray-500">{usuario.rol || 'Empleado'}</p>
            </div>
            
            <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="focus:outline-none transition-transform hover:scale-105">
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-transparent hover:ring-blue-200 overflow-hidden">
                {usuario.avatar ? <img src={usuario.avatar} alt="Avatar" className="w-full h-full object-cover" /> : usuario.nombre?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </button>

            {profileMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)}></div>
                <div className="absolute right-0 top-14 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-40 overflow-hidden animate-fade-in-down">
                  <div className="p-4 border-b border-gray-50 md:hidden">
                     <p className="text-sm font-bold text-gray-800">{usuario.nombre}</p>
                     <p className="text-xs text-gray-500">{usuario.rol}</p>
                  </div>
                  <Link to="/perfil" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"><User size={16} /> Mi Perfil</Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"><LogOut size={16} /> Cerrar Sesión</button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
};

const BotonMenu = ({ to, icon, text, isOpen, currentPath }) => {
  const active = currentPath === to;
  return (
    <Link to={to} className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all ${active ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-slate-800 hover:text-white'}`}>
      {icon}
      <span className={`${!isOpen && 'hidden'} whitespace-nowrap`}>{text}</span>
    </Link>
  );
};

export default Layout;