import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Activity, Clock, User, Search, Eye, X, ChevronLeft, ChevronRight, CalendarDays, LogIn, LogOut, Store, ArrowDownUp } from 'lucide-react';

const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const Auditoria = () => {
  const [logs, setLogs] = useState([]);
  const [usuariosDB, setUsuariosDB] = useState([]); 
  const [sucursales, setSucursales] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState('all'); 
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [searchUser, setSearchUser] = useState('');
  const [searchDetail, setSearchDetail] = useState('');
  
  // ✨ NUEVO: Estado para el filtro de orden de fechas
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' (más nuevo primero) | 'asc' (más antiguo primero)

  const [selectedUser, setSelectedUser] = useState(null);
  const [logDetail, setLogDetail] = useState(null);

  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);
  const esVistaGlobal = sucursalActiva?.id === 'ALL';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resLogs, resUsuarios, resSucs] = await Promise.all([
        api.get('/auditoria'),
        api.get('/usuarios'),
        api.get('/sucursales')
      ]);
      setLogs(resLogs.data);
      setUsuariosDB(resUsuarios.data);
      setSucursales(resSucs.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    const handleSucursalCambiada = () => {
      setSucursalActiva(JSON.parse(localStorage.getItem('sucursalActiva')));
    };
    window.addEventListener('sucursalCambiada', handleSucursalCambiada);
    return () => window.removeEventListener('sucursalCambiada', handleSucursalCambiada);
  }, []);

  // ✨ FIX: Cerrar modales con ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        if (logDetail) setLogDetail(null);
        else setSelectedUser(null);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [logDetail]);

  const handleOverlayClick = (e, closeFunc) => {
    if (e.target === e.currentTarget) closeFunc();
  };

  const parseDateUTC = (dateString) => {
    if (!dateString) return new Date();
    const str = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    return new Date(str);
  };

  const formatearFecha = (fechaISO, soloHora = false) => {
    if (!fechaISO) return '';
    const date = parseDateUTC(fechaISO);
    const opciones = soloHora 
      ? { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Lima' } 
      : { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Lima' };
    return date.toLocaleString('es-PE', opciones);
  };

  const isSameDayPeru = (date1, date2) => {
    const opts = { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' };
    return date1.toLocaleDateString('es-PE', opts) === date2.toLocaleDateString('es-PE', opts);
  };

  const isSameMonthPeru = (date1, date2) => {
    const opts = { timeZone: 'America/Lima', year: 'numeric', month: '2-digit' };
    return date1.toLocaleDateString('es-PE', opts) === date2.toLocaleDateString('es-PE', opts);
  };

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() - 1);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(newDate.getDate() + 1);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const getLabelFecha = () => {
    if (viewMode === 'all') return 'Historial Completo';
    const opciones = viewMode === 'day' 
      ? { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Lima' }
      : { month: 'long', year: 'numeric', timeZone: 'America/Lima' };
    return currentDate.toLocaleDateString('es-PE', opciones).toUpperCase();
  };

  const parseJsonArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try {
        let parsed = JSON.parse(data);
        if (typeof parsed === 'string') parsed = JSON.parse(parsed); 
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) { return []; }
    }
    return [];
  };

  const logsFiltradosPorFecha = logs.filter(log => {
    if (viewMode === 'all') return true;
    const logDate = parseDateUTC(log.created_at);
    if (viewMode === 'day') return isSameDayPeru(logDate, currentDate);
    if (viewMode === 'month') return isSameMonthPeru(logDate, currentDate);
    return true;
  });

  const userMap = {};

  usuariosDB.forEach(u => {
    userMap[u.id] = {
      id: u.id,
      nombre: u.empleado_nombre || u.email || 'Usuario Desconocido',
      avatar: u.avatar,
      rol: u.rol,
      area: u.area_cargo || 'Sin designar',
      sucursales_asignadas: u.sucursales_asignadas, 
      total_acciones: 0,
      ultima_accion: null, 
      logs: []
    };
  });

  logsFiltradosPorFecha.forEach(log => {
    const uid = log.usuario_id || 'SISTEMA_FANTASMA';

    if (!userMap[uid]) {
      userMap[uid] = {
        id: uid,
        nombre: log.usuario_nombre || 'Usuario Eliminado',
        avatar: log.avatar,
        rol: log.rol || 'N/A',
        area: log.area_cargo || 'N/A',
        sucursales_asignadas: log.sucursales_asignadas,
        total_acciones: 0,
        ultima_accion: null,
        logs: []
      };
    }
    
    userMap[uid].total_acciones += 1;
    userMap[uid].logs.push(log);
    
    if (!userMap[uid].ultima_accion || parseDateUTC(log.created_at) > parseDateUTC(userMap[uid].ultima_accion)) {
      userMap[uid].ultima_accion = log.created_at;
    }
  });

  let usuariosMostrados = Object.values(userMap).filter(u => {
    const coincideTexto = u.nombre.toLowerCase().includes(searchUser.toLowerCase()) || 
                          u.area.toLowerCase().includes(searchUser.toLowerCase());
    if (!coincideTexto) return false;
    if (esVistaGlobal) return true;
    if (!sucursalActiva) return false;

    const asignadas = parseJsonArray(u.sucursales_asignadas).map(id => parseInt(id, 10));
    const perteneceASucursal = asignadas.includes(parseInt(sucursalActiva.id, 10));

    return perteneceASucursal || u.rol === 'Administrador';
  });

  usuariosMostrados.sort((a, b) => {
    if (b.total_acciones !== a.total_acciones) return b.total_acciones - a.total_acciones;
    return a.nombre.localeCompare(b.nombre);
  });

  const getVisualAction = (accion) => {
    const acc = accion ? accion.toUpperCase() : 'ACCIÓN';
    if (acc === 'LOGIN') return 'ENTRADA';
    if (acc === 'LOGOUT') return 'SALIDA';
    if (acc === 'CREAR') return 'CREAR';
    if (acc === 'ACTUALIZAR') return 'EDITAR';
    if (acc === 'ELIMINAR') return 'BORRAR';
    return acc;
  };

  const getActionPill = (accion) => {
    const visual = getVisualAction(accion);
    if (visual === 'ENTRADA') return <span className="flex items-center gap-1 text-[9px] md:text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/30 border border-indigo-200/50 dark:border-indigo-500/20 backdrop-blur-md px-1.5 md:px-2 py-0.5 md:py-1 rounded-md w-fit shrink-0 transition-colors"><LogIn size={12}/> ENTRADA</span>;
    if (visual === 'SALIDA') return <span className="flex items-center gap-1 text-[9px] md:text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 bg-gray-100/80 dark:bg-slate-800/50 border border-gray-200/50 dark:border-white/5 backdrop-blur-md px-1.5 md:px-2 py-0.5 md:py-1 rounded-md w-fit shrink-0 transition-colors"><LogOut size={12}/> SALIDA</span>;
    if (visual === 'CREAR') return <span className="text-[9px] md:text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-500/20 backdrop-blur-md px-1.5 md:px-2 py-0.5 md:py-1 rounded-md w-fit shrink-0 transition-colors">CREAR</span>;
    if (visual === 'EDITAR') return <span className="text-[9px] md:text-[10px] font-black uppercase text-blue-700 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-500/20 backdrop-blur-md px-1.5 md:px-2 py-0.5 md:py-1 rounded-md w-fit shrink-0 transition-colors">EDITAR</span>;
    if (visual === 'BORRAR') return <span className="text-[9px] md:text-[10px] font-black uppercase text-red-700 dark:text-red-400 bg-red-100/80 dark:bg-red-900/30 border border-red-200/50 dark:border-red-500/20 backdrop-blur-md px-1.5 md:px-2 py-0.5 md:py-1 rounded-md w-fit shrink-0 transition-colors">BORRAR</span>;
    return <span className="text-[9px] md:text-[10px] font-black uppercase text-gray-700 dark:text-slate-300 bg-gray-100/80 dark:bg-slate-800/50 border border-gray-200/50 dark:border-white/5 backdrop-blur-md px-1.5 md:px-2 py-0.5 md:py-1 rounded-md w-fit shrink-0 transition-colors">{visual}</span>;
  };

  const getLogsExpediente = () => {
    if (!selectedUser) return [];
    
    // Filtrado por buscador
    const logsFiltrados = selectedUser.logs.filter(l => {
      const term = searchDetail.toLowerCase();
      const visualAction = getVisualAction(l.accion).toLowerCase();
      return (l.modulo || '').toLowerCase().includes(term) || 
             (l.detalles || '').toLowerCase().includes(term) ||
             visualAction.includes(term);
    });

    // ✨ FIX: Ordenamiento Ascendente o Descendente basado en el estado `sortOrder`
    logsFiltrados.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return logsFiltrados;
  };

  const obtenerNombresSucursales = (arrStr) => {
    const arr = parseJsonArray(arrStr);
    if (arr.length === 0) return 'Sin asignar';
    const nombres = arr.map(id => sucursales.find(s => s.id === parseInt(id))?.nombre).filter(Boolean);
    if (nombres.length === sucursales.length && sucursales.length > 0) return 'Todas las Sucursales';
    return nombres.join(', ') || 'Desconocida';
  };

  return (
    <Layout title="Auditoría" moduleIcon={<Activity/>}>
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 md:mb-6 gap-3">
        <p className="text-[11px] md:text-sm text-gray-500 dark:text-blue-300/70 font-extrabold px-1 uppercase tracking-widest transition-colors">
           {esVistaGlobal ? 'Actividad Global' : `Actividad en Sede: ${sucursalActiva?.nombre || 'Ninguna'}`}
        </p>
      </div>

      {/* CONTROLES DE FECHA Y BÚSQUEDA */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 md:mb-6 bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/80 dark:border-white/5 gap-3 transition-colors duration-300">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white/50 dark:bg-transparent md:bg-transparent p-2 md:p-0 rounded-[1.25rem] md:rounded-none w-full xl:w-auto transition-colors">
          
          <div className="flex items-center justify-between bg-white/80 dark:bg-slate-900/50 backdrop-blur-md rounded-xl shadow-sm border border-gray-200/80 dark:border-white/10 transition-colors">
            <button onClick={handlePrev} disabled={viewMode === 'all'} className="p-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 disabled:opacity-30 rounded-l-xl transition-colors"><ChevronLeft size={16}/></button>
            <div className="px-2 min-w-[140px] md:min-w-[160px] text-center font-extrabold text-[10px] md:text-xs text-slate-800 dark:text-white tracking-widest uppercase flex items-center justify-center gap-1.5 transition-colors">
              <CalendarDays size={14} className="text-primary"/> {getLabelFecha()}
            </div>
            <button onClick={handleNext} disabled={viewMode === 'all'} className="p-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 disabled:opacity-30 rounded-r-xl transition-colors"><ChevronRight size={16}/></button>
          </div>
          
          <div className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-white/10 mx-1 transition-colors"></div>
          
          <div className="flex gap-1 bg-white/80 dark:bg-slate-900/50 sm:bg-transparent dark:sm:bg-transparent p-1 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-gray-200/80 dark:border-transparent shadow-sm sm:shadow-none backdrop-blur-md transition-colors">
            <button onClick={() => {setViewMode('day'); setCurrentDate(new Date());}} className={`flex-1 sm:flex-none px-4 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-colors ${viewMode === 'day' ? 'btn-primary text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800'}`}>Día</button>
            <button onClick={() => setViewMode('month')} className={`flex-1 sm:flex-none px-4 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-colors ${viewMode === 'month' ? 'btn-primary text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800'}`}>Mes</button>
            <button onClick={() => setViewMode('all')} className={`flex-1 sm:flex-none px-4 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-colors ${viewMode === 'all' ? 'btn-primary text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800'}`}>Todo</button>
          </div>
        </div>

        <div className="relative w-full xl:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-blue-400/70 transition-colors" size={16}/>
          <input 
            type="text" placeholder="Buscar empleado..." 
            className="w-full bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/80 dark:border-white/10 pl-9 pr-3 py-2.5 rounded-xl text-xs md:text-sm outline-none focus:bg-white dark:focus:bg-blue-950 focus:ring-2 ring-primary font-bold text-gray-800 dark:text-white transition-all shadow-sm"
            value={searchUser} onChange={(e) => setSearchUser(e.target.value)}
          />
        </div>
      </div>

      {/* VISTA TÁCTIL (Móvil y Tablet hasta lg) */}
      <div className="lg:hidden flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-blue-300/70 transition-colors">
             <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
             <p className="text-[10px] font-extrabold uppercase tracking-widest transition-colors">Analizando registros...</p>
          </div>
        ) : !sucursalActiva ? (
          <div className="text-center py-10 text-xs font-bold text-red-500 bg-red-50/80 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-500/20 backdrop-blur-md transition-colors">
            ⚠️ Sin sucursal asignada.
          </div>
        ) : usuariosMostrados.length === 0 ? (
          <div className="text-center py-16 bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] border border-gray-100/50 dark:border-white/5 shadow-sm flex flex-col items-center transition-colors">
            <Activity size={48} className="text-gray-300 dark:text-slate-600 mb-3" strokeWidth={1.5}/>
            <p className="text-sm font-black text-gray-600 dark:text-white transition-colors">Sin actividad registrada</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium transition-colors">No hay logs para la fecha/sede seleccionada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {usuariosMostrados.map((u) => (
              <div key={u.id} className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-xl rounded-[1.5rem] border border-gray-100/50 dark:border-white/5 p-4 shadow-sm relative group overflow-hidden transition-colors">
                 <div className="flex justify-between items-start mb-3 border-b border-dashed border-gray-200/50 dark:border-slate-700 pb-3 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-lg overflow-hidden shrink-0 border border-slate-200/50 dark:border-white/5 backdrop-blur-md transition-colors">
                          {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover"/> : u.nombre.charAt(0).toUpperCase()}
                       </div>
                       <div className="min-w-0">
                         <p className="font-extrabold text-gray-800 dark:text-white text-sm leading-tight truncate transition-colors">{u.nombre}</p>
                         <p className="text-[9px] font-bold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest mt-0.5 transition-colors">{u.rol === 'Administrador' ? 'ADMINISTRADOR' : u.area}</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-gray-100/50 dark:border-white/5 mb-3 grid grid-cols-2 gap-2 backdrop-blur-md transition-colors">
                    <div className="flex flex-col items-start gap-1 overflow-hidden">
                      <span className="text-[9px] font-extrabold uppercase text-gray-400 dark:text-slate-500 tracking-widest transition-colors">Última Acción</span>
                      {u.ultima_accion ? (
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate flex items-center gap-1 transition-colors"><Clock size={10} className="text-blue-400 dark:text-blue-500"/> {formatearFecha(u.ultima_accion)}</span>
                      ) : (
                        <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 italic transition-colors">Ninguna</span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 overflow-hidden">
                      <span className="text-[9px] font-extrabold uppercase text-gray-400 dark:text-slate-500 tracking-widest transition-colors">Registros</span>
                      <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 backdrop-blur-md transition-colors">
                        {u.total_acciones} Acciones
                      </span>
                    </div>
                 </div>

                 {esVistaGlobal && u.rol !== 'Administrador' && (
                   <div className="mb-3">
                     <span className="text-[9px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-900/30 border border-purple-100/50 dark:border-purple-500/20 backdrop-blur-md px-2 py-1 rounded flex items-center gap-1 w-max transition-colors">
                       <Store size={10}/> {obtenerNombresSucursales(u.sucursales_asignadas)}
                     </span>
                   </div>
                 )}

                 <button onClick={() => { setSelectedUser(u); setSearchDetail(''); }} className="w-full py-2.5 bg-blue-50/80 dark:bg-blue-900/30 border border-blue-100/50 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 rounded-xl font-black text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center justify-center gap-1.5 transition-colors backdrop-blur-md shadow-sm active:scale-95">
                   <Eye size={14}/> Ver Expediente
                 </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VISTA PC (Tabla Liquid Glass) */}
      <div className="hidden lg:block bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/80 dark:border-white/5 overflow-hidden transition-colors duration-300">
        <div className={`overflow-x-auto ${hideScrollbar}`}>
          <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300 border-collapse transition-colors">
            <thead className="bg-slate-50/50 dark:bg-blue-950/30 text-slate-500 dark:text-blue-300 uppercase font-extrabold tracking-widest text-[10px] border-b border-gray-200/50 dark:border-white/5 transition-colors">
              <tr>
                <th className="px-6 py-5">Personal</th>
                <th className="px-6 py-5 text-center">Acciones Registradas</th>
                <th className="px-6 py-5">Última Actividad</th>
                <th className="px-6 py-5 text-center">Revisar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50 dark:divide-white/5 relative bg-transparent transition-colors">
              {loading ? <tr><td colSpan="4" className="text-center py-12 text-gray-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest transition-colors">Analizando registros...</td></tr> : 
               !sucursalActiva ? <tr><td colSpan="4" className="text-center py-12 text-red-500 font-bold transition-colors">⚠️ Sin sucursal asignada.</td></tr> :
               usuariosMostrados.length === 0 ? <tr><td colSpan="4" className="text-center py-12 font-medium text-gray-400 dark:text-slate-500 transition-colors">No hay usuarios con actividad registrada.</td></tr> :
               usuariosMostrados.map((u) => (
                <tr key={u.id} className="hover:bg-white/40 dark:hover:bg-blue-900/10 transition-colors duration-200 group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black text-lg overflow-hidden border border-gray-200/50 dark:border-white/5 shrink-0 backdrop-blur-md transition-colors">
                         {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover"/> : (u.nombre.charAt(0).toUpperCase())}
                       </div>
                       <div>
                         <p className="font-extrabold text-slate-800 dark:text-white transition-colors">{u.nombre}</p>
                         <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-blue-300/70 font-bold mt-0.5 transition-colors">{u.rol === 'Administrador' ? 'ADMINISTRADOR' : u.area}</p>
                         
                         {esVistaGlobal && u.rol !== 'Administrador' && (
                            <p className="text-[9px] uppercase tracking-wider text-purple-600 dark:text-purple-400 font-black mt-1.5 flex items-center gap-1 transition-colors">
                              <Store size={10}/> {obtenerNombresSucursales(u.sucursales_asignadas)}
                            </p>
                         )}
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                     {u.total_acciones > 0 ? (
                       <span className="bg-primary/10 text-primary font-black px-3 py-1.5 rounded-lg text-[10px] border border-primary/20 backdrop-blur-md transition-colors">{u.total_acciones}</span>
                     ) : (
                       <span className="bg-white/50 dark:bg-slate-800/50 text-gray-400 dark:text-slate-500 font-bold px-3 py-1.5 rounded-lg text-[10px] border border-gray-200/50 dark:border-white/5 backdrop-blur-md transition-colors">0</span>
                     )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[11px] font-extrabold text-slate-500 dark:text-slate-400 transition-colors">
                    {u.ultima_accion ? (
                      <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-400 dark:text-blue-500"/> {formatearFecha(u.ultima_accion)}</span>
                    ) : (
                      <span className="text-gray-400 dark:text-slate-600 italic font-medium">Sin actividad</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center transition-opacity">
                      <button onClick={() => { setSelectedUser(u); setSearchDetail(''); }} className="bg-white/80 dark:bg-slate-800/80 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-black transition-colors shadow-sm border border-gray-200/50 dark:border-white/5 hover:border-blue-200 dark:hover:border-slate-600 flex items-center gap-1.5 backdrop-blur-md active:scale-95">
                        <Eye size={14}/> Expediente
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✨ MODAL EXPEDIENTE (LIQUID GLASS COMPACTO Y CENTRADO) ✨ */}
      {selectedUser && (
        <div onMouseDown={(e) => handleOverlayClick(e, () => setSelectedUser(null))} className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm transition-colors duration-300 animate-fade-in">
          {/* ✨ FIX: Reducido a max-w-4xl para que no sea excesivo en PC, con max-h-[85vh] ✨ */}
          <div className="bg-white/95 dark:bg-[#0F172A] backdrop-blur-3xl rounded-t-[2rem] sm:rounded-[2.5rem] w-full sm:max-w-4xl flex flex-col h-[90vh] sm:max-h-[85vh] overflow-hidden animate-fade-in-up border border-gray-200 dark:border-slate-800 shadow-2xl transition-colors">
            
            {/* Header */}
            <div className="bg-slate-900 dark:bg-[#080C17] p-4 md:p-5 flex justify-between items-center text-white shrink-0 relative overflow-hidden transition-colors border-b border-slate-800 dark:border-slate-800/50">
               <div className="w-12 h-1.5 bg-white/20 rounded-full absolute top-3 left-1/2 -translate-x-1/2 sm:hidden z-20"></div>
               <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
               
               <div className="flex items-center gap-3 md:gap-4 z-10 mt-2 sm:mt-0">
                 <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-lg md:text-xl border border-white/20 overflow-hidden shrink-0">
                   {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full object-cover"/> : selectedUser.nombre.charAt(0).toUpperCase()}
                 </div>
                 <div className="min-w-0">
                   <h2 className="text-base md:text-lg font-black tracking-tight truncate pr-4">Expediente: {selectedUser.nombre}</h2>
                   <p className="text-[9px] md:text-[10px] text-blue-400 dark:text-blue-500 font-extrabold tracking-widest uppercase mt-0.5 flex items-center gap-1"><CalendarDays size={10}/> {getLabelFecha()}</p>
                 </div>
               </div>
               <button onClick={() => setSelectedUser(null)} className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full backdrop-blur-sm transition-colors z-10 shrink-0"><X size={16}/></button>
            </div>

            {/* Herramientas (Buscador y Filtro de Orden) */}
            <div className="bg-gray-50/50 dark:bg-slate-900/30 border-b border-gray-100 dark:border-slate-800 p-3 md:p-4 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-3 transition-colors">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 transition-colors" size={14}/>
                <input 
                  type="text" placeholder="Buscar por módulo o detalle..." 
                  className="w-full bg-white dark:bg-slate-950 backdrop-blur-md border border-gray-200 dark:border-slate-700 pl-8 pr-4 py-2 rounded-xl text-xs md:text-sm outline-none focus:ring-2 ring-primary font-bold text-gray-800 dark:text-white transition-all shadow-sm"
                  value={searchDetail} onChange={(e) => setSearchDetail(e.target.value)}
                />
              </div>

              <div className="flex w-full sm:w-auto items-center gap-2 justify-between sm:justify-end">
                <div className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-950 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 transition-colors">
                  <span className="text-primary">{getLogsExpediente().length} Registros</span>
                </div>
                {/* ✨ FIX: Filtro para Invertir Fechas ✨ */}
                <button 
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="bg-white dark:bg-slate-950 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 px-3 py-2 rounded-lg text-[10px] font-black flex items-center gap-1.5 uppercase tracking-widest transition-all shadow-sm active:scale-95"
                >
                  <ArrowDownUp size={14}/> {sortOrder === 'desc' ? 'Más Nuevos' : 'Más Antiguos'}
                </button>
              </div>
            </div>

            {/* Cuerpo del Modal con Scroll Interno */}
            <div className={`flex-1 overflow-y-auto bg-transparent relative ${hideScrollbar}`}>
              
              {/* Móvil y Tablet: Timeline */}
              <div className="lg:hidden p-4 space-y-3">
                {getLogsExpediente().length === 0 ? (
                   <div className="text-center py-10 text-gray-400 dark:text-slate-500 italic text-xs font-bold transition-colors">No hay registros que coincidan.</div>
                ) : (
                  getLogsExpediente().map((log) => (
                    <div key={log.id} onClick={() => setLogDetail(log)} className="bg-white dark:bg-slate-800/50 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col gap-2.5 relative active:scale-[0.98] transition-transform cursor-pointer">
                       <div className="flex justify-between items-start">
                         <div className="flex items-center gap-2 flex-wrap">
                           {getActionPill(log.accion)}
                           <span className="text-[9px] font-black uppercase text-slate-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-900 px-2 py-1 rounded-md border border-gray-200 dark:border-slate-700 truncate max-w-[140px] transition-colors">{log.modulo}</span>
                         </div>
                         <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0 transition-colors"><Clock size={10}/> {formatearFecha(log.created_at, viewMode === 'day')}</span>
                       </div>
                       <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 line-clamp-2 leading-snug transition-colors">{log.detalles}</p>
                    </div>
                  ))
                )}
              </div>

              {/* PC: Tabla Completa */}
              <div className="hidden lg:block w-full h-full">
                <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300 border-collapse transition-colors">
                  <thead className="sticky top-0 z-30 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-sm transition-colors border-b border-gray-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-[9px] uppercase font-black text-gray-500 dark:text-slate-400 tracking-widest w-[15%]">Hora / Fecha</th>
                      <th className="px-6 py-4 text-[9px] uppercase font-black text-gray-500 dark:text-slate-400 tracking-widest w-[15%]">Módulo</th>
                      <th className="px-6 py-4 text-[9px] uppercase font-black text-gray-500 dark:text-slate-400 tracking-widest w-[15%]">Acción</th>
                      <th className="px-6 py-4 text-[9px] uppercase font-black text-gray-500 dark:text-slate-400 tracking-widest w-[45%]">Vista Previa</th>
                      <th className="px-6 py-4 text-[9px] uppercase font-black text-gray-500 dark:text-slate-400 tracking-widest w-[10%] text-center">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50 relative z-0 bg-transparent transition-colors">
                    {getLogsExpediente().length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-16 text-gray-400 dark:text-slate-500 italic font-bold text-xs transition-colors">No se encontraron registros.</td></tr>
                    ) : (
                      getLogsExpediente().map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => setLogDetail(log)}>
                          <td className="px-6 py-4 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest transition-colors">{formatearFecha(log.created_at, viewMode === 'day')}</td>
                          <td className="px-6 py-4 font-black text-slate-700 dark:text-slate-300 text-[11px] uppercase transition-colors">{log.modulo}</td>
                          <td className="px-6 py-4">{getActionPill(log.accion)}</td>
                          <td className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[300px] xl:max-w-md transition-colors" title={log.detalles}>{log.detalles}</td>
                          <td className="px-6 py-4 text-center">
                            <button className="p-2 text-blue-500 dark:text-blue-400 bg-white dark:bg-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-gray-200 dark:border-slate-700 shadow-sm active:scale-95" title="Ver Detalle Técnico">
                              <Eye size={16}/>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Footer Fijo */}
            <div className="p-4 md:p-5 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 shrink-0 transition-colors">
               <button onClick={() => setSelectedUser(null)} className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700/80 text-gray-700 dark:text-slate-300 py-3.5 rounded-xl font-extrabold text-xs md:text-sm shadow-sm transition-colors active:scale-95">Cerrar Expediente</button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ MODAL DETALLE TÉCNICO DEL LOG (LIQUID GLASS) ✨ */}
      {logDetail && (
        <div onMouseDown={(e) => handleOverlayClick(e, () => setLogDetail(null))} className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-colors animate-fade-in">
          <div className="bg-white dark:bg-[#0F172A] rounded-[2rem] shadow-2xl w-full sm:max-w-md p-6 border border-gray-200 dark:border-slate-800 animate-fade-in-up relative pb-8 sm:pb-8 flex flex-col max-h-[85vh] transition-colors">
            
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>
            <div className="flex justify-between items-center mb-5 shrink-0">
               <h3 className="text-sm md:text-base font-black text-gray-800 dark:text-white uppercase tracking-widest flex items-center gap-2"><Activity className="text-primary" size={18}/> Reporte Técnico</h3>
               <button onClick={() => setLogDetail(null)} className="bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors"><X size={16}/></button>
            </div>
            
            <div className="flex items-center gap-2 mb-5 flex-wrap shrink-0">
               {getActionPill(logDetail.accion)}
               <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-900 px-2.5 py-1 rounded-md border border-gray-200 dark:border-slate-700 transition-colors">{logDetail.modulo}</span>
            </div>
            
            <div className={`bg-gray-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-slate-700/50 overflow-y-auto ${hideScrollbar} flex-1 transition-colors`}>
               <p className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed break-words transition-colors whitespace-pre-wrap">
                 {logDetail.detalles}
               </p>
            </div>

            <p className="text-[9px] text-gray-400 dark:text-slate-500 text-center mt-5 font-extrabold tracking-widest flex justify-center items-center gap-1.5 shrink-0 transition-colors uppercase">
               <Clock size={12}/> TIMESTAMP: {formatearFecha(logDetail.created_at)}
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Auditoria;