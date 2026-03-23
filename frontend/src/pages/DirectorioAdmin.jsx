import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import { Lock, ShieldAlert, Mail, ShieldCheck, Eye, Contact, Edit, X, Phone, CreditCard, UserPlus, User, Store, CheckCircle } from 'lucide-react';

const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const DirectorioAdmin = () => {
  const navigate = useNavigate(); 
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [errorBoveda, setErrorBoveda] = useState(''); 
  const [empleados, setEmpleados] = useState([]);
  const [sucursales, setSucursales] = useState([]); 
  
  const [modalCrear, setModalCrear] = useState(false);
  const [modalVer, setModalVer] = useState(null);
  const [modalEditar, setModalEditar] = useState(null);
  
  const [formData, setFormData] = useState({ nombre_completo: '', dni: '', telefono: '', correo_personal: '' });
  const [errores, setErrores] = useState({});

  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);
  const esVistaGlobal = sucursalActiva?.id === 'ALL';

  const fetchData = async () => {
    const currentSucursal = JSON.parse(localStorage.getItem('sucursalActiva'));
    if (!currentSucursal) return; 

    try {
      const res = await api.get('/empleados');
      setEmpleados(res.data);
      try {
        const sucRes = await api.get('/sucursales');
        setSucursales(sucRes.data);
      } catch(e){}
    } catch (err) { console.error(err); }
  };

  useEffect(() => { 
    if(isUnlocked) fetchData(); 
    const handleSucursalCambiada = () => {
      setSucursalActiva(JSON.parse(localStorage.getItem('sucursalActiva')));
      if(isUnlocked) fetchData(); 
    };
    window.addEventListener('sucursalCambiada', handleSucursalCambiada);
    return () => window.removeEventListener('sucursalCambiada', handleSucursalCambiada);
  }, [isUnlocked]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setErrorBoveda('');
    try {
      await api.post('/usuarios/verificar-admin', { admin_password: password });
      await fetchData();
      setIsUnlocked(true);
    } catch (err) { 
      setErrorBoveda('Contraseña incorrecta o permisos insuficientes.'); 
    }
  };

  const validarFormulario = () => {
    let nuevosErrores = {};
    if (!formData.nombre_completo.trim()) {
      nuevosErrores.nombre_completo = "Obligatorio.";
    }
    if (formData.dni && !/^\d{8}$/.test(formData.dni)) nuevosErrores.dni = "Debe tener 8 dígitos.";
    if (formData.telefono && !/^\d{9}$/.test(formData.telefono.replace(/\s/g, ''))) nuevosErrores.telefono = "Debe tener 9 dígitos.";
    if (formData.correo_personal && !/^\S+@\S+\.\S+$/.test(formData.correo_personal)) nuevosErrores.correo_personal = "Correo no válido.";
    
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    try {
      if (modalEditar) await api.put(`/empleados/${modalEditar.id}`, formData);
      else await api.post('/empleados', formData);
      cerrarModales(); fetchData();
    } catch (err) { alert('Error al guardar empleado'); }
  };

  const cerrarModales = () => { setModalCrear(false); setModalEditar(null); setErrores({}); };

  const getRoleColors = (rol) => {
    if (!rol) return { header: 'bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-white', border: 'border-gray-200/50 dark:border-white/5', tag: 'bg-gray-100/80 dark:bg-slate-700/80 text-gray-600 dark:text-slate-300 border border-gray-200/50 dark:border-white/5' };
    switch (rol) {
      case 'Administrador': return { header: 'bg-purple-600/90 dark:bg-purple-600 text-white', border: 'border-purple-200/50 dark:border-purple-500/20', tag: 'bg-purple-100/80 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200/50 dark:border-purple-500/20' };
      case 'Supervisor': return { header: 'bg-blue-600/90 dark:bg-blue-600 text-white', border: 'border-blue-200/50 dark:border-blue-500/20', tag: 'bg-blue-100/80 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200/50 dark:border-blue-500/20' };
      default: return { header: 'bg-emerald-600/90 dark:bg-emerald-600 text-white', border: 'border-emerald-200/50 dark:border-emerald-500/20', tag: 'bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-500/20' };
    }
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

  const obtenerNombresSucursales = (arrStr) => {
    const arr = parseJsonArray(arrStr);
    if (arr.length === 0) return 'Sin asignar';
    const nombres = arr.map(id => sucursales.find(s => s.id === parseInt(id))?.nombre).filter(Boolean);
    if (nombres.length === sucursales.length && sucursales.length > 0) return 'Todas las Sucursales';
    return nombres.join(', ') || 'Desconocida';
  };

  // ✨ PANTALLA DE BLOQUEO (LIQUID GLASS) ✨
  if (!isUnlocked) {
    return (
      <Layout title="Directorio Staff" moduleIcon={<Lock/>}>
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 transition-colors" onClick={() => navigate('/dashboard')}>
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl p-6 md:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-sm text-center transform transition-all border border-white/50 dark:border-white/10 relative animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => navigate('/dashboard')} className="absolute top-4 right-4 text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700 p-1.5 rounded-full transition-colors border border-transparent dark:border-white/5"><X size={18}/></button>
            <div className="mx-auto w-16 h-16 bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4 shadow-inner border-[3px] border-white/50 dark:border-white/10 backdrop-blur-md transition-colors"><Lock size={28} /></div>
            <h2 className="text-xl md:text-2xl font-black text-gray-800 dark:text-white mb-1 tracking-tight transition-colors">Bóveda Confidencial</h2>
            <p className="text-[10px] md:text-[11px] text-gray-500 dark:text-blue-300/70 mb-6 font-bold px-2 leading-relaxed transition-colors">Ingresa tu contraseña maestra para visualizar la data sensible.</p>
            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className={`w-full border-2 p-3.5 rounded-xl outline-none focus:ring-2 text-center tracking-[0.5em] text-lg font-black transition-all shadow-sm ${errorBoveda ? 'border-red-400 dark:border-red-500/50 focus:ring-red-500/20 bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'border-gray-200/80 dark:border-white/10 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 bg-white/70 dark:bg-blue-950/30 text-gray-800 dark:text-white'}`} 
                  placeholder="••••••••" 
                  required 
                  autoFocus
                />
                {errorBoveda && <p className="text-red-500 dark:text-red-400 text-[9px] font-extrabold uppercase tracking-widest mt-1.5 transition-colors">{errorBoveda}</p>}
              </div>
              <button type="submit" className="w-full bg-slate-900 dark:bg-blue-600 text-white p-3.5 rounded-xl font-black hover:bg-slate-800 dark:hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-slate-900/20 dark:shadow-blue-900/40 flex items-center justify-center gap-2 text-xs border border-transparent dark:border-white/10 backdrop-blur-md">
                <ShieldAlert size={16} /> Desbloquear
              </button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  // ✨ VISTA PRINCIPAL (LIQUID GLASS) ✨
  return (
    <Layout title="Directorio Staff" moduleIcon={<Contact/>}>
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 md:mb-5 gap-3">
        <p className="text-[11px] md:text-sm text-gray-500 dark:text-blue-300/70 font-extrabold px-1 uppercase tracking-widest transition-colors">
           {esVistaGlobal ? 'Personal Global de la Empresa' : `Personal asignado a: ${sucursalActiva?.nombre || 'Ninguna'}`}
        </p>

        {sucursalActiva && (
          <div className="flex w-full sm:w-auto gap-2">
            <button onClick={() => { setFormData({nombre_completo:'', dni:'', telefono:'', correo_personal:''}); setErrores({}); setModalCrear(true); }} className="flex-1 sm:flex-none bg-blue-600/90 dark:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-black flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 hover:bg-blue-700 transition-all active:scale-95 text-[11px] md:text-sm border border-transparent dark:border-white/10 backdrop-blur-md">
              <UserPlus size={16}/> <span className="hidden md:inline">Agregar Empleado</span><span className="md:hidden">Nuevo Empleado</span>
            </button>
            <button onClick={() => { setIsUnlocked(false); setPassword(''); }} className="px-3.5 py-2.5 bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100/50 dark:border-red-500/20 rounded-xl font-bold flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/50 active:scale-95 transition-all shadow-sm backdrop-blur-md" title="Bloquear Bóveda">
              <Lock size={16}/>
            </button>
          </div>
        )}
      </div>

      {/* GRID DE EMPLEADOS COMPACTADO */}
      {!sucursalActiva ? (
        <div className="text-center py-10 text-xs font-bold text-red-500 bg-red-50/80 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-500/20 backdrop-blur-md transition-colors">
          ⚠️ No se ha detectado sucursal. Selecciona una en el menú.
        </div>
      ) : empleados.length === 0 ? (
        <div className="text-center py-16 bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] border border-gray-100/50 dark:border-white/5 shadow-sm flex flex-col items-center transition-colors">
          <Contact size={48} className="text-gray-300 dark:text-slate-600 mb-3" strokeWidth={1.5}/>
          <p className="text-sm font-black text-gray-600 dark:text-white transition-colors">No hay empleados registrados</p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 font-medium transition-colors">Registra a tu personal para darles acceso luego.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {empleados.map(emp => {
            const colors = getRoleColors(emp.rol);
            const tituloPrincipal = emp.rol === 'Administrador' ? 'Administrador' : (emp.area_cargo || emp.nombre_completo);

            return (
              <div key={emp.id} className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-gray-100/50 dark:border-white/5 flex flex-col hover:shadow-lg dark:hover:shadow-[0_8px_30px_rgb(29,78,216,0.15)] hover:border-blue-300 dark:hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden group relative">
                
                <div className={`${colors.header} p-3.5 md:p-4 flex items-center gap-3 relative overflow-hidden shrink-0 transition-colors backdrop-blur-md border-b ${colors.border}`}>
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
                  
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 dark:bg-white/10 rounded-xl flex items-center justify-center font-black text-lg md:text-xl shadow-inner border border-white/30 dark:border-white/20 z-10 shrink-0 backdrop-blur-md transition-colors">
                    {emp.avatar ? <img src={emp.avatar} className="w-full h-full rounded-xl object-cover"/> : emp.nombre_completo.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="truncate z-10 flex-1 min-w-0">
                    <h3 className="font-black text-xs md:text-sm truncate drop-shadow-sm leading-tight transition-colors" title={tituloPrincipal}>{tituloPrincipal}</h3>
                    <span className="text-[8px] md:text-[9px] uppercase font-extrabold tracking-widest opacity-90 mt-1 block truncate transition-colors">
                      {emp.rol || 'Sin Acceso a Sistema'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-transparent flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-gray-400 dark:text-slate-500 shrink-0 transition-colors"/>
                    <p className="text-[11px] font-bold text-gray-700 dark:text-slate-300 truncate transition-colors" title={emp.nombre_completo}>{emp.nombre_completo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-gray-400 dark:text-slate-500 shrink-0 transition-colors"/>
                    <p className="text-[11px] font-bold text-gray-700 dark:text-slate-300 truncate transition-colors">{emp.telefono || 'Sin Teléfono'}</p>
                  </div>
                  
                  {esVistaGlobal && (
                    <div className="pt-2 mt-2 border-t border-gray-100/50 dark:border-white/5 border-dashed transition-colors">
                      <span className="text-[8px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-900/30 border border-purple-100/50 dark:border-purple-500/20 px-2 py-1 rounded-md flex items-center gap-1 w-max backdrop-blur-md transition-colors">
                        <Store size={10}/> {emp.rol === 'Administrador' ? 'Global' : obtenerNombresSucursales(emp.sucursales_asignadas)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-2 border-t border-gray-100/50 dark:border-white/5 flex justify-end gap-1.5 bg-white/50 dark:bg-slate-900/50 shrink-0 transition-colors backdrop-blur-md">
                  <button onClick={() => setModalVer(emp)} className="flex-1 py-2 bg-white/80 dark:bg-slate-800/80 border border-transparent dark:border-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm backdrop-blur-md active:scale-95"><Eye size={14}/> Ficha</button>
                  <button onClick={() => { setFormData(emp); setErrores({}); setModalEditar(emp); }} className="w-10 flex items-center justify-center bg-blue-50/80 dark:bg-blue-900/30 border border-transparent dark:border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors backdrop-blur-md active:scale-95 shadow-sm"><Edit size={14}/></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ✨ MODAL CREAR / EDITAR EMPLEADO (LIQUID GLASS) ✨ */}
      {(modalCrear || modalEditar) && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md transition-colors duration-300 animate-fade-in">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl p-6 sm:p-8 rounded-t-3xl sm:rounded-[2.5rem] w-full sm:max-w-md shadow-2xl border border-white/50 dark:border-white/10 animate-fade-in-up flex flex-col max-h-[90vh] transition-colors">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>
            
            <div className="flex justify-between items-center mb-5 border-b border-gray-100/50 dark:border-white/5 pb-3 shrink-0 transition-colors">
              <h2 className="text-base md:text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                {modalCrear ? <UserPlus className="text-blue-600 dark:text-blue-400" size={18}/> : <Edit className="text-yellow-500 dark:text-yellow-400" size={18}/>} 
                {modalCrear ? 'Registrar Empleado' : 'Editar Personales'}
              </h2>
              <button type="button" onClick={cerrarModales} className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700 p-1.5 rounded-full transition-colors border border-transparent dark:border-white/5"><X size={16}/></button>
            </div>
            
            <form onSubmit={handleSave} className={`space-y-4 overflow-y-auto ${hideScrollbar} pb-4 px-1`}>
              <div>
                <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block transition-colors">Nombres y Apellidos *</label>
                <input 
                  placeholder="Ej: Juan Pérez" 
                  value={formData.nombre_completo} 
                  onChange={e => setFormData({...formData, nombre_completo: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})} 
                  className={`w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border p-3.5 rounded-xl focus:bg-white dark:focus:bg-blue-950 outline-none font-bold text-gray-800 dark:text-white text-xs md:text-sm transition-all shadow-sm ${errores.nombre_completo ? 'border-red-400 dark:border-red-500/50 focus:ring-2 focus:ring-red-500/20' : 'border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400'}`} 
                  required
                  autoFocus
                />
                {errores.nombre_completo && <p className="text-[9px] text-red-500 dark:text-red-400 mt-1.5 font-bold uppercase tracking-wider">{errores.nombre_completo}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block transition-colors">DNI / Doc.</label>
                  <input 
                    type="text" inputMode="numeric"
                    placeholder="8 dígitos" 
                    value={formData.dni} 
                    onChange={e => setFormData({...formData, dni: e.target.value.replace(/\D/g, '').slice(0, 8)})} 
                    className={`w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border p-3.5 rounded-xl focus:bg-white dark:focus:bg-blue-950 outline-none font-bold text-gray-800 dark:text-white text-xs md:text-sm tracking-wider transition-all shadow-sm ${errores.dni ? 'border-red-400 dark:border-red-500/50 focus:ring-2 focus:ring-red-500/20' : 'border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400'}`}
                  />
                  {errores.dni && <p className="text-[8px] text-red-500 dark:text-red-400 mt-1 font-bold uppercase tracking-wider leading-tight">{errores.dni}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block transition-colors">Celular</label>
                  <input 
                    type="text" inputMode="numeric"
                    placeholder="9 dígitos" 
                    value={formData.telefono} 
                    onChange={e => setFormData({...formData, telefono: e.target.value.replace(/\D/g, '').slice(0, 9)})} 
                    className={`w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border p-3.5 rounded-xl focus:bg-white dark:focus:bg-blue-950 outline-none font-bold text-gray-800 dark:text-white text-xs md:text-sm tracking-wider transition-all shadow-sm ${errores.telefono ? 'border-red-400 dark:border-red-500/50 focus:ring-2 focus:ring-red-500/20' : 'border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400'}`}
                  />
                  {errores.telefono && <p className="text-[8px] text-red-500 dark:text-red-400 mt-1 font-bold uppercase tracking-wider leading-tight">{errores.telefono}</p>}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block transition-colors">Correo Personal</label>
                <input 
                  type="email" 
                  placeholder="usuario@gmail.com" 
                  value={formData.correo_personal} 
                  onChange={e => setFormData({...formData, correo_personal: e.target.value})} 
                  className={`w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border p-3.5 rounded-xl focus:bg-white dark:focus:bg-blue-950 outline-none font-bold text-gray-700 dark:text-white text-xs md:text-sm transition-all shadow-sm ${errores.correo_personal ? 'border-red-400 dark:border-red-500/50 focus:ring-2 focus:ring-red-500/20' : 'border-gray-200/80 dark:border-white/10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400'}`}
                />
                {errores.correo_personal && <p className="text-[8px] text-red-500 dark:text-red-400 mt-1 font-bold uppercase tracking-wider">{errores.correo_personal}</p>}
              </div>
              
              <div className="bg-blue-50/80 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300/70 text-[9px] md:text-[10px] p-3 rounded-xl border border-blue-100/50 dark:border-blue-500/20 flex items-start gap-1.5 mt-3 font-medium backdrop-blur-md transition-colors">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400 transition-colors" />
                <p>Las credenciales se otorgan en <strong>"Cuentas de Acceso"</strong> después de guardar.</p>
              </div>

              <div className="flex gap-3 pt-5 border-t border-gray-100/50 dark:border-white/5 mt-5 transition-colors">
                <button type="button" onClick={cerrarModales} className="flex-1 py-3.5 border border-gray-200/80 dark:border-white/5 bg-white/50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-300 rounded-xl font-extrabold hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm backdrop-blur-md shadow-sm active:scale-95">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600/90 dark:bg-blue-600 text-white py-3.5 rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 text-sm flex items-center justify-center gap-1.5 active:scale-95 border border-transparent dark:border-white/10 backdrop-blur-md"><CheckCircle size={16}/> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✨ MODAL FICHA DETALLES (Súper Compacto - LIQUID GLASS) ✨ */}
      {modalVer && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md transition-colors duration-300 animate-fade-in">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-3xl sm:rounded-[2.5rem] w-full sm:max-w-sm overflow-hidden shadow-2xl border border-white/50 dark:border-white/10 animate-fade-in-up pb-6 sm:pb-8 flex flex-col max-h-[90vh] transition-colors">
            <div className="w-12 h-1.5 bg-white/50 rounded-full mx-auto mt-4 sm:hidden z-20 relative"></div>
            
            <div className={`${getRoleColors(modalVer.rol).header} px-6 py-6 md:py-8 flex flex-col items-center relative shrink-0 transition-colors backdrop-blur-md border-b ${getRoleColors(modalVer.rol).border}`}>
               <button onClick={() => setModalVer(null)} className="absolute top-4 right-4 sm:top-5 sm:right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm transition-colors"><X size={16}/></button>
               
               <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 dark:bg-white/10 rounded-xl flex items-center justify-center font-black text-3xl md:text-4xl shadow-lg border-2 border-white/30 dark:border-white/20 mb-3 overflow-hidden z-10 backdrop-blur-md transition-colors">
                 {modalVer.avatar ? <img src={modalVer.avatar} className="w-full h-full object-cover"/> : modalVer.nombre_completo.charAt(0).toUpperCase()}
               </div>
               
               <h2 className="text-xl md:text-2xl font-black text-center drop-shadow-md px-4 leading-tight transition-colors">
                 {modalVer.rol === 'Administrador' ? 'Administrador' : (modalVer.area_cargo || 'Empleado Sin Cargo')}
               </h2>
               <span className={`px-2.5 py-1 rounded-md text-[9px] md:text-[10px] font-black mt-2 tracking-widest uppercase shadow-sm border backdrop-blur-md transition-colors ${getRoleColors(modalVer.rol).tag}`}>{modalVer.rol || 'Sin Acceso'}</span>
            </div>
            
            <div className={`p-6 overflow-y-auto ${hideScrollbar} bg-transparent`}>
              <h3 className="text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest border-b border-gray-200/50 dark:border-slate-700 pb-1.5 mb-4 transition-colors">Información Física</h3>
              
              <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100/50 dark:border-white/5 shadow-sm mb-4 backdrop-blur-md transition-colors">
                <p className="text-[9px] md:text-[10px] text-gray-500 dark:text-blue-300/70 font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-1 transition-colors"><User size={12}/> Nombres Completos</p>
                <p className="font-black text-gray-800 dark:text-white text-sm md:text-base leading-tight transition-colors">{modalVer.nombre_completo}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100/50 dark:border-white/5 shadow-sm backdrop-blur-md transition-colors">
                  <p className="text-[9px] md:text-[10px] text-gray-500 dark:text-blue-300/70 font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-1 transition-colors"><CreditCard size={12}/> DNI</p>
                  <p className="font-bold text-gray-800 dark:text-slate-200 text-xs md:text-sm transition-colors">{modalVer.dni || 'No registrado'}</p>
                </div>
                <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100/50 dark:border-white/5 shadow-sm backdrop-blur-md transition-colors">
                  <p className="text-[9px] md:text-[10px] text-gray-500 dark:text-blue-300/70 font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-1 transition-colors"><Phone size={12}/> Teléfono</p>
                  <p className="font-bold text-gray-800 dark:text-slate-200 text-xs md:text-sm transition-colors">{modalVer.telefono || 'No registrado'}</p>
                </div>
                <div className="col-span-2 bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100/50 dark:border-white/5 shadow-sm backdrop-blur-md transition-colors">
                  <p className="text-[9px] md:text-[10px] text-gray-500 dark:text-blue-300/70 font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-1 transition-colors"><Mail size={12}/> Correo Personal</p>
                  <p className="font-bold text-gray-800 dark:text-slate-200 text-xs md:text-sm truncate transition-colors">{modalVer.correo_personal || 'No registrado'}</p>
                </div>
              </div>

              <h3 className="text-[10px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest border-b border-gray-200/50 dark:border-slate-700 pb-1.5 mt-6 mb-4 transition-colors">Acceso al Sistema ERP</h3>
              <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100/50 dark:border-white/5 shadow-sm backdrop-blur-md transition-colors">
                <p className="text-[9px] md:text-[10px] text-gray-500 dark:text-blue-300/70 font-extrabold uppercase tracking-widest flex items-center gap-1.5 mb-1.5 transition-colors"><ShieldCheck size={12} className="text-blue-500 dark:text-blue-400"/> Correo Corporativo (Login)</p>
                <p className={`font-bold text-xs md:text-sm transition-colors ${modalVer.correo_corporativo ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500 italic'}`}>{modalVer.correo_corporativo || 'Este empleado no tiene acceso al ERP'}</p>
              </div>
            </div>
            
            <div className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-t border-gray-100/50 dark:border-white/5 sm:hidden shrink-0 transition-colors">
               <button onClick={() => setModalVer(null)} className="w-full bg-white/80 dark:bg-slate-800/80 border border-gray-200/80 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 py-3.5 rounded-xl font-extrabold text-sm shadow-sm transition-colors active:scale-95">Cerrar Ficha</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
export default DirectorioAdmin;