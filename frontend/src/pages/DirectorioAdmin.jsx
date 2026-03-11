import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import { Lock, ShieldAlert, Mail, ShieldCheck, Eye, Contact, Edit, X, Phone, CreditCard, UserPlus, User, Store } from 'lucide-react';

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
      nuevosErrores.nombre_completo = "El nombre y apellidos son obligatorios.";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.nombre_completo)) {
      nuevosErrores.nombre_completo = "Solo se permiten letras y espacios.";
    }
    if (formData.dni && !/^\d{8}$/.test(formData.dni)) nuevosErrores.dni = "El DNI debe tener exactamente 8 dígitos numéricos.";
    
    // ✨ VALIDACIÓN ESTRICTA: SOLO 9 NÚMEROS EXACTAMENTE
    if (formData.telefono && !/^\d{9}$/.test(formData.telefono.replace(/\s/g, ''))) {
        nuevosErrores.telefono = "El teléfono debe tener exactamente 9 dígitos numéricos.";
    }

    if (formData.correo_personal && !/^\S+@\S+\.\S+$/.test(formData.correo_personal)) nuevosErrores.correo_personal = "El formato del correo no es válido.";
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

  if (!isUnlocked) {
    return (
      <Layout>
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md" onClick={() => navigate('/dashboard')}>
          <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md text-center transform transition-all border border-white/50 relative" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => navigate('/dashboard')} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-200 p-2 rounded-full transition-colors"><X size={20}/></button>
            <div className="mx-auto w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-inner"><Lock size={36} /></div>
            <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Bóveda Confidencial</h2>
            <p className="text-sm text-gray-500 mb-8 font-medium">Ingresa tu contraseña maestra para visualizar la data del personal.</p>
            <form onSubmit={handleUnlock}>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={`w-full border p-4 rounded-xl outline-none focus:ring-4 text-center tracking-widest text-lg transition-colors ${errorBoveda ? 'border-red-500 focus:ring-red-100 bg-red-50' : 'border-gray-200 focus:ring-blue-100 mb-6'}`} placeholder="••••••••" required autoFocus/>
              {errorBoveda && <p className="text-red-500 text-xs font-bold mt-2 mb-4">{errorBoveda}</p>}
              <button type="submit" className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2"><ShieldAlert size={20} /> Desbloquear Bóveda</button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2 text-gray-800"><Contact className="text-blue-600" /> Directorio Staff</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">{esVistaGlobal ? 'Viendo todo el personal de la empresa.' : `Viendo personal de: ${sucursalActiva?.nombre || '...'}`}</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button onClick={() => { setFormData({nombre_completo:'', dni:'', telefono:'', correo_personal:''}); setErrores({}); setModalCrear(true); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all hover:-translate-y-0.5"><UserPlus size={18}/> Agregar Empleado</button>
          <button onClick={() => { setIsUnlocked(false); setPassword(''); }} className="bg-red-50 text-red-600 border border-red-200 px-5 py-2.5 rounded-xl font-bold hover:bg-red-100 transition-all">Bloquear</button>
        </div>
      </div>

      {!sucursalActiva ? (
        <div className="text-center py-10 text-red-500 font-bold bg-white rounded-2xl border border-red-200">⚠️ No se ha detectado sucursal.</div>
      ) : empleados.length === 0 ? (
        <div className="text-center py-10 text-gray-500 font-bold bg-white rounded-2xl border border-gray-200">No hay empleados registrados en esta sede.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {empleados.map(emp => {
            const colors = getRoleColors(emp.rol);
            const tituloPrincipal = emp.rol === 'Administrador' ? 'Administrador' : (emp.area_cargo || emp.nombre_completo);

            return (
              <div key={emp.id} className={`bg-white rounded-2xl shadow-sm border ${colors.border} flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group`}>
                <div className={`${colors.header} p-5 flex items-center gap-4 relative overflow-hidden`}>
                  <div className="absolute -right-4 -top-4 w-20 h-20 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl shadow-inner border border-white/30 z-10">
                    {emp.avatar ? <img src={emp.avatar} className="w-full h-full rounded-full object-cover"/> : emp.nombre_completo.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate z-10 flex-1">
                    <h3 className="font-bold text-base truncate drop-shadow-sm" title={tituloPrincipal}>{tituloPrincipal}</h3>
                    <span className="text-[10px] uppercase font-semibold tracking-wider opacity-90">{emp.rol || 'Sin Acceso'}</span>
                  </div>
                </div>
                <div className="p-5 bg-white flex-1 space-y-3">
                  <p className="text-xs text-gray-600 flex items-center gap-3 font-medium truncate" title={emp.nombre_completo}><User size={14} className="text-gray-400 flex-shrink-0"/> {emp.nombre_completo}</p>
                  <p className="text-xs text-gray-600 flex items-center gap-3 font-medium"><Phone size={14} className="text-gray-400 flex-shrink-0"/> {emp.telefono || 'Sin Teléfono'}</p>
                  {esVistaGlobal && (
                    <div className="pt-2 mt-2 border-t border-gray-100">
                      <span className="text-[10px] font-extrabold uppercase text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded flex items-center gap-1 w-max">
                        <Store size={12}/> {emp.rol === 'Administrador' ? 'Global' : obtenerNombresSucursales(emp.sucursales_asignadas)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
                  <button onClick={() => setModalVer(emp)} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"><Eye size={14}/> Detalles</button>
                  <button onClick={() => { setFormData(emp); setErrores({}); setModalEditar(emp); }} className="px-3 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"><Edit size={14}/> Editar</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(modalCrear || modalEditar) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl border border-white/50 animate-fade-in-up">
            <div className="flex justify-between mb-6 border-b border-gray-100 pb-3">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                {modalCrear ? <UserPlus className="text-blue-600"/> : <Edit className="text-yellow-500"/>} 
                {modalCrear ? 'Registrar Empleado' : 'Editar Personales'}
              </h2>
              <button onClick={cerrarModales} className="text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Nombres y Apellidos Completos</label>
                <input 
                  placeholder="Ej: Juan Pérez Gonzales" 
                  value={formData.nombre_completo} 
                  onChange={e => setFormData({...formData, nombre_completo: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})} 
                  className={`w-full border p-3 rounded-xl focus:ring-2 focus:outline-none font-medium ${errores.nombre_completo ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'}`} 
                  required
                />
                {errores.nombre_completo && <p className="text-[10px] text-red-500 mt-1 font-bold">{errores.nombre_completo}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">DNI / Documento</label>
                  <input 
                    placeholder="12345678" 
                    value={formData.dni} 
                    onChange={e => setFormData({...formData, dni: e.target.value.replace(/\D/g, '').slice(0, 8)})} 
                    className={`w-full border p-3 rounded-xl focus:ring-2 focus:outline-none font-medium ${errores.dni ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'}`}
                  />
                  {errores.dni && <p className="text-[10px] text-red-500 mt-1 font-bold leading-tight">{errores.dni}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Teléfono</label>
                  <input 
                    placeholder="999888777" 
                    value={formData.telefono} 
                    // ✨ BLOQUEO FÍSICO AL ESCRIBIR
                    onChange={e => setFormData({...formData, telefono: e.target.value.replace(/[^\d]/g, '').slice(0, 9)})} 
                    className={`w-full border p-3 rounded-xl focus:ring-2 focus:outline-none font-medium ${errores.telefono ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'}`}
                  />
                  {errores.telefono && <p className="text-[10px] text-red-500 mt-1 font-bold leading-tight">{errores.telefono}</p>}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Correo Personal</label>
                <input 
                  type="email" 
                  placeholder="usuario@gmail.com" 
                  value={formData.correo_personal} 
                  onChange={e => setFormData({...formData, correo_personal: e.target.value})} 
                  className={`w-full border p-3 rounded-xl focus:ring-2 focus:outline-none font-medium ${errores.correo_personal ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'}`}
                />
                {errores.correo_personal && <p className="text-[10px] text-red-500 mt-1 font-bold">{errores.correo_personal}</p>}
              </div>
              
              <div className="bg-blue-50 text-blue-800 text-xs p-4 rounded-xl border border-blue-100 flex items-start gap-2 mt-4">
                <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
                <p>Las credenciales y cargos del sistema no se otorgan aquí. Debes ir al módulo <strong>Usuarios</strong> después de guardar.</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={cerrarModales} className="w-1/3 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="w-2/3 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalVer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-white/50 animate-fade-in-up">
            <div className={`${getRoleColors(modalVer.rol).header} px-8 py-10 flex flex-col items-center relative`}>
               <button onClick={() => setModalVer(null)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-sm transition-colors"><X size={20}/></button>
               <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center font-bold text-4xl shadow-lg border-4 border-white/30 mb-4 overflow-hidden z-10">
                 {modalVer.avatar ? <img src={modalVer.avatar} className="w-full h-full object-cover"/> : modalVer.nombre_completo.charAt(0).toUpperCase()}
               </div>
               <h2 className="text-2xl font-extrabold text-center drop-shadow-md">
                 {modalVer.rol === 'Administrador' ? 'Administrador' : (modalVer.area_cargo || 'Sin designación en sistema')}
               </h2>
               <span className={`px-4 py-1.5 rounded-full text-xs font-bold mt-3 ${getRoleColors(modalVer.rol).tag}`}>{modalVer.rol || 'Sin Rol'}</span>
            </div>
            
            <div className="p-8 space-y-5 bg-gray-50">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2">Información Real de Contacto</h3>
              
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1 mb-1"><User size={14}/> Nombres y Apellidos Completos</p>
                <p className="font-bold text-gray-800 text-lg">{modalVer.nombre_completo}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div><p className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1 mb-1"><CreditCard size={14}/> DNI</p><p className="font-bold text-gray-800">{modalVer.dni || '-'}</p></div>
                <div><p className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1 mb-1"><Phone size={14}/> Teléfono</p><p className="font-bold text-gray-800">{modalVer.telefono || '-'}</p></div>
                <div className="col-span-2"><p className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1 mb-1"><Mail size={14}/> Correo Personal</p><p className="font-bold text-gray-800">{modalVer.correo_personal || '-'}</p></div>
              </div>

              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2 mt-6">Acceso al Sistema</h3>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1 mb-1"><ShieldCheck size={14}/> Correo Corporativo (Login)</p>
                <p className="font-bold text-blue-600">{modalVer.correo_corporativo || 'Este empleado no tiene acceso al ERP'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
export default DirectorioAdmin;