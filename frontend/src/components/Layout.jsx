import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, Activity, User, Contact, MapPin, Building2, ChevronDown, Store, Moon, Sun, CreditCard } from 'lucide-react';
import api from '../services/api';
import { CATEGORIA_A_RUTA } from '../config/menuConfig';

// ✨ FIX ABSOLUTO: Código inyectado FUERA de React para evitar el parpadeo blanco ✨
if (!localStorage.getItem('theme')) {
  localStorage.setItem('theme', 'dark'); 
}
if (localStorage.getItem('theme') === 'dark' || (localStorage.getItem('theme') === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

const Layout = ({ children, title, moduleIcon }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [usuario, setUsuario] = useState(JSON.parse(localStorage.getItem('usuario') || '{"nombre": "Usuario"}'));
  const [menuItems, setMenuItems] = useState([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [sucursales, setSucursales] = useState([]);
  const [sucursalesPermitidas, setSucursalesPermitidas] = useState([]);
  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    const syncTheme = () => {
      setIsDarkMode(localStorage.getItem('theme') === 'dark');
    };
    window.addEventListener('themeChanged', syncTheme);
    return () => window.removeEventListener('themeChanged', syncTheme);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
    
    const loadMenu = async () => {
      try {
        const res = await api.get('/auth/me');
        const u = res.data;
        
        // Actualizamos local storage para evitar desincronizaciones si recarga F5
        localStorage.setItem('usuario', JSON.stringify(u));
        setUsuario(u);

        // ✨ LÓGICA DE MENÚ SUPERADMIN ✨
        if (u.rol === 'SuperAdmin') {
          setMenuItems([
            { path: '/admin-saas', label: 'Gestión SaaS', Icon: Building2 },
            { path: '/suscripciones-saas', label: 'Planes y Pagos', Icon: CreditCard },
            { path: '/configuracion', label: 'Ajustes', Icon: User } 
          ]);
          return; // Detiene la ejecución aquí. El SuperAdmin no necesita sucursales.
        }

        // ✨ LÓGICA DE MENÚ ADMINISTRADOR / EMPLEADO ✨
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
            const adminItems = [...Object.values(CATEGORIA_A_RUTA)];
            adminItems.push({ path: '/directorio', label: 'Directorio Staff', Icon: Contact });
            adminItems.push({ path: '/logs', label: 'Auditoría', Icon: Activity });
            setMenuItems(adminItems);
            permitidas = todasSucs;
          } else {
            permitidas = todasSucs.filter(s => asignadas.includes(parseInt(s.id, 10)));
            const categorias = Array.isArray(u.categorias) ? u.categorias : [];
            const categoriasDashboard = categorias.filter(c => c !== 'Modificador' && !c.startsWith('Modificador_'));
            const items = [{ path: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard }];
            categoriasDashboard.forEach(cat => {
              if (cat !== 'Dashboard' && CATEGORIA_A_RUTA[cat]) items.push(CATEGORIA_A_RUTA[cat]);
            });
            setMenuItems(items);
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
            if (defaultSuc) seleccionarSucursal(defaultSuc);
            else {
              setSucursalActiva(null);
              localStorage.removeItem('sucursalActiva');
              window.dispatchEvent(new Event('sucursalCambiada')); 
            }
          } else {
            setSucursalActiva(sucursalPrevia);
            window.dispatchEvent(new Event('sucursalCambiada')); 
          }
        } catch(e) {}

      } catch (err) {
        // Si falla /auth/me (token expirado o inválido), expulsa al login
        handleLogout();
      }
    };
    loadMenu();
  }, [location.pathname]);

  const seleccionarSucursal = (suc) => {
    if(!suc) return;
    const sucursalCompleta = suc.id === 'ALL' ? suc : sucursales.find(s => s.id === suc.id);
    setSucursalActiva(sucursalCompleta);
    localStorage.setItem('sucursalActiva', JSON.stringify(sucursalCompleta));
    setTimeout(() => window.dispatchEvent(new Event('sucursalCambiada')), 50); 
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (error) {}
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('sucursalActiva'); 
    navigate('/login');
  };

  const isSucursalesRoute = location.pathname === '/sucursales';

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300 font-sans overflow-hidden relative">
      
      <div 
        className={`fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      <aside className={`fixed lg:relative inset-y-0 left-0 bg-slate-900 dark:bg-slate-950 border-r dark:border-slate-800 text-white transition-transform duration-300 ease-in-out flex flex-col z-50 shadow-2xl lg:shadow-xl h-full w-64 lg:w-20 lg:hover:w-64 group
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-center border-b border-slate-800 shrink-0 bg-slate-900 dark:bg-slate-950 z-10 relative">
          <h1 className={`font-bold text-xl tracking-wide lg:hidden lg:group-hover:block transition-all`}>
            Razentec <span className="text-blue-500">SaaS</span>
          </h1>
          <span className="font-bold text-xl text-blue-500 hidden lg:block lg:group-hover:hidden">R</span>
        </div>

        {/* Solo muestra Dropdown si no es SuperAdmin */}
        {!isSucursalesRoute && usuario?.rol !== 'SuperAdmin' && (
          <div className="lg:hidden px-4 py-4 border-b border-slate-800 bg-slate-800/30 dark:bg-slate-900/50">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 px-1">Sucursal Actual</p>
            <CustomDropdown 
              sucursalActiva={sucursalActiva} 
              sucursalesPermitidas={sucursalesPermitidas} 
              usuario={usuario} 
              onSelect={(suc) => { seleccionarSucursal(suc); setSidebarOpen(false); }} 
              isMobile={true} 
            />
          </div>
        )}

        <nav className="flex-1 py-6 space-y-1.5 px-3 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <BotonMenu key={item.path} to={item.path} icon={<item.Icon size={20} />} text={item.label} currentPath={location.pathname} />
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative w-full">
        
        <header className="h-16 bg-white/60 dark:bg-slate-900/60 shadow-sm backdrop-blur-xl flex items-center justify-between px-4 md:px-6 lg:px-8 z-30 border-b border-gray-100 dark:border-slate-800 shrink-0 relative transition-colors duration-300">
          
          <div className="flex flex-1 items-center justify-start gap-3 overflow-hidden">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 lg:hidden transition-colors rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 outline-none">
              <Menu size={24} />
            </button>
            
            {title && (
              <h1 className="text-lg md:text-xl font-extrabold text-slate-800 dark:text-white truncate select-none flex items-center gap-2 transition-colors">
                {moduleIcon && <span className="text-blue-600 dark:text-blue-500 hidden sm:block">{moduleIcon}</span>}
                {title}
              </h1>
            )}
          </div>
          
          {/* Dropdown oculto para SuperAdmin */}
          <div className="hidden lg:flex items-center justify-center shrink-0 px-2">
            {!isSucursalesRoute && usuario?.rol !== 'SuperAdmin' && (
               <CustomDropdown 
                 sucursalActiva={sucursalActiva} 
                 sucursalesPermitidas={sucursalesPermitidas} 
                 usuario={usuario} 
                 onSelect={seleccionarSucursal} 
                 isMobile={false} 
               />
            )}
          </div>
          
          <div className="flex-1 flex items-center justify-end gap-3 sm:gap-4 relative shrink-0">
            
            <button 
              onClick={toggleDarkMode} 
              className="p-2 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-yellow-400 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-all focus:outline-none"
              title={isDarkMode ? "Modo Claro" : "Modo Oscuro"}
            >
              {isDarkMode ? <Sun size={20} strokeWidth={2.5}/> : <Moon size={20} strokeWidth={2.5}/>}
            </button>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-extrabold text-slate-800 dark:text-white leading-none transition-colors">{usuario?.nombre || 'Usuario'}</p>
              <p className="text-[10px] uppercase tracking-widest font-bold text-blue-600 dark:text-blue-400 mt-1">{usuario?.rol || 'Empleado'}</p>
            </div>
            
            <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="focus:outline-none transition-transform hover:scale-105 active:scale-95">
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-white dark:border-slate-800 overflow-hidden shrink-0 transition-colors">
                {usuario?.avatar ? <img src={usuario.avatar} alt="Avatar" className="w-full h-full object-cover" /> : (usuario?.nombre?.charAt(0)?.toUpperCase() || 'U')}
              </div>
            </button>

            {profileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)}></div>
                <div className="absolute right-0 top-14 mt-2 w-56 bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden animate-fade-in-down p-1.5 transition-colors">
                  <div className="p-4 border-b border-gray-50 dark:border-slate-700 sm:hidden flex items-center gap-3">
                     <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                       {usuario?.avatar ? <img src={usuario.avatar} className="w-full h-full object-cover rounded-full" /> : (usuario?.nombre?.charAt(0)?.toUpperCase() || 'U')}
                     </div>
                     <div className="min-w-0">
                       <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{usuario?.nombre}</p>
                       <p className="text-[9px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider mt-0.5 truncate">{usuario?.rol}</p>
                     </div>
                  </div>
                  <Link to="/configuracion" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors mt-1"><User size={16} /> Ajustes / Perfil</Link>
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-bold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-300 rounded-xl transition-colors mt-1"><LogOut size={16} /> Cerrar Sesión</button>
                </div>
              </>
            )}
          </div>
        </header>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto z-0 transition-colors duration-300 scroll-smooth">
          <div className="max-w-[1600px] mx-auto w-full p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const CustomDropdown = ({ sucursalActiva, sucursalesPermitidas, usuario, onSelect, isMobile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const hasOptions = sucursalesPermitidas.length > 1 || usuario?.rol === 'Administrador';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  let currentLabel = 'Cargando...';
  if (sucursalesPermitidas.length === 0 && usuario?.rol !== 'Administrador') currentLabel = 'Sin locales asignados';
  else if (sucursalActiva?.id === 'ALL') currentLabel = 'Todas las Sucursales';
  else if (sucursalActiva) currentLabel = sucursalActiva.nombre;

  return (
    <div className="relative w-full md:w-auto" ref={dropdownRef}>
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>}

      <button 
        onClick={() => hasOptions && setIsOpen(!isOpen)}
        disabled={!hasOptions}
        className={`flex items-center justify-between transition-all w-full md:w-auto ${
          isMobile 
            ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-3 text-slate-200' 
            : 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2 shadow-sm text-slate-700 dark:text-slate-200'
        } ${!hasOptions ? 'opacity-70 cursor-default' : 'cursor-pointer active:scale-95'}`}
      >
        <div className="flex items-center truncate">
          {sucursalActiva?.id === 'ALL' ? (
            <Building2 size={16} className={`${isMobile ? 'text-slate-400' : 'text-gray-500 dark:text-slate-400'} mr-2 shrink-0`}/>
          ) : (
            <Store size={16} className={`${isMobile ? 'text-blue-400' : 'text-blue-600 dark:text-blue-400'} mr-2 shrink-0`}/>
          )}
          <span className={`text-xs md:text-sm font-extrabold truncate max-w-[180px] md:max-w-[200px]`}>
            {currentLabel}
          </span>
        </div>
        {hasOptions && (
          <ChevronDown size={16} className={`${isMobile ? 'text-slate-400' : 'text-gray-400 dark:text-slate-500'} ml-3 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-2 w-[260px] rounded-2xl shadow-2xl border overflow-hidden animate-fade-in-down ${
          isMobile ? 'bg-slate-800 border-slate-700 top-full left-0' : 'bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl border-gray-100 dark:border-slate-700 top-full left-1/2 -translate-x-1/2'
        }`}>
          <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5">
            
            {usuario?.rol === 'Administrador' && (
              <button
                onClick={() => { onSelect({ id: 'ALL', nombre: 'Todas las Sucursales' }); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 text-xs md:text-sm font-extrabold rounded-xl flex items-center gap-3 transition-colors mb-1 ${
                  sucursalActiva?.id === 'ALL'
                    ? (isMobile ? 'bg-slate-700 text-blue-400' : 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400')
                    : (isMobile ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700')
                }`}
              >
                <Building2 size={16} className="shrink-0"/> Todas las Sucursales
              </button>
            )}

            {sucursalesPermitidas.map(suc => (
              <button
                key={suc.id}
                onClick={() => { onSelect(suc); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 text-xs md:text-sm font-extrabold rounded-xl flex items-center gap-3 transition-colors mb-0.5 last:mb-0 ${
                  sucursalActiva?.id === suc.id
                    ? (isMobile ? 'bg-slate-700 text-blue-400' : 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400')
                    : (isMobile ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700')
                }`}
              >
                <Store size={16} className="shrink-0"/> <span className="truncate">{suc.nombre}</span>
              </button>
            ))}

          </div>
        </div>
      )}
    </div>
  );
};

const BotonMenu = ({ to, icon, text, currentPath }) => {
  const active = currentPath === to;
  return (
    <Link to={to} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all font-bold text-sm ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <div className="shrink-0">{icon}</div>
      <span className={`whitespace-nowrap truncate lg:hidden lg:group-hover:block transition-all`}>{text}</span>
    </Link>
  );
};

export default Layout;