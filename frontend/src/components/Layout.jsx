import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, Activity, User, Contact, MapPin, Building2 } from 'lucide-react';
import api from '../services/api';
import { CATEGORIA_A_RUTA } from '../config/menuConfig';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [usuario, setUsuario] = useState(JSON.parse(localStorage.getItem('usuario') || '{"nombre": "Usuario"}'));
  const [menuItems, setMenuItems] = useState([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [sucursales, setSucursales] = useState([]);
  const [sucursalesPermitidas, setSucursalesPermitidas] = useState([]);
  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const res = await api.get('/auth/me');
        const u = res.data;
        setUsuario(u);

        try {
          const sucRes = await api.get('/sucursales');
          const todasSucs = sucRes.data;
          setSucursales(todasSucs);

          let asignadas = [];
          if (u.sucursales_asignadas) {
            try {
              let parsed = u.sucursales_asignadas;
              if (typeof parsed === 'string') parsed = JSON.parse(parsed);
              if (typeof parsed === 'string') parsed = JSON.parse(parsed); 
              if (Array.isArray(parsed)) asignadas = parsed;
            } catch (e) {}
          }
          asignadas = asignadas.map(id => parseInt(id, 10));

          let permitidas = [];
          if (u.rol === 'Administrador') {
            permitidas = todasSucs;
          } else {
            permitidas = todasSucs.filter(s => asignadas.includes(parseInt(s.id, 10)));
          }
          setSucursalesPermitidas(permitidas);

          const sucursalPreviaStr = localStorage.getItem('sucursalActiva');
          let sucursalPrevia = null;
          if (sucursalPreviaStr) {
            try { sucursalPrevia = JSON.parse(sucursalPreviaStr); } catch(e){}
          }

          const esValida = sucursalPrevia?.id === 'ALL' 
            ? u.rol === 'Administrador' 
            : permitidas.some(s => parseInt(s.id, 10) === parseInt(sucursalPrevia?.id, 10));

          if (!esValida || !sucursalPrevia) {
            const defaultSuc = u.rol === 'Administrador' ? { id: 'ALL', nombre: 'Todas las Sucursales' } : (permitidas[0] || null);
            if (defaultSuc) {
              seleccionarSucursal(defaultSuc);
            } else {
              setSucursalActiva(null);
              localStorage.removeItem('sucursalActiva');
              window.dispatchEvent(new Event('sucursalCambiada')); 
            }
          } else {
            setSucursalActiva(sucursalPrevia);
            window.dispatchEvent(new Event('sucursalCambiada')); 
          }

        } catch(e) {}

        if (u.rol === 'Administrador') {
          const adminItems = [...Object.values(CATEGORIA_A_RUTA)];
          adminItems.push({ path: '/directorio', label: 'Directorio Staff', Icon: Contact });
          adminItems.push({ path: '/logs', label: 'Auditoría', Icon: Activity });
          setMenuItems(adminItems);
        } else {
          const categorias = Array.isArray(u.categorias) ? u.categorias : [];
          const categoriasDashboard = categorias.filter(c => c !== 'Modificador' && !c.startsWith('Modificador_'));
          const items = [{ path: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard }];
          categoriasDashboard.forEach(cat => {
            if (cat !== 'Dashboard' && CATEGORIA_A_RUTA[cat]) items.push(CATEGORIA_A_RUTA[cat]);
          });
          setMenuItems(items);
        }
      } catch (err) {
        console.error("Error al cargar menú:", err);
      }
    };
    loadMenu();
  }, [location.pathname]);

  const seleccionarSucursal = (suc) => {
    if(!suc) return;
    setSucursalActiva(suc);
    localStorage.setItem('sucursalActiva', JSON.stringify(suc));
    setTimeout(() => window.dispatchEvent(new Event('sucursalCambiada')), 50); 
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (error) {}
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('sucursalActiva'); 
    navigate('/login');
  };

  // ✨ VERIFICAMOS SI ESTAMOS EN LA RUTA SUCURSALES
  const isSucursalesRoute = location.pathname === '/sucursales';

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col z-20 shadow-xl`}>
        <div className="h-16 flex items-center justify-center border-b border-slate-800">
          <h1 className={`font-bold text-xl tracking-wide ${!sidebarOpen && 'hidden'}`}>Razentec <span className="text-blue-500">SaaS</span></h1>
          {!sidebarOpen && <span className="font-bold text-xl text-blue-500">R</span>}
        </div>
        <nav className="flex-1 py-6 space-y-1.5 px-3 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <BotonMenu key={item.path} to={item.path} icon={<item.Icon size={20} />} text={item.label} isOpen={sidebarOpen} currentPath={location.pathname} />
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10 border-b border-gray-100">
          <div className="flex-1 flex items-center justify-start">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><Menu size={22} /></button>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            {/* ✨ OCULTAMOS EL SELECTOR SI ESTAMOS EN /sucursales */}
            {!isSucursalesRoute && (
              <div className={`hidden md:flex items-center bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full px-4 py-1.5 transition-all shadow-sm ${sucursalesPermitidas.length <= 1 && usuario.rol !== 'Administrador' ? 'opacity-80 cursor-default' : ''}`}>
                {sucursalActiva?.id === 'ALL' ? <Building2 size={16} className="text-gray-500 mr-2"/> : <MapPin size={16} className="text-blue-600 mr-2"/>}
                <select 
                  className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 py-1 w-auto max-w-[200px] cursor-pointer appearance-none text-center disabled:cursor-default"
                  value={sucursalActiva?.id || ''}
                  disabled={sucursalesPermitidas.length <= 1 && usuario.rol !== 'Administrador'}
                  onChange={(e) => {
                    if (e.target.value === 'ALL') seleccionarSucursal({ id: 'ALL', nombre: 'Todas las Sucursales' });
                    else seleccionarSucursal(sucursales.find(s => s.id === parseInt(e.target.value)));
                  }}
                >
                  <option value="" disabled>{sucursalesPermitidas.length === 0 && usuario.rol !== 'Administrador' ? 'Sin locales asignados' : 'Cargando local...'}</option>
                  {usuario.rol === 'Administrador' && <option value="ALL">🏢 Todas las Sucursales</option>}
                  {sucursalesPermitidas.map(suc => <option key={suc.id} value={suc.id}>{suc.nombre}</option>)}
                </select>
              </div>
            )}
          </div>
          
          <div className="flex-1 flex items-center justify-end gap-3 relative">
            <div className="text-right hidden md:block">
              <p className="text-sm font-extrabold text-gray-800 leading-none">{usuario.nombre || 'Usuario'}</p>
              <p className="text-[11px] font-medium text-gray-500 mt-1">{usuario.rol || 'Empleado'}</p>
            </div>
            <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="focus:outline-none transition-transform hover:scale-105">
              <div className="h-9 w-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-transparent hover:ring-blue-200 overflow-hidden">
                {usuario.avatar ? <img src={usuario.avatar} alt="Avatar" className="w-full h-full object-cover" /> : usuario.nombre?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </button>

            {profileMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileMenuOpen(false)}></div>
                <div className="absolute right-0 top-14 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-40 overflow-hidden animate-fade-in-down p-1">
                  <div className="p-3 border-b border-gray-50 md:hidden text-center">
                     <p className="text-sm font-bold text-gray-800">{usuario.nombre}</p>
                     <p className="text-xs text-gray-500">{usuario.rol}</p>
                  </div>
                  <Link to="/perfil" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors"><User size={16} /> Mi Perfil</Link>
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors mt-1"><LogOut size={16} /> Cerrar Sesión</button>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
};

const BotonMenu = ({ to, icon, text, isOpen, currentPath }) => {
  const active = currentPath === to;
  return (
    <Link to={to} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all font-medium text-sm ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      {icon}
      <span className={`${!isOpen && 'hidden'} whitespace-nowrap`}>{text}</span>
    </Link>
  );
};
export default Layout;