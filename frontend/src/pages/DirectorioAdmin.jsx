import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import { Lock, ShieldAlert, Mail, ShieldCheck, Eye, Contact, Edit, X, Phone, CreditCard, UserPlus, User, Store, CheckCircle } from 'lucide-react';

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
    if (!rol) return { header: 'bg-gray-400 text-white', border: 'border-gray-200', tag: 'bg-gray-100 text-gray-600' };
    switch (rol) {
      case 'Administrador': return { header: 'bg-purple-700 text-white', border: 'border-purple-200', tag: 'bg-purple-100 text-purple-800' };
      case 'Supervisor': return { header: 'bg-blue-600 text-white', border: 'border-blue-200', tag: 'bg-blue-100 text-blue-800' };
      default: return { header: 'bg-emerald-600 text-white', border: 'border-emerald-200', tag: 'bg-emerald-100 text-emerald-800' };
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

  // ✨ PANTALLA DE BLOQUEO ✨
  if (!isUnlocked) {
    return (
      <Layout title="Directorio Staff" moduleIcon={<Lock/>}>
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md p-4" onClick={() => navigate('/dashboard')}>
          <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-sm text-center transform transition-all border border-white/20 relative animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => navigate('/dashboard')} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-200 p-1.5 rounded-full transition-colors"><X size={18}/></button>
            <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-inner border-4 border-white"><Lock size={28} /></div>
            <h2 className="text-xl md:text-2xl font-black text-gray-800 mb-1 tracking-tight">Bóveda Confidencial</h2>
            <p className="text-[10px] md:text-xs text-gray-500 mb-6 font-medium px-2">Ingresa tu contraseña maestra para visualizar la data sensible.</p>
            <form onSubmit={handleUnlock} className="space-y-3">
              <div>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className={`w-full border-2 p-3 rounded-xl outline-none focus:ring-2 text-center tracking-[0.5em] text-lg font-black transition-all ${errorBoveda ? 'border-red-400 focus:ring-red-100 bg-red-50 text-red-600' : 'border-gray-200 focus:ring-blue-100 focus:border-blue-400 bg-slate-50 text-gray-800'}`} 
                  placeholder="••••••••" 
                  required 
                  autoFocus
                />
                {errorBoveda && <p className="text-red-500 text-[9px] font-extrabold uppercase tracking-widest mt-1.5">{errorBoveda}</p>}
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white p-3 rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 text-xs">
                <ShieldAlert size={16} /> Desbloquear
              </button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  // ✨ VISTA PRINCIPAL ✨
  return (
    <Layout title="Directorio Staff" moduleIcon={<Contact/>}>
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 md:mb-5 gap-3">
        <p className="text-[10px] md:text-xs text-gray-500 font-bold px-1 uppercase tracking-wider">
           {esVistaGlobal ? 'Personal Global de la Empresa' : `Personal asignado a: ${sucursalActiva?.nombre || 'Ninguna'}`}
        </p>

        {sucursalActiva && (
          <div className="flex w-full sm:w-auto gap-2">
            <button onClick={() => { setFormData({nombre_completo:'', dni:'', telefono:'', correo_personal:''}); setErrores({}); setModalCrear(true); }} className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-blue-700 transition-all active:scale-95 text-[11px] md:text-sm">
              <UserPlus size={14}/> <span className="hidden md:inline">Agregar Empleado</span><span className="md:hidden">Nuevo Empleado</span>
            </button>
            <button onClick={() => { setIsUnlocked(false); setPassword(''); }} className="px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all text-[11px] md:text-sm" title="Bloquear Bóveda">
              <Lock size={14}/>
            </button>
          </div>
        )}
      </div>

      {/* GRID DE EMPLEADOS COMPACTADO */}
      {!sucursalActiva ? (
        <div className="text-center py-8 text-xs text-red-500 bg-red-50 rounded-2xl border border-red-100">
          ⚠️ No se ha detectado sucursal. Selecciona una en el menú.
        </div>
      ) : empleados.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center">
          <Contact size={40} className="text-gray-200 mb-2" strokeWidth={1.5}/>
          <p className="text-xs font-bold text-gray-600">No hay empleados registrados</p>
          <p className="text-[10px] text-gray-400 mt-1">Registra a tu personal para darles acceso luego.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {empleados.map(emp => {
            const colors = getRoleColors(emp.rol);
            const tituloPrincipal = emp.rol === 'Administrador' ? 'Administrador' : (emp.area_cargo || emp.nombre_completo);

            return (
              <div key={emp.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden group relative">
                
                <div className={`${colors.header} p-3 md:p-4 flex items-center gap-3 relative overflow-hidden shrink-0`}>
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
                  
                  <div className="w-9 h-9 md:w-11 md:h-11 bg-white/20 rounded-full flex items-center justify-center font-black text-base md:text-lg shadow-inner border border-white/30 z-10 shrink-0">
                    {emp.avatar ? <img src={emp.avatar} className="w-full h-full rounded-full object-cover"/> : emp.nombre_completo.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="truncate z-10 flex-1 min-w-0">
                    <h3 className="font-extrabold text-[11px] md:text-sm truncate drop-shadow-sm leading-tight" title={tituloPrincipal}>{tituloPrincipal}</h3>
                    <span className="text-[8px] md:text-[9px] uppercase font-bold tracking-widest opacity-90 mt-0.5 block truncate">
                      {emp.rol || 'Sin Acceso a Sistema'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-gray-400 shrink-0"/>
                    <p className="text-[11px] font-bold text-gray-700 truncate" title={emp.nombre_completo}>{emp.nombre_completo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-gray-400 shrink-0"/>
                    <p className="text-[11px] font-bold text-gray-700 truncate">{emp.telefono || 'Sin Teléfono'}</p>
                  </div>
                  
                  {esVistaGlobal && (
                    <div className="pt-2 mt-2 border-t border-gray-50 border-dashed">
                      <span className="text-[8px] font-black uppercase text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded flex items-center gap-1 w-max">
                        <Store size={10}/> {emp.rol === 'Administrador' ? 'Global' : obtenerNombresSucursales(emp.sucursales_asignadas)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-2 border-t border-gray-50 flex justify-end gap-1.5 bg-slate-50 shrink-0">
                  <button onClick={() => setModalVer(emp)} className="flex-1 py-1.5 bg-white border border-gray-200 text-slate-600 hover:bg-slate-100 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"><Eye size={12}/> Ficha</button>
                  <button onClick={() => { setFormData(emp); setErrores({}); setModalEditar(emp); }} className="w-8 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Edit size={12}/></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ✨ MODAL CREAR / EDITAR EMPLEADO (Súper Compacto) ✨ */}
      {(modalCrear || modalEditar) && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-white p-5 sm:p-6 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl border border-white/50 animate-fade-in-up flex flex-col max-h-[90vh]">
            <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-3 sm:hidden shrink-0"></div>
            
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2 shrink-0">
              <h2 className="text-base md:text-lg font-extrabold text-gray-800 flex items-center gap-1.5">
                {modalCrear ? <UserPlus className="text-blue-600" size={16}/> : <Edit className="text-yellow-500" size={16}/>} 
                {modalCrear ? 'Registrar Empleado' : 'Editar Personales'}
              </h2>
              <button type="button" onClick={cerrarModales} className="text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 p-1 rounded-full transition-colors"><X size={16}/></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-3 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-2 px-1">
              <div>
                <label className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest mb-1 block">Nombres y Apellidos *</label>
                {/* ✨ VALIDACIÓN FUERTE: Solo letras ✨ */}
                <input 
                  placeholder="Ej: Juan Pérez" 
                  value={formData.nombre_completo} 
                  onChange={e => setFormData({...formData, nombre_completo: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})} 
                  className={`w-full bg-slate-50 border p-2.5 rounded-xl focus:bg-white outline-none font-bold text-gray-800 text-xs transition-all ${errores.nombre_completo ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`} 
                  required
                  autoFocus
                />
                {errores.nombre_completo && <p className="text-[9px] text-red-500 mt-1 font-bold">{errores.nombre_completo}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest mb-1 block">DNI / Doc.</label>
                  {/* ✨ VALIDACIÓN FUERTE: Solo 8 números, teclado numérico ✨ */}
                  <input 
                    type="text" inputMode="numeric"
                    placeholder="8 dígitos" 
                    value={formData.dni} 
                    onChange={e => setFormData({...formData, dni: e.target.value.replace(/\D/g, '').slice(0, 8)})} 
                    className={`w-full bg-slate-50 border p-2.5 rounded-xl focus:bg-white outline-none font-bold text-gray-800 text-xs tracking-wider transition-all ${errores.dni ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`}
                  />
                  {errores.dni && <p className="text-[8px] text-red-500 mt-0.5 font-bold leading-tight">{errores.dni}</p>}
                </div>
                <div>
                  <label className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest mb-1 block">Celular</label>
                  {/* ✨ VALIDACIÓN FUERTE: Solo 9 números, teclado numérico ✨ */}
                  <input 
                    type="text" inputMode="numeric"
                    placeholder="9 dígitos" 
                    value={formData.telefono} 
                    onChange={e => setFormData({...formData, telefono: e.target.value.replace(/\D/g, '').slice(0, 9)})} 
                    className={`w-full bg-slate-50 border p-2.5 rounded-xl focus:bg-white outline-none font-bold text-gray-800 text-xs tracking-wider transition-all ${errores.telefono ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`}
                  />
                  {errores.telefono && <p className="text-[8px] text-red-500 mt-0.5 font-bold leading-tight">{errores.telefono}</p>}
                </div>
              </div>

              <div>
                <label className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest mb-1 block">Correo Personal</label>
                <input 
                  type="email" 
                  placeholder="usuario@gmail.com" 
                  value={formData.correo_personal} 
                  onChange={e => setFormData({...formData, correo_personal: e.target.value})} 
                  className={`w-full bg-slate-50 border p-2.5 rounded-xl focus:bg-white outline-none font-bold text-gray-700 text-xs transition-all ${errores.correo_personal ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400'}`}
                />
                {errores.correo_personal && <p className="text-[8px] text-red-500 mt-0.5 font-bold">{errores.correo_personal}</p>}
              </div>
              
              <div className="bg-blue-50 text-blue-800 text-[9px] md:text-[10px] p-3 rounded-xl border border-blue-100 flex items-start gap-1.5 mt-2 font-medium">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-blue-600" />
                <p>Las credenciales se otorgan en <strong>"Cuentas de Acceso"</strong> después de guardar.</p>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-gray-50 mt-2 shrink-0">
                <button type="button" onClick={cerrarModales} className="flex-1 py-2.5 border border-gray-200 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-colors text-xs">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 text-xs flex items-center justify-center gap-1.5 active:scale-95"><CheckCircle size={14}/> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✨ MODAL FICHA DETALLES (Súper Compacto) ✨ */}
      {modalVer && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm overflow-hidden shadow-2xl border border-white/50 animate-fade-in-up pb-6 sm:pb-0 flex flex-col max-h-[90vh]">
            <div className="w-10 h-1.5 bg-white/50 rounded-full mx-auto mt-3 sm:hidden z-20 relative"></div>
            
            <div className={`${getRoleColors(modalVer.rol).header} px-5 py-6 md:py-8 flex flex-col items-center relative shrink-0`}>
               <button onClick={() => setModalVer(null)} className="absolute top-3 right-3 md:top-4 md:right-4 text-white/70 hover:text-white bg-white/10 p-1.5 rounded-full backdrop-blur-sm transition-colors"><X size={16}/></button>
               
               <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-full flex items-center justify-center font-black text-2xl md:text-3xl shadow-lg border-[3px] border-white/30 mb-2 overflow-hidden z-10">
                 {modalVer.avatar ? <img src={modalVer.avatar} className="w-full h-full object-cover"/> : modalVer.nombre_completo.charAt(0).toUpperCase()}
               </div>
               
               <h2 className="text-lg md:text-xl font-black text-center drop-shadow-md px-3 leading-tight">
                 {modalVer.rol === 'Administrador' ? 'Administrador' : (modalVer.area_cargo || 'Empleado Sin Cargo')}
               </h2>
               <span className={`px-2 py-0.5 rounded text-[8px] md:text-[9px] font-black mt-1.5 tracking-widest uppercase shadow-sm ${getRoleColors(modalVer.rol).tag}`}>{modalVer.rol || 'Sin Acceso'}</span>
            </div>
            
            <div className="p-5 md:p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-slate-50/50">
              <h3 className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1 mb-3">Información Física</h3>
              
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm mb-3">
                <p className="text-[8px] md:text-[9px] text-gray-500 font-extrabold uppercase tracking-widest flex items-center gap-1 mb-0.5"><User size={10}/> Nombres Completos</p>
                <p className="font-black text-gray-800 text-sm md:text-base leading-tight">{modalVer.nombre_completo}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-[8px] md:text-[9px] text-gray-500 font-extrabold uppercase tracking-widest flex items-center gap-1 mb-0.5"><CreditCard size={10}/> DNI</p><p className="font-bold text-gray-800 text-xs">{modalVer.dni || 'No registrado'}</p></div>
                <div><p className="text-[8px] md:text-[9px] text-gray-500 font-extrabold uppercase tracking-widest flex items-center gap-1 mb-0.5"><Phone size={10}/> Teléfono</p><p className="font-bold text-gray-800 text-xs">{modalVer.telefono || 'No registrado'}</p></div>
                <div className="col-span-2"><p className="text-[8px] md:text-[9px] text-gray-500 font-extrabold uppercase tracking-widest flex items-center gap-1 mb-0.5"><Mail size={10}/> Correo Personal</p><p className="font-bold text-gray-800 text-xs truncate">{modalVer.correo_personal || 'No registrado'}</p></div>
              </div>

              <h3 className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1 mt-5 mb-3">Acceso al Sistema ERP</h3>
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-[8px] md:text-[9px] text-gray-500 font-extrabold uppercase tracking-widest flex items-center gap-1 mb-1"><ShieldCheck size={10} className="text-blue-500"/> Correo Corporativo (Login)</p>
                <p className={`font-bold text-xs ${modalVer.correo_corporativo ? 'text-blue-600' : 'text-gray-400 italic'}`}>{modalVer.correo_corporativo || 'Este empleado no tiene acceso al ERP'}</p>
              </div>
            </div>
            
            <div className="p-3 bg-white border-t border-gray-50 sm:hidden shrink-0">
               <button onClick={() => setModalVer(null)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-xs">Cerrar Ficha</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
export default DirectorioAdmin;