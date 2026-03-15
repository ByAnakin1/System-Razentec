import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, Activity, User, Contact, MapPin, Building2, ChevronDown } from 'lucide-react';
import api from '../services/api';
import { CATEGORIA_A_RUTA } from '../config/menuConfig';

const Layout = ({ children, title, moduleIcon }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [usuario, setUsuario] = useState(JSON.parse(localStorage.getItem('usuario') || '{"nombre": "Usuario"}'));
  const [menuItems, setMenuItems] = useState([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [sucursales, setSucursales] = useState([]);
  const [sucursalesPermitidas, setSucursalesPermitidas] = useState([]);
  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    
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
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      
      {/* CAPA OSCURA PARA MÓVILES */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* PANEL LATERAL */}
      <aside className={`fixed md:relative inset-y-0 left-0 bg-slate-900 text-white transition-all duration-300 flex flex-col z-50 shadow-2xl md:shadow-xl h-full
        ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:translate-x-0 md:w-20'}
      `}>
        <div className="h-16 flex items-center justify-center border-b border-slate-800 shrink-0">
          <h1 className={`font-bold text-xl tracking-wide ${!sidebarOpen && 'hidden md:hidden'}`}>Razentec <span className="text-blue-500">SaaS</span></h1>
          {!sidebarOpen && <span className="font-bold text-xl text-blue-500 hidden md:block">R</span>}
        </div>

        {/* SELECTOR DE SUCURSAL PARA MÓVILES */}
        {!isSucursalesRoute && sidebarOpen && (
          <div className="md:hidden px-4 py-4 border-b border-slate-800 bg-slate-800/30">
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-2 px-1">Sucursal Actual</p>
            <CustomDropdown 
              sucursalActiva={sucursalActiva} 
              sucursalesPermitidas={sucursalesPermitidas} 
              usuario={usuario} 
              onSelect={(suc) => {
                seleccionarSucursal(suc);
                setSidebarOpen(false); 
              }} 
              isMobile={true} 
            />
          </div>
        )}

        <nav className="flex-1 py-6 space-y-1.5 px-3 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <BotonMenu key={item.path} to={item.path} icon={<item.Icon size={20} />} text={item.label} isOpen={sidebarOpen} currentPath={location.pathname} />
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* ✨ AQUÍ ESTÁ EL ARREGLO: Cambiamos z-10 por z-30 para que NADA del contenido se le suba encima ✨ */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 md:px-6 lg:px-8 z-30 border-b border-gray-100 shrink-0 relative">
          
          <div className="flex flex-1 items-center justify-start gap-2 md:gap-4 overflow-hidden">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors shrink-0"><Menu size={22} /></button>
            {title && (
              <h1 className="text-lg md:text-xl font-extrabold text-gray-800 truncate select-none flex items-center gap-2">
                {moduleIcon && <span className="text-blue-600 hidden sm:block">{moduleIcon}</span>}
                {title}
              </h1>
            )}
          </div>
          
          <div className="flex items-center justify-center hidden md:flex shrink-0 px-2">
            {!isSucursalesRoute && (
               <CustomDropdown 
                 sucursalActiva={sucursalActiva} 
                 sucursalesPermitidas={sucursalesPermitidas} 
                 usuario={usuario} 
                 onSelect={seleccionarSucursal} 
                 isMobile={false} 
               />
            )}
          </div>
          
          <div className="flex-1 flex items-center justify-end gap-3 relative shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-extrabold text-gray-800 leading-none">{usuario.nombre || 'Usuario'}</p>
              <p className="text-[11px] font-medium text-gray-500 mt-1">{usuario.rol || 'Empleado'}</p>
            </div>
            <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="focus:outline-none transition-transform hover:scale-105">
              <div className="h-9 w-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md ring-2 ring-transparent hover:ring-blue-200 overflow-hidden shrink-0">
                {usuario.avatar ? <img src={usuario.avatar} alt="Avatar" className="w-full h-full object-cover" /> : usuario.nombre?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </button>

            {/* Menú de Perfil Flotante (Con z-index altísimo) */}
            {profileMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)}></div>
                <div className="absolute right-0 top-14 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-fade-in-down p-1">
                  <div className="p-3 border-b border-gray-50 sm:hidden text-center">
                     <p className="text-sm font-bold text-gray-800 truncate">{usuario.nombre}</p>
                     <p className="text-[10px] uppercase font-bold text-gray-400 mt-0.5">{usuario.rol}</p>
                  </div>
                  <Link to="/perfil" onClick={() => setProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors"><User size={16} /> Mi Perfil</Link>
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors mt-1"><LogOut size={16} /> Cerrar Sesión</button>
                </div>
              </>
            )}
          </div>
        </header>
        
        {/* Usamos z-0 aquí para asegurarnos de que quede debajo de la cabecera */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 z-0">
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
  const hasOptions = sucursalesPermitidas.length > 1 || usuario.rol === 'Administrador';

  let currentLabel = 'Cargando...';
  if (sucursalesPermitidas.length === 0 && usuario.rol !== 'Administrador') currentLabel = 'Sin locales asignados';
  else if (sucursalActiva?.id === 'ALL') currentLabel = 'Todas las Sucursales';
  else if (sucursalActiva) currentLabel = sucursalActiva.nombre;

  return (
    <div className="relative w-full md:w-auto">
      
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>}

      <button 
        onClick={() => hasOptions && setIsOpen(!isOpen)}
        disabled={!hasOptions}
        className={`flex items-center justify-between transition-all w-full md:w-auto ${
          isMobile 
            ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200' 
            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full px-4 py-1.5 shadow-sm text-slate-700'
        } ${!hasOptions ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}
      >
        <div className="flex items-center truncate">
          {sucursalActiva?.id === 'ALL' ? (
            <Building2 size={16} className={`${isMobile ? 'text-slate-400' : 'text-gray-500'} mr-2 shrink-0`}/>
          ) : (
            <MapPin size={16} className={`${isMobile ? 'text-blue-400' : 'text-blue-600'} mr-2 shrink-0`}/>
          )}
          <span className={`text-sm font-bold truncate max-w-[150px] md:max-w-[200px]`}>
            {currentLabel}
          </span>
        </div>
        {hasOptions && (
          <ChevronDown size={16} className={`${isMobile ? 'text-slate-400' : 'text-gray-400'} ml-3 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-2 w-[240px] rounded-2xl shadow-xl border overflow-hidden animate-fade-in-down ${
          isMobile ? 'bg-slate-800 border-slate-700 top-full left-0' : 'bg-white border-gray-100 top-full left-1/2 -translate-x-1/2'
        }`}>
          <div className="max-h-60 overflow-y-auto custom-scrollbar py-1.5">
            
            {usuario.rol === 'Administrador' && (
              <button
                onClick={() => { onSelect({ id: 'ALL', nombre: 'Todas las Sucursales' }); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center gap-3 transition-colors ${
                  sucursalActiva?.id === 'ALL'
                    ? (isMobile ? 'bg-slate-700 text-blue-400 border-l-4 border-blue-500' : 'bg-blue-50 text-blue-700 border-l-4 border-blue-600')
                    : (isMobile ? 'text-slate-300 hover:bg-slate-700 border-l-4 border-transparent' : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent')
                }`}
              >
                <Building2 size={16} /> Todas las Sucursales
              </button>
            )}

            {sucursalesPermitidas.map(suc => (
              <button
                key={suc.id}
                onClick={() => { onSelect(suc); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center gap-3 transition-colors ${
                  sucursalActiva?.id === suc.id
                    ? (isMobile ? 'bg-slate-700 text-blue-400 border-l-4 border-blue-500' : 'bg-blue-50 text-blue-700 border-l-4 border-blue-600')
                    : (isMobile ? 'text-slate-300 hover:bg-slate-700 border-l-4 border-transparent' : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent')
                }`}
              >
                <MapPin size={16} /> {suc.nombre}
              </button>
            ))}

          </div>
        </div>
      )}
    </div>
  );
};

const BotonMenu = ({ to, icon, text, isOpen, currentPath }) => {
  const active = currentPath === to;
  return (
    <Link to={to} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all font-medium text-sm ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <div className="shrink-0">{icon}</div>
      <span className={`whitespace-nowrap ${!isOpen ? 'md:hidden' : ''}`}>{text}</span>
    </Link>
  );
};

export default Layout;