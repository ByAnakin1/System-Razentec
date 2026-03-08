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

  // ✨ SEMÁFORO Y VISTA GLOBAL
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
    // ✨ ESCUCHADOR PARA RECARGAR EL FILTRO AL CAMBIAR DE LOCAL ARRIBA
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

  // Helper Seguro
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

  // ✨ FILTRO ESTRICTO PARA LA AUDITORÍA
  let usuariosMostrados = Object.values(userMap).filter(u => {
    // 1. Filtro de Búsqueda Textual
    const coincideTexto = u.nombre.toLowerCase().includes(searchUser.toLowerCase()) || 
                          u.area.toLowerCase().includes(searchUser.toLowerCase());
    
    if (!coincideTexto) return false;

    // 2. Filtro de Sucursal
    if (esVistaGlobal) return true;
    if (!sucursalActiva) return false;

    const asignadas = parseJsonArray(u.sucursales_asignadas).map(id => parseInt(id, 10));
    const perteneceASucursal = asignadas.includes(parseInt(sucursalActiva.id, 10));

    // Si es Administrador, aparece en todos los historiales porque tiene poder global
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
    if (visual === 'ENTRADA') return <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded w-fit"><LogIn size={12}/> ENTRADA</span>;
    if (visual === 'SALIDA') return <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded w-fit"><LogOut size={12}/> SALIDA</span>;
    if (visual === 'CREAR') return <span className="text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded w-fit">CREAR</span>;
    if (visual === 'EDITAR') return <span className="text-[10px] font-extrabold uppercase text-blue-700 bg-blue-100 border border-blue-200 px-2 py-1 rounded w-fit">EDITAR</span>;
    if (visual === 'BORRAR') return <span className="text-[10px] font-extrabold uppercase text-red-700 bg-red-100 border border-red-200 px-2 py-1 rounded w-fit">BORRAR</span>;
    return <span className="text-[10px] font-extrabold uppercase text-gray-700 bg-gray-100 border border-gray-200 px-2 py-1 rounded w-fit">{visual}</span>;
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
    <Layout>
      <div className="mb-5 px-1">
        <h1 className="text-2xl font-extrabold flex items-center gap-2 text-gray-800"><Activity className="text-blue-600" /> Auditoría del Personal</h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          {esVistaGlobal ? 'Viendo la actividad de todos los usuarios de la empresa.' : `Viendo actividad del personal de: ${sucursalActiva?.nombre || '...'}`}
        </p>
      </div>

      <div className="flex flex-col xl:flex-row justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 gap-4">
        
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full xl:w-auto justify-between xl:justify-start">
          <div className="flex items-center bg-white rounded-lg shadow-sm">
            <button onClick={handlePrev} disabled={viewMode === 'all'} className="p-2 hover:bg-gray-50 text-gray-600 disabled:opacity-30 rounded-l-lg transition-colors"><ChevronLeft size={18}/></button>
            <div className="px-4 py-1.5 min-w-[160px] text-center font-bold text-xs text-slate-800 tracking-wide flex items-center justify-center gap-2">
              <CalendarDays size={14} className="text-blue-600"/> {getLabelFecha()}
            </div>
            <button onClick={handleNext} disabled={viewMode === 'all'} className="p-2 hover:bg-gray-50 text-gray-600 disabled:opacity-30 rounded-r-lg transition-colors"><ChevronRight size={18}/></button>
          </div>
          <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block"></div>
          <div className="flex gap-1">
            <button onClick={() => {setViewMode('day'); setCurrentDate(new Date());}} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'day' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>Día</button>
            <button onClick={() => setViewMode('month')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'month' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>Mes</button>
            <button onClick={() => setViewMode('all')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${viewMode === 'all' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}>Todo</button>
          </div>
        </div>

        <div className="relative w-full xl:w-72">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
          <input 
            type="text" placeholder="Buscar empleado o rol..." 
            className="w-full bg-slate-50 border border-gray-200 pl-9 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-shadow"
            value={searchUser} onChange={(e) => setSearchUser(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">Personal</th>
              <th className="px-6 py-4 text-center">Acciones Registradas</th>
              <th className="px-6 py-4">Última Actividad</th>
              <th className="px-6 py-4 text-center">Revisar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <tr><td colSpan="4" className="text-center py-10 font-medium">Analizando registros...</td></tr> : 
             !sucursalActiva ? <tr><td colSpan="4" className="text-center py-10 text-red-500 font-medium bg-red-50">⚠️ No se ha detectado sucursal.</td></tr> :
             usuariosMostrados.length === 0 ? <tr><td colSpan="4" className="text-center py-10 text-gray-400">No hay usuarios con actividad registrada en este local.</td></tr> :
             usuariosMostrados.map((u) => (
              <tr key={u.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm overflow-hidden shadow-sm border border-blue-200 shrink-0">
                       {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover"/> : (u.nombre.charAt(0).toUpperCase())}
                     </div>
                     <div>
                       <p className="font-extrabold text-slate-800">{u.nombre}</p>
                       <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{u.rol === 'Administrador' ? 'ADMINISTRADOR' : u.area}</p>
                       
                       {esVistaGlobal && u.rol !== 'Administrador' && (
                          <p className="text-[9px] uppercase tracking-wider text-purple-600 font-bold mt-1 flex items-center gap-1">
                            <Store size={10}/> {obtenerNombresSucursales(u.sucursales_asignadas)}
                          </p>
                       )}
                     </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                   {u.total_acciones > 0 ? (
                     <span className="bg-blue-100 text-blue-700 font-extrabold px-3 py-1 rounded-full text-xs border border-blue-200">{u.total_acciones}</span>
                   ) : (
                     <span className="bg-gray-100 text-gray-400 font-bold px-3 py-1 rounded-full text-xs border border-gray-200">0</span>
                   )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500">
                  {u.ultima_accion ? (
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-400"/> {formatearFecha(u.ultima_accion)}</span>
                  ) : (
                    <span className="text-gray-400 italic font-medium">Sin actividad</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => { setSelectedUser(u); setSearchDetail(''); }} className="bg-slate-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm border border-slate-200 hover:border-blue-600">
                    Ver Expediente
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md transition-all p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col h-[85vh] overflow-hidden animate-fade-in-up border border-white/20">
            
            <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0 relative overflow-hidden">
               <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
               <div className="flex items-center gap-4 z-10">
                 <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-xl border border-white/20 overflow-hidden">
                   {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full object-cover"/> : selectedUser.nombre.charAt(0).toUpperCase()}
                 </div>
                 <div>
                   <h2 className="text-xl font-extrabold tracking-tight">Expediente: {selectedUser.nombre}</h2>
                   <p className="text-xs text-blue-200 font-medium tracking-wider uppercase mt-0.5">{getLabelFecha()}</p>
                 </div>
               </div>
               <button onClick={() => setSelectedUser(null)} className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full backdrop-blur-sm transition-colors z-10"><X size={20}/></button>
            </div>

            <div className="bg-slate-50 border-b border-gray-200 p-4 shrink-0 flex justify-between items-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                <input 
                  type="text" placeholder="Buscar por módulo, acción o detalle..." 
                  className="w-full bg-white border border-gray-200 pl-9 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-sm"
                  value={searchDetail} onChange={(e) => setSearchDetail(e.target.value)}
                />
              </div>
              <div className="text-xs font-bold text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                Total Visibles: {getLogsExpediente().length}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-white relative rounded-b-3xl">
              <table className="w-full text-left text-sm text-gray-600 border-collapse">
                <thead>
                  <tr>
                    <th className="sticky top-0 z-30 bg-white px-6 py-4 border-b border-gray-200 text-[10px] uppercase font-extrabold text-gray-400 tracking-wider w-[15%] shadow-sm">Hora</th>
                    <th className="sticky top-0 z-30 bg-white px-6 py-4 border-b border-gray-200 text-[10px] uppercase font-extrabold text-gray-400 tracking-wider w-[15%] shadow-sm">Módulo</th>
                    <th className="sticky top-0 z-30 bg-white px-6 py-4 border-b border-gray-200 text-[10px] uppercase font-extrabold text-gray-400 tracking-wider w-[15%] shadow-sm">Acción</th>
                    <th className="sticky top-0 z-30 bg-white px-6 py-4 border-b border-gray-200 text-[10px] uppercase font-extrabold text-gray-400 tracking-wider w-[45%] shadow-sm">Vista Previa</th>
                    <th className="sticky top-0 z-30 bg-white px-6 py-4 border-b border-gray-200 text-[10px] uppercase font-extrabold text-gray-400 tracking-wider w-[10%] text-center shadow-sm">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 relative z-0">
                  {getLogsExpediente().length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">No se encontraron registros que coincidan con la búsqueda.</td></tr>
                  ) : (
                    getLogsExpediente().map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{formatearFecha(log.created_at, viewMode === 'day')}</td>
                        <td className="px-6 py-4 font-extrabold text-slate-700">{log.modulo}</td>
                        <td className="px-6 py-4">{getActionPill(log.accion)}</td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-500 truncate max-w-md" title={log.detalles}>{log.detalles}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => setLogDetail(log)} className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-colors shadow-sm" title="Ver Detalle Técnico">
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
        </div>
      )}

      {logDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-white/50 animate-fade-in-up relative">
            <button onClick={() => setLogDetail(null)} className="absolute top-4 right-4 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 p-1.5 rounded-full transition-colors"><X size={18}/></button>
            
            <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1 border-b pb-2">Reporte Técnico Generado</h3>
            <div className="flex items-center gap-2 mt-4 mb-4">
               {getActionPill(logDetail.accion)}
               <span className="text-xs font-bold text-gray-400">• {logDetail.modulo}</span>
            </div>
            
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-inner">
               <p className="text-sm font-medium text-slate-700 leading-relaxed">
                 {logDetail.detalles}
               </p>
            </div>

            <p className="text-[10px] text-gray-400 text-center mt-6 font-bold tracking-widest flex justify-center items-center gap-1">
               <Clock size={12}/> TIMESTAMP: {formatearFecha(logDetail.created_at)}
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Auditoria;