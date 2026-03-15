import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Plus, Trash2, X, AlertTriangle, UserPlus, Eye, Edit, ShieldCheck, Search, Store, CheckCircle } from 'lucide-react';
import { CATEGORIA_A_RUTA } from '../config/menuConfig';

const ROLES = ['Supervisor', 'Empleado'];
const MODULOS = Object.keys(CATEGORIA_A_RUTA);

// Componente ToggleSwitch rediseñado (más suave y moderno)
const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <div onClick={() => !disabled && onChange()} className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ease-in-out ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${checked ? 'bg-emerald-500 shadow-inner' : 'bg-slate-200'}`}>
    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
  </div>
);

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [empleadosDisponibles, setEmpleadosDisponibles] = useState([]); 
  const [sucursales, setSucursales] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [usuarioActual, setUsuarioActual] = useState(null);
  
  const [busqueda, setBusqueda] = useState('');

  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalles, setModalDetalles] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [permisosLocales, setPermisosLocales] = useState({ view: {}, mod: {} });

  const [formCrear, setFormCrear] = useState({ empleado_id: '', area_cargo: '', email: '', password: '', rol: 'Empleado', admin_password: '', sucursales_asignadas: [] });
  const [formEditar, setFormEditar] = useState({ nombre_completo: '', area_cargo: '', email: '', rol: 'Empleado', nueva_password: '', admin_password: '', sucursales_asignadas: [] });
  const [errores, setErrores] = useState({});

  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);
  const esVistaGlobal = sucursalActiva?.id === 'ALL';

  const esAdmin = () => usuarioActual?.rol === 'Administrador';
  
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

  const categoriasArray = (u) => parseJsonArray(u?.categorias);
  const tieneView = (u, mod) => categoriasArray(u).includes(mod);
  const tieneModificador = (u, mod) => categoriasArray(u).includes('Modificador') || categoriasArray(u).includes(`Modificador_${mod}`);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await api.get('/auth/me');
        setUsuarioActual(res.data);
      } catch {
        setUsuarioActual(JSON.parse(localStorage.getItem('usuario') || '{}'));
      }
    };
    loadMe();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const [resUsuarios, resEmpleados, resSucs] = await Promise.all([
        api.get('/usuarios'), api.get('/empleados'), api.get('/sucursales')
      ]);
      setUsuarios(resUsuarios.data);
      setEmpleadosDisponibles(resEmpleados.data.filter(e => !e.correo_corporativo));
      setSucursales(resSucs.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchUsuarios(); 
    const handleSucursalCambiada = () => {
      setSucursalActiva(JSON.parse(localStorage.getItem('sucursalActiva')));
    };
    window.addEventListener('sucursalCambiada', handleSucursalCambiada);
    return () => window.removeEventListener('sucursalCambiada', handleSucursalCambiada);
  }, []);

  const usuariosFiltrados = usuarios.filter(u => {
    const coincideTexto = (u.nombre_completo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                          (u.area_cargo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(busqueda.toLowerCase());

    if (!coincideTexto) return false;

    if (esVistaGlobal) return true; 
    if (!sucursalActiva) return false;

    const asignadas = parseJsonArray(u.sucursales_asignadas).map(id => parseInt(id, 10));
    const perteneceASucursal = asignadas.includes(parseInt(sucursalActiva.id, 10));

    return perteneceASucursal || u.rol === 'Administrador';
  });

  const openModalDetalles = (u) => {
    setUsuarioSeleccionado(u);
    setModalDetalles(true);
  };

  const handleOpenCrear = () => {
    setFormCrear({ empleado_id: '', area_cargo: '', email: '', password: '', rol: 'Empleado', admin_password: '', sucursales_asignadas: [] });
    setPermisosLocales({ view: {}, mod: {} });
    setErrores({});
    setModalCrear(true);
  };

  const openModalEditar = (u) => {
    setUsuarioSeleccionado(u);
    const arrAsignadas = parseJsonArray(u.sucursales_asignadas);

    setFormEditar({ 
      nombre_completo: u.nombre_completo, area_cargo: u.area_cargo || '', email: u.email, 
      rol: u.rol || 'Empleado', nueva_password: '', admin_password: '', sucursales_asignadas: arrAsignadas 
    });
    const view = {}; const mod = {};
    MODULOS.forEach(m => { view[m] = tieneView(u, m); mod[m] = tieneModificador(u, m); });
    setPermisosLocales({ view, mod });
    setErrores({});
    setModalEditar(true);
  };

  const validarUsuario = (isCreate) => {
    let nuevosErrores = {};
    const data = isCreate ? formCrear : formEditar;

    if (isCreate && !data.empleado_id) nuevosErrores.empleado_id = "Debes vincular a una persona física.";
    if (!data.area_cargo.trim()) nuevosErrores.area_cargo = "El área/cargo es obligatorio para identificarlo.";
    if (!/^\S+@\S+\.\S+$/.test(data.email)) nuevosErrores.email = "Formato de correo no válido.";
    if (isCreate && data.password.length < 6) nuevosErrores.password = "Mínimo 6 caracteres.";
    if (!isCreate && data.nueva_password && data.nueva_password.length > 0 && data.nueva_password.length < 6) nuevosErrores.nueva_password = "Mínimo 6 caracteres.";
    if (!data.admin_password) nuevosErrores.admin_password = "Se requiere tu firma digital (contraseña).";

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const togglePermiso = (tipo, modulo) => {
    setPermisosLocales(prev => {
      const isCurrentlyActive = prev[tipo][modulo];
      const newState = { ...prev };
      if (tipo === 'view') {
        newState.view = { ...prev.view, [modulo]: !isCurrentlyActive };
        if (isCurrentlyActive) newState.mod = { ...prev.mod, [modulo]: false };
      } else if (tipo === 'mod') {
        if (!isCurrentlyActive && !prev.view[modulo]) return prev; 
        newState.mod = { ...prev.mod, [modulo]: !isCurrentlyActive };
      }
      return newState;
    });
  };

  const procesarCategoriasParaGuardar = () => {
    const cat = [];
    Object.entries(permisosLocales.view || {}).forEach(([mod, v]) => { if (v) cat.push(mod); });
    Object.entries(permisosLocales.mod || {}).forEach(([mod, v]) => { if (v) cat.push(`Modificador_${mod}`); });
    return [...new Set(cat)];
  };

  const handleGuardarEditarCompleto = async (e) => {
    e.preventDefault();
    if (!validarUsuario(false)) return;

    try {
      await api.put(`/usuarios/${usuarioSeleccionado.id}`, {
        email: formEditar.email, rol: formEditar.rol, area_cargo: formEditar.area_cargo,
        categorias: procesarCategoriasParaGuardar(), nueva_password: formEditar.nueva_password, admin_password: formEditar.admin_password,
        sucursales_asignadas: formEditar.sucursales_asignadas 
      });
      setModalEditar(false); fetchUsuarios();
    } catch (err) { alert(err.response?.data?.error || 'Error al guardar los cambios.'); }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!validarUsuario(true)) return;

    try {
      await api.post('/usuarios', {
        empleado_id: formCrear.empleado_id, area_cargo: formCrear.area_cargo, email: formCrear.email,
        password: formCrear.password, rol: formCrear.rol, categorias: procesarCategoriasParaGuardar(), admin_password: formCrear.admin_password,
        sucursales_asignadas: formCrear.sucursales_asignadas 
      });
      setModalCrear(false); fetchUsuarios();
    } catch (err) { alert(err.response?.data?.error || 'Error al crear.'); }
  };

  const handleEliminar = async () => {
    if (!usuarioSeleccionado) return;
    try { await api.delete(`/usuarios/${usuarioSeleccionado.id}`); setModalEliminar(false); fetchUsuarios(); } catch (err) { alert(err.response?.data?.error || 'Error al eliminar'); }
  };

  const obtenerNombresSucursales = (arrStr) => {
    const arr = parseJsonArray(arrStr);
    if (arr.length === 0) return 'Ninguna';
    const nombres = arr.map(id => sucursales.find(s => s.id === parseInt(id))?.nombre).filter(Boolean);
    if (nombres.length === sucursales.length && sucursales.length > 0) return 'Todas las sucursales';
    return nombres.join(', ') || 'Desconocida';
  };

  return (
    <Layout title="Cuentas de Acceso" moduleIcon={<UserPlus/>}>
      
      {/* ✨ CABECERA ✨ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 md:mb-6 gap-3">
        <p className="text-[11px] md:text-sm text-gray-500 font-bold px-1 uppercase tracking-wider">
           {esVistaGlobal ? 'Administración Global' : `Cuentas de Sede: ${sucursalActiva?.nombre || 'Ninguna'}`}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
            <input type="text" placeholder="Buscar usuario o correo..." className="w-full bg-white border border-gray-200 pl-9 pr-4 py-2.5 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-bold text-gray-800 transition-all shadow-sm" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          {esAdmin() && (
            <button onClick={handleOpenCrear} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-bold shadow-md text-xs md:text-sm">
              <Plus size={16} /> <span className="hidden md:inline">Nueva Credencial</span><span className="md:hidden">Nuevo</span>
            </button>
          )}
        </div>
      </div>

      {/* ✨ VISTA MÓVIL: TARJETAS DE USUARIOS ✨ */}
      <div className="md:hidden flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
             <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
             <p className="text-xs font-medium">Cargando cuentas...</p>
          </div>
        ) : !sucursalActiva ? (
          <div className="text-center py-10 text-xs text-red-500 bg-red-50 rounded-2xl border border-red-100">
            ⚠️ Sin sucursal asignada.
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center">
            <UserPlus size={48} className="text-gray-200 mb-3" strokeWidth={1.5}/>
            <p className="text-sm font-bold text-gray-600">No se encontraron cuentas</p>
          </div>
        ) : (
          usuariosFiltrados.map((u) => (
            <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm relative group overflow-hidden">
               <div className="flex justify-between items-start mb-3 border-b border-dashed border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg overflow-hidden shrink-0 border border-blue-100">
                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover"/> : (u.area_cargo || u.nombre_completo)?.charAt(0).toUpperCase()}
                     </div>
                     <div className="min-w-0">
                       <p className="font-extrabold text-gray-800 text-sm leading-tight truncate">{u.rol === 'Administrador' ? 'Administrador' : (u.area_cargo || 'Sin designar')}</p>
                       <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mt-0.5 truncate">Vinculado a: {u.nombre_completo}</p>
                     </div>
                  </div>
               </div>

               <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                     <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${u.rol === 'Administrador' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                        {u.rol}
                     </span>
                     <span className="text-[10px] font-bold text-gray-500 truncate max-w-[150px]">{u.email}</span>
                  </div>
                  {u.rol !== 'Administrador' && (
                    <div className="flex items-center gap-1.5 overflow-hidden mt-1 pt-1.5 border-t border-gray-100">
                      <Store size={12} className="text-emerald-500 shrink-0"/>
                      <span className="text-[9px] font-bold text-emerald-700 truncate px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100" title={obtenerNombresSucursales(u.sucursales_asignadas)}>
                        Sedes: {obtenerNombresSucursales(u.sucursales_asignadas)}
                      </span>
                    </div>
                  )}
               </div>

               <div className="flex gap-2">
                 <button onClick={() => openModalDetalles(u)} className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-100 flex items-center justify-center transition-colors">
                   <Eye size={16}/>
                 </button>
                 {esAdmin() && usuarioActual?.id !== u.id && (
                   <>
                     <button onClick={() => openModalEditar(u)} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs hover:bg-blue-100 flex items-center justify-center transition-colors">
                       <Edit size={16}/>
                     </button>
                     <button onClick={() => { setUsuarioSeleccionado(u); setModalEliminar(true); }} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors">
                       <Trash2 size={16}/>
                     </button>
                   </>
                 )}
               </div>
            </div>
          ))
        )}
      </div>

      {/* ✨ VISTA PC: TABLA DE USUARIOS ✨ */}
      <div className="hidden md:block bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold tracking-wider text-[10px] border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Designación en Sistema</th>
              <th className="px-6 py-4">Correo Login</th>
              <th className="px-6 py-4">Permiso de Locales</th>
              <th className="px-6 py-4 text-center">Nivel</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan="5" className="text-center py-12 text-gray-400 font-medium">Cargando cuentas...</td></tr> : 
             !sucursalActiva ? <tr><td colSpan="5" className="text-center py-12 text-red-500 font-medium">⚠️ Sin sucursal asignada.</td></tr> :
             usuariosFiltrados.length === 0 ? <tr><td colSpan="5" className="text-center py-12 italic text-gray-400">No hay cuentas asignadas a esta vista.</td></tr> :
             usuariosFiltrados.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg overflow-hidden flex-shrink-0 border border-blue-100">
                       {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover"/> : (u.area_cargo || u.nombre_completo)?.charAt(0).toUpperCase()}
                     </div>
                     <div>
                       <p className="font-extrabold text-gray-900">{u.rol === 'Administrador' ? 'Administrador' : (u.area_cargo || 'Sin designar')}</p>
                       <p className="text-[10px] font-bold text-gray-400 truncate mt-0.5">Vinc: {u.nombre_completo}</p>
                     </div>
                   </div>
                </td>
                <td className="px-6 py-4 font-bold text-slate-600">{u.email}</td>
                
                <td className="px-6 py-4">
                  {u.rol === 'Administrador' ? (
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded">Global (Todas las sedes)</span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded line-clamp-1 max-w-[150px]" title={obtenerNombresSucursales(u.sucursales_asignadas)}>
                      {obtenerNombresSucursales(u.sucursales_asignadas)}
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 text-center">
                  <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${u.rol === 'Administrador' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                    {u.rol}
                  </span>
                </td>

                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModalDetalles(u)} className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-200 rounded-lg transition-colors" title="Ver Permisos"><Eye size={16} /></button>
                    {esAdmin() && usuarioActual?.id !== u.id && (
                      <>
                        <button onClick={() => openModalEditar(u)} className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Editar Accesos"><Edit size={16} /></button>
                        <button onClick={() => { setUsuarioSeleccionado(u); setModalEliminar(true); }} className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Revocar Acceso"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✨ MODAL DETALLES DE ACCESO (Bottom Sheet Móvil) ✨ */}
      {modalDetalles && usuarioSeleccionado && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-md transition-all animate-fade-in">
          <div className="bg-white p-6 sm:p-8 rounded-t-3xl sm:rounded-[2rem] w-full sm:max-w-md shadow-2xl border border-white/50 animate-fade-in-up pb-8 flex flex-col max-h-[90vh]">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3 shrink-0">
              <h2 className="text-lg md:text-xl font-extrabold text-gray-800 flex items-center gap-2"><ShieldCheck className="text-emerald-500"/> Ficha de Acceso</h2>
              <button onClick={() => setModalDetalles(false)} className="text-gray-400 hover:text-gray-800 bg-gray-50 p-1.5 rounded-full"><X size={18}/></button>
            </div>
            
            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 pb-4">
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xl border border-blue-200">
                   {usuarioSeleccionado.avatar ? <img src={usuarioSeleccionado.avatar} className="w-full h-full object-cover rounded-xl"/> : (usuarioSeleccionado.area_cargo || usuarioSeleccionado.nombre_completo)?.charAt(0).toUpperCase()}
                </div>
                <div>
                   <p className="font-black text-gray-800 text-sm">{usuarioSeleccionado.rol === 'Administrador' ? 'Administrador' : (usuarioSeleccionado.area_cargo || 'Sin designar')}</p>
                   <p className="text-[10px] font-bold text-gray-500 mt-0.5">Física: {usuarioSeleccionado.nombre_completo}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                   <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Nivel / Rol</label>
                   <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${usuarioSeleccionado.rol === 'Administrador' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                     {usuarioSeleccionado.rol}
                   </span>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                   <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Sedes Activas</label>
                   <p className="text-xs font-bold text-emerald-600 truncate">{usuarioSeleccionado.rol === 'Administrador' ? 'Global (Todas)' : obtenerNombresSucursales(usuarioSeleccionado.sucursales_asignadas)}</p>
                 </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Correo Login</label>
                <p className="text-sm font-bold text-gray-700 bg-slate-50 p-3 rounded-xl border border-slate-100">{usuarioSeleccionado.email}</p>
              </div>

              <div className="pt-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 border-l-4 border-blue-500 pl-1.5">Módulos Autorizados</label>
                <div className="flex flex-wrap gap-2">
                  {MODULOS.filter(m => tieneView(usuarioSeleccionado, m)).length > 0 ? (
                    MODULOS.filter(m => tieneView(usuarioSeleccionado, m)).map(m => (
                      <span key={m} className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm"><Eye size={12}/> {m}</span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic font-medium bg-slate-50 px-4 py-2 rounded-xl w-full text-center border border-dashed border-gray-200">No tiene permisos asignados.</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => setModalDetalles(false)} className="w-full mt-4 shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3.5 rounded-xl font-bold transition-colors text-sm">Cerrar Ficha</button>
          </div>
        </div>
      )}

      {/* ✨ MODAL EDITAR Y CREAR CREDENCIAL (Bottom Sheet Extendido en Móvil) ✨ */}
      {(modalEditar || modalCrear) && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-[2rem] w-full sm:max-w-4xl max-h-[95vh] flex flex-col overflow-hidden border border-white/50 shadow-2xl animate-fade-in-up">
            
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 sm:hidden shrink-0"></div>
            
            <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-white z-10 shrink-0">
              <h2 className="text-lg md:text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                {modalCrear ? <UserPlus className="text-blue-600"/> : <Edit className="text-yellow-500"/>}
                {modalCrear ? 'Crear Credencial de Empleado' : 'Editar Accesos y Permisos'}
              </h2>
              <button onClick={() => modalCrear ? setModalCrear(false) : setModalEditar(false)} className="bg-gray-50 hover:bg-gray-100 p-2 rounded-full text-gray-500 transition-colors"><X size={18}/></button>
            </div>
            
            <form onSubmit={modalCrear ? handleCrear : handleGuardarEditarCompleto} className="overflow-y-auto p-4 md:p-8 bg-slate-50/50 space-y-6 md:space-y-8 flex-1 custom-scrollbar">
              
              <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-sm">
                <h3 className="font-extrabold text-gray-800 mb-4 md:mb-5 border-b border-dashed border-gray-100 pb-2 text-sm md:text-base">Identidad en el Sistema</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5 block">Vincular a Empleado</label>
                    {modalCrear ? (
                      <select className={`w-full bg-slate-50 border p-3.5 rounded-xl outline-none font-bold text-gray-700 text-sm transition-colors ${errores.empleado_id ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`} value={formCrear.empleado_id} onChange={e => setFormCrear({...formCrear, empleado_id: e.target.value})}>
                        <option value="">-- Seleccione del Staff --</option>
                        {empleadosDisponibles.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre_completo}</option>)}
                      </select>
                    ) : (
                      <input className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50 text-gray-500 font-bold text-sm" value={formEditar.nombre_completo} disabled />
                    )}
                    {errores.empleado_id && <p className="text-[10px] text-red-500 mt-1 font-bold">{errores.empleado_id}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5 block">Área o Cargo</label>
                    <input type="text" className={`w-full bg-blue-50/50 border p-3.5 rounded-xl outline-none font-bold text-blue-800 text-sm transition-colors ${errores.area_cargo ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-blue-100 focus:ring-2 focus:ring-blue-200 focus:border-blue-500'}`} value={modalCrear ? formCrear.area_cargo : formEditar.area_cargo} onChange={e => modalCrear ? setFormCrear({...formCrear, area_cargo: e.target.value}) : setFormEditar({...formEditar, area_cargo: e.target.value})} placeholder="Ej: Cajero Turno Mañana"/>
                    {errores.area_cargo && <p className="text-[10px] text-red-500 mt-1 font-bold">{errores.area_cargo}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5 block">Correo Corporativo (Login)</label>
                    <input type="email" className={`w-full bg-slate-50 border p-3.5 rounded-xl outline-none font-bold text-gray-700 text-sm transition-colors ${errores.email ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`} value={modalCrear ? formCrear.email : formEditar.email} onChange={e => modalCrear ? setFormCrear({...formCrear, email: e.target.value}) : setFormEditar({...formEditar, email: e.target.value})} placeholder="usuario@empresa.com"/>
                    {errores.email && <p className="text-[10px] text-red-500 mt-1 font-bold">{errores.email}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5 block">Nivel de Privilegios (Rol)</label>
                    <select className="w-full bg-slate-50 border border-gray-200 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-bold text-gray-800 text-sm transition-colors" value={modalCrear ? formCrear.rol : formEditar.rol} onChange={e => {
                      const nuevoRol = e.target.value;
                      if(modalCrear) setFormCrear({...formCrear, rol: nuevoRol}); else setFormEditar({...formEditar, rol: nuevoRol});
                    }}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                {/* ASIGNACIÓN DE SUCURSALES */}
                {(modalCrear ? formCrear.rol : formEditar.rol) !== 'Administrador' && (
                  <div className="mt-6 md:mt-8 bg-purple-50/50 p-4 md:p-5 rounded-2xl border border-purple-100">
                    <label className="text-xs md:text-sm font-extrabold text-purple-700 uppercase flex items-center gap-2 mb-1"><Store size={16}/> Locales Autorizados</label>
                    <p className="text-[10px] md:text-[11px] font-bold text-purple-600/80 mb-4">Selecciona las sucursales donde este usuario podrá operar.</p>
                    
                    {sucursales.length === 0 ? <p className="text-xs italic text-gray-400 font-medium">No hay sucursales registradas aún.</p> : (
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3">
                        {sucursales.map(suc => {
                          const arregloActual = modalCrear ? formCrear.sucursales_asignadas : formEditar.sucursales_asignadas;
                          const isChecked = arregloActual.includes(suc.id);
                          return (
                            <label key={suc.id} className={`flex items-center gap-2.5 p-2.5 md:p-3 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-purple-600 text-white border-purple-700 shadow-md shadow-purple-600/20' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 shadow-sm'}`}>
                              <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={isChecked}
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  let nuevoArreglo = [...arregloActual];
                                  if (val) nuevoArreglo.push(suc.id);
                                  else nuevoArreglo = nuevoArreglo.filter(id => id !== suc.id);
                                  
                                  if (modalCrear) setFormCrear({...formCrear, sucursales_asignadas: nuevoArreglo});
                                  else setFormEditar({...formEditar, sucursales_asignadas: nuevoArreglo});
                                }}
                              />
                              <div className={`w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded border shrink-0 transition-colors ${isChecked ? 'bg-white border-white' : 'bg-gray-50 border-gray-300'}`}>
                                {isChecked && <CheckCircle size={14} className="text-purple-600" strokeWidth={3}/>}
                              </div>
                              <span className="text-[10px] md:text-xs font-bold truncate select-none leading-none">{suc.nombre}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PANEL DE PERMISOS */}
              <div>
                <h3 className="font-extrabold text-gray-800 mb-3 md:mb-4 px-1 text-sm md:text-base border-l-4 border-blue-600 pl-2">Gestión de Permisos por Módulo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                  {MODULOS.map(mod => (
                    <div key={mod} className={`p-4 md:p-5 rounded-2xl border transition-all duration-300 ${permisosLocales.view[mod] ? 'bg-white shadow-sm border-blue-200' : 'bg-slate-50 border-gray-200 opacity-80'}`}>
                      <h4 className={`font-black mb-3 md:mb-4 text-sm md:text-base flex items-center gap-2 ${permisosLocales.view[mod] ? 'text-blue-700' : 'text-gray-500'}`}>
                         <span className={`w-2 h-2 rounded-full ${permisosLocales.view[mod] ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></span> {mod}
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                           <span className="text-[10px] md:text-xs font-bold text-gray-700">Ver Módulo</span>
                           <ToggleSwitch checked={permisosLocales.view[mod]} onChange={() => togglePermiso('view', mod)} />
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                           <span className={`text-[10px] md:text-xs font-bold ${permisosLocales.view[mod] ? 'text-gray-700' : 'text-gray-400'}`}>Editar / Crear</span>
                           <ToggleSwitch checked={permisosLocales.mod[mod]} onChange={() => togglePermiso('mod', mod)} disabled={!permisosLocales.view[mod]} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CLAVES DE SEGURIDAD */}
              <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div>
                  <h3 className="font-extrabold text-gray-800 mb-1 border-b border-dashed border-gray-100 pb-2 text-sm">
                    {modalCrear ? 'Contraseña Inicial' : 'Resetear Contraseña'}
                  </h3>
                  <p className="text-[9px] md:text-[10px] font-bold text-gray-400 mb-3">{modalCrear ? 'Mínimo 6 caracteres requeridos.' : 'Déjalo en blanco si no deseas cambiarla.'}</p>
                  <input type="password" placeholder={modalCrear ? "Contraseña requerida..." : "Nueva contraseña..."} className={`w-full bg-slate-50 border p-3.5 rounded-xl outline-none font-bold text-gray-800 text-sm transition-colors ${errores.password || errores.nueva_password ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`} value={modalCrear ? formCrear.password : formEditar.nueva_password} onChange={e => modalCrear ? setFormCrear({...formCrear, password: e.target.value}) : setFormEditar({...formEditar, nueva_password: e.target.value})}/>
                  {(errores.password || errores.nueva_password) && <p className="text-[10px] text-red-500 mt-1 font-bold leading-tight">{errores.password || errores.nueva_password}</p>}
                </div>
                
                <div className="bg-blue-50 p-4 md:p-5 rounded-2xl border border-blue-100 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-200 rounded-full blur-2xl opacity-50"></div>
                  <h3 className="font-black text-blue-800 mb-1 flex items-center gap-1.5 text-sm relative z-10"><ShieldCheck size={16}/> Confirmación Administrador</h3>
                  <p className="text-[9px] md:text-[10px] font-bold text-blue-600/80 mb-3 relative z-10">Ingresa TU contraseña para autorizar cambios.</p>
                  <input type="password" placeholder="Tu clave maestra..." className={`w-full bg-white border p-3.5 rounded-xl outline-none font-bold text-gray-800 text-sm transition-colors relative z-10 shadow-sm ${errores.admin_password ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-blue-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`} value={modalCrear ? formCrear.admin_password : formEditar.admin_password} onChange={e => modalCrear ? setFormCrear({...formCrear, admin_password: e.target.value}) : setFormEditar({...formEditar, admin_password: e.target.value})}/>
                  {errores.admin_password && <p className="text-[10px] text-red-500 mt-1 font-bold relative z-10 leading-tight">{errores.admin_password}</p>}
                </div>
              </div>

            </form>

            <div className="flex flex-col sm:flex-row gap-3 p-4 md:p-6 border-t border-gray-100 bg-white shrink-0">
              <button type="button" onClick={() => modalCrear ? setModalCrear(false) : setModalEditar(false)} className="w-full sm:w-1/3 border border-gray-200 py-3.5 md:py-4 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors text-sm">Cancelar</button>
              <button type="submit" onClick={modalCrear ? handleCrear : handleGuardarEditarCompleto} disabled={modalCrear && empleadosDisponibles.length === 0} className="w-full sm:w-2/3 bg-blue-600 text-white py-3.5 md:py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/30 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2 text-sm">
                <CheckCircle size={18}/> {modalCrear ? 'Generar Credencial' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ MODAL REVOCAR ACCESO ✨ */}
      {modalEliminar && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-[2rem] p-6 md:p-8 w-full sm:max-w-sm text-center shadow-2xl animate-fade-in-up pb-8">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 border-4 border-red-100 mb-4 text-red-500 shadow-inner">
              <AlertTriangle size={32}/>
            </div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">¿Revocar Acceso?</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium leading-relaxed">
              El usuario ya no podrá ingresar al sistema. <strong>El empleado físico seguirá en el Directorio.</strong>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalEliminar(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors text-sm">Cancelar</button>
              <button onClick={handleEliminar} className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 text-sm">Sí, Revocar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
export default Usuarios;