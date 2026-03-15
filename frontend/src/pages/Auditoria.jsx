import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Activity, Clock, User, Search, Eye, X, ChevronLeft, ChevronRight, CalendarDays, LogIn, LogOut, Store } from 'lucide-react';

const Auditoria = () => {
  const [logs, setLogs] = useState([]);
  const [usuariosDB, setUsuariosDB] = useState([]); 
  const [sucursales, setSucursales] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState('all'); 
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [searchUser, setSearchUser] = useState('');
  const [searchDetail, setSearchDetail] = useState('');

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
    if (visual === 'ENTRADA') return <span className="flex items-center gap-1 text-[9px] md:text-[10px] font-extrabold uppercase text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md w-fit shrink-0"><LogIn size={12}/> ENTRADA</span>;
    if (visual === 'SALIDA') return <span className="flex items-center gap-1 text-[9px] md:text-[10px] font-extrabold uppercase text-gray-500 bg-gray-100 border border-gray-200 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md w-fit shrink-0"><LogOut size={12}/> SALIDA</span>;
    if (visual === 'CREAR') return <span className="text-[9px] md:text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md w-fit shrink-0">CREAR</span>;
    if (visual === 'EDITAR') return <span className="text-[9px] md:text-[10px] font-extrabold uppercase text-blue-700 bg-blue-100 border border-blue-200 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md w-fit shrink-0">EDITAR</span>;
    if (visual === 'BORRAR') return <span className="text-[9px] md:text-[10px] font-extrabold uppercase text-red-700 bg-red-100 border border-red-200 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md w-fit shrink-0">BORRAR</span>;
    return <span className="text-[9px] md:text-[10px] font-extrabold uppercase text-gray-700 bg-gray-100 border border-gray-200 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md w-fit shrink-0">{visual}</span>;
  };

  const getLogsExpediente = () => {
    if (!selectedUser) return [];
    const logsFiltrados = selectedUser.logs.filter(l => {
      const term = searchDetail.toLowerCase();
      const visualAction = getVisualAction(l.accion).toLowerCase();
      return (l.modulo || '').toLowerCase().includes(term) || 
             (l.detalles || '').toLowerCase().includes(term) ||
             visualAction.includes(term);
    });
    return [...logsFiltrados].reverse();
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
      
      {/* ✨ CABECERA ✨ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 md:mb-6 gap-3">
        <p className="text-[11px] md:text-sm text-gray-500 font-bold px-1 uppercase tracking-wider">
           {esVistaGlobal ? 'Actividad Global' : `Actividad en Sede: ${sucursalActiva?.nombre || 'Ninguna'}`}
        </p>
      </div>

      {/* ✨ CONTROLES DE FECHA Y BÚSQUEDA (Optimizados para móvil) ✨ */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 md:mb-6 bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 gap-3">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 md:bg-transparent p-2 md:p-0 rounded-xl md:rounded-none w-full xl:w-auto">
          
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200">
            <button onClick={handlePrev} disabled={viewMode === 'all'} className="p-2.5 hover:bg-gray-50 text-gray-600 disabled:opacity-30 rounded-l-xl transition-colors"><ChevronLeft size={16}/></button>
            <div className="px-2 min-w-[140px] md:min-w-[160px] text-center font-extrabold text-[10px] md:text-xs text-slate-800 tracking-wider flex items-center justify-center gap-1.5">
              <CalendarDays size={14} className="text-blue-600"/> {getLabelFecha()}
            </div>
            <button onClick={handleNext} disabled={viewMode === 'all'} className="p-2.5 hover:bg-gray-50 text-gray-600 disabled:opacity-30 rounded-r-xl transition-colors"><ChevronRight size={16}/></button>
          </div>
          
          <div className="hidden sm:block h-6 w-px bg-slate-200 mx-1"></div>
          
          <div className="flex gap-1 bg-white sm:bg-transparent p-1 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-gray-200 shadow-sm sm:shadow-none">
            <button onClick={() => {setViewMode('day'); setCurrentDate(new Date());}} className={`flex-1 sm:flex-none px-3 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-colors ${viewMode === 'day' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100'}`}>Día</button>
            <button onClick={() => setViewMode('month')} className={`flex-1 sm:flex-none px-3 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-colors ${viewMode === 'month' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100'}`}>Mes</button>
            <button onClick={() => setViewMode('all')} className={`flex-1 sm:flex-none px-3 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-colors ${viewMode === 'all' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100'}`}>Todo</button>
          </div>
        </div>

        <div className="relative w-full xl:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
          <input 
            type="text" placeholder="Buscar empleado..." 
            className="w-full bg-white border border-gray-200 pl-9 pr-3 py-2.5 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-bold text-gray-800 transition-all shadow-sm"
            value={searchUser} onChange={(e) => setSearchUser(e.target.value)}
          />
        </div>
      </div>

      {/* ✨ VISTA MÓVIL: TARJETAS DE USUARIOS ✨ */}
      <div className="md:hidden flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
             <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
             <p className="text-xs font-medium">Analizando registros...</p>
          </div>
        ) : !sucursalActiva ? (
          <div className="text-center py-10 text-xs text-red-500 bg-red-50 rounded-2xl border border-red-100">
            ⚠️ Sin sucursal asignada.
          </div>
        ) : usuariosMostrados.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center">
            <Activity size={48} className="text-gray-200 mb-3" strokeWidth={1.5}/>
            <p className="text-sm font-bold text-gray-600">Sin actividad registrada</p>
            <p className="text-xs text-gray-400 mt-1">No hay logs para la fecha/sede seleccionada.</p>
          </div>
        ) : (
          usuariosMostrados.map((u) => (
            <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm relative group overflow-hidden">
               <div className="flex justify-between items-start mb-3 border-b border-dashed border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black text-lg overflow-hidden shrink-0 border border-slate-200">
                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover"/> : u.nombre.charAt(0).toUpperCase()}
                     </div>
                     <div className="min-w-0">
                       <p className="font-bold text-gray-800 text-sm leading-tight truncate">{u.nombre}</p>
                       <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{u.rol === 'Administrador' ? 'ADMINISTRADOR' : u.area}</p>
                     </div>
                  </div>
               </div>

               <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 grid grid-cols-2 gap-2">
                  <div className="flex flex-col items-start gap-1 overflow-hidden">
                    <span className="text-[9px] font-extrabold uppercase text-gray-400 tracking-widest">Última Acción</span>
                    {u.ultima_accion ? (
                      <span className="text-[10px] font-bold text-slate-600 truncate flex items-center gap-1"><Clock size={10} className="text-blue-400"/> {formatearFecha(u.ultima_accion)}</span>
                    ) : (
                      <span className="text-[10px] font-medium text-gray-400 italic">Ninguna</span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 overflow-hidden">
                    <span className="text-[9px] font-extrabold uppercase text-gray-400 tracking-widest">Registros</span>
                    <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200">
                      {u.total_acciones} Acciones
                    </span>
                  </div>
               </div>

               {esVistaGlobal && u.rol !== 'Administrador' && (
                 <div className="mb-3">
                   <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded flex items-center gap-1 w-max">
                     <Store size={10}/> {obtenerNombresSucursales(u.sucursales_asignadas)}
                   </span>
                 </div>
               )}

               <button onClick={() => { setSelectedUser(u); setSearchDetail(''); }} className="w-full py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs hover:bg-blue-100 flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                 <Eye size={14}/> Ver Expediente
               </button>
            </div>
          ))
        )}
      </div>

      {/* ✨ VISTA PC: TABLA DE USUARIOS ✨ */}
      <div className="hidden md:block bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold tracking-wider text-[10px] border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Personal</th>
              <th className="px-6 py-4 text-center">Acciones Registradas</th>
              <th className="px-6 py-4">Última Actividad</th>
              <th className="px-6 py-4 text-center">Revisar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan="4" className="text-center py-12 text-gray-400 font-medium">Analizando registros...</td></tr> : 
             !sucursalActiva ? <tr><td colSpan="4" className="text-center py-12 text-red-500 font-medium">⚠️ Sin sucursal asignada.</td></tr> :
             usuariosMostrados.length === 0 ? <tr><td colSpan="4" className="text-center py-12 italic text-gray-400">No hay usuarios con actividad registrada.</td></tr> :
             usuariosMostrados.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-black text-lg overflow-hidden border border-slate-200 shrink-0">
                       {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover"/> : (u.nombre.charAt(0).toUpperCase())}
                     </div>
                     <div>
                       <p className="font-extrabold text-slate-800">{u.nombre}</p>
                       <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">{u.rol === 'Administrador' ? 'ADMINISTRADOR' : u.area}</p>
                       
                       {esVistaGlobal && u.rol !== 'Administrador' && (
                          <p className="text-[9px] uppercase tracking-wider text-purple-600 font-bold mt-1.5 flex items-center gap-1">
                            <Store size={10}/> {obtenerNombresSucursales(u.sucursales_asignadas)}
                          </p>
                       )}
                     </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                   {u.total_acciones > 0 ? (
                     <span className="bg-blue-50 text-blue-700 font-black px-3 py-1.5 rounded-lg text-xs border border-blue-100">{u.total_acciones}</span>
                   ) : (
                     <span className="bg-gray-50 text-gray-400 font-bold px-3 py-1.5 rounded-lg text-xs border border-gray-200">0</span>
                   )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-[11px] font-bold text-slate-500">
                  {u.ultima_accion ? (
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-400"/> {formatearFecha(u.ultima_accion)}</span>
                  ) : (
                    <span className="text-gray-400 italic font-medium">Sin actividad</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setSelectedUser(u); setSearchDetail(''); }} className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm border border-gray-200 hover:border-blue-200 flex items-center gap-1.5">
                      <Eye size={14}/> Expediente
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✨ MODAL EXPEDIENTE (Bottom Sheet Móvil / Modal PC) ✨ */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-[2rem] w-full sm:max-w-5xl flex flex-col h-[90vh] sm:h-[85vh] overflow-hidden animate-fade-in-up border border-white/20 shadow-2xl">
            
            <div className="bg-slate-900 p-5 md:p-6 flex justify-between items-center text-white shrink-0 relative overflow-hidden">
               <div className="w-12 h-1.5 bg-white/20 rounded-full absolute top-2 left-1/2 -translate-x-1/2 sm:hidden z-20"></div>
               <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
               
               <div className="flex items-center gap-3 md:gap-4 z-10 mt-2 sm:mt-0">
                 <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center font-black text-lg md:text-xl border border-white/20 overflow-hidden shrink-0">
                   {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full object-cover"/> : selectedUser.nombre.charAt(0).toUpperCase()}
                 </div>
                 <div className="min-w-0">
                   <h2 className="text-sm md:text-xl font-black tracking-tight truncate pr-4">Expediente: {selectedUser.nombre}</h2>
                   <p className="text-[10px] md:text-xs text-blue-200 font-bold tracking-widest uppercase mt-0.5 flex items-center gap-1"><CalendarDays size={10}/> {getLabelFecha()}</p>
                 </div>
               </div>
               <button onClick={() => setSelectedUser(null)} className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full backdrop-blur-sm transition-colors z-10 shrink-0"><X size={18}/></button>
            </div>

            <div className="bg-white border-b border-gray-100 p-3 md:p-4 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                <input 
                  type="text" placeholder="Buscar por módulo, acción o detalle..." 
                  className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-xs md:text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-bold text-gray-800 transition-all shadow-sm"
                  value={searchDetail} onChange={(e) => setSearchDetail(e.target.value)}
                />
              </div>
              <div className="text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 self-end md:self-auto">
                Mostrando: <span className="text-blue-600">{getLogsExpediente().length} Registros</span>
              </div>
            </div>

            {/* ✨ LISTA TIPO TIMELINE (Móvil) / TABLA (PC) ✨ */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              
              {/* Móvil: Timeline (Tarjetas) */}
              <div className="md:hidden p-3 space-y-3">
                {getLogsExpediente().length === 0 ? (
                   <div className="text-center py-10 text-gray-400 italic text-xs font-bold">No hay registros que coincidan.</div>
                ) : (
                  getLogsExpediente().map((log) => (
                    <div key={log.id} onClick={() => setLogDetail(log)} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-2 relative active:scale-[0.98] transition-transform">
                       <div className="flex justify-between items-start">
                         <div className="flex items-center gap-1.5">
                           {getActionPill(log.accion)}
                           <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 truncate max-w-[120px]">{log.modulo}</span>
                         </div>
                         <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 shrink-0"><Clock size={10}/> {formatearFecha(log.created_at, viewMode === 'day')}</span>
                       </div>
                       <p className="text-[11px] font-medium text-slate-600 line-clamp-2 leading-snug">{log.detalles}</p>
                    </div>
                  ))
                )}
              </div>

              {/* PC: Tabla */}
              <div className="hidden md:block w-full h-full">
                <table className="w-full text-left text-sm text-gray-600 border-collapse">
                  <thead className="sticky top-0 z-30 bg-white shadow-sm">
                    <tr>
                      <th className="px-6 py-3 border-b border-gray-100 text-[10px] uppercase font-extrabold text-gray-400 tracking-wider w-[15%]">Hora</th>
                      <th className="px-6 py-3 border-b border-gray-100 text-[10px] uppercase font-extrabold text-gray-400 tracking-wider w-[15%]">Módulo</th>
                      <th className="px-6 py-3 border-b border-gray-100 text-[10px] uppercase font-extrabold text-gray-400 tracking-wider w-[15%]">Acción</th>
                      <th className="px-6 py-3 border-b border-gray-100 text-[10px] uppercase font-extrabold text-gray-400 tracking-wider w-[45%]">Vista Previa</th>
                      <th className="px-6 py-3 border-b border-gray-100 text-[10px] uppercase font-extrabold text-gray-400 tracking-wider w-[10%] text-center">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 relative z-0 bg-white">
                    {getLogsExpediente().length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-12 text-gray-400 italic font-bold text-xs">No se encontraron registros.</td></tr>
                    ) : (
                      getLogsExpediente().map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => setLogDetail(log)}>
                          <td className="px-6 py-4 text-[11px] font-bold text-slate-500">{formatearFecha(log.created_at, viewMode === 'day')}</td>
                          <td className="px-6 py-4 font-black text-slate-700 text-xs">{log.modulo}</td>
                          <td className="px-6 py-4">{getActionPill(log.accion)}</td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-500 truncate max-w-[300px] xl:max-w-md" title={log.detalles}>{log.detalles}</td>
                          <td className="px-6 py-4 text-center">
                            <button className="p-1.5 text-blue-400 group-hover:text-blue-600 bg-blue-50 group-hover:bg-blue-100 rounded-lg transition-colors shadow-sm" title="Ver Detalle Técnico">
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
            <div className="p-3 bg-white border-t border-gray-100 sm:hidden shrink-0">
               <button onClick={() => setSelectedUser(null)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-xs">Cerrar Expediente</button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ MODAL DETALLE TÉCNICO DEL LOG (Bottom Sheet) ✨ */}
      {logDetail && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md p-6 sm:p-8 border border-white/50 animate-fade-in-up relative pb-8 sm:pb-8 flex flex-col max-h-[80vh]">
            <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>
            <button onClick={() => setLogDetail(null)} className="absolute top-4 right-4 sm:top-5 sm:right-5 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-800 p-1.5 rounded-full transition-colors"><X size={16}/></button>
            
            <div className="shrink-0">
              <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1 border-b border-dashed border-gray-200 pb-2">Reporte Técnico</h3>
              <div className="flex items-center gap-2 mt-3 mb-4 flex-wrap">
                 {getActionPill(logDetail.accion)}
                 <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{logDetail.modulo}</span>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-inner overflow-y-auto custom-scrollbar flex-1">
               <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed break-words">
                 {logDetail.detalles}
               </p>
            </div>

            <p className="text-[9px] text-gray-400 text-center mt-5 font-bold tracking-widest flex justify-center items-center gap-1 shrink-0">
               <Clock size={10}/> TIMESTAMP: {formatearFecha(logDetail.created_at)}
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Auditoria;