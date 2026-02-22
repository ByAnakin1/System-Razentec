import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Plus, Trash2, X, AlertTriangle, UserPlus, Eye, Edit, ShieldCheck, Zap } from 'lucide-react';
import { CATEGORIA_A_RUTA } from '../config/menuConfig';

const ROLES = ['Supervisor', 'Empleado'];
const MODULOS = Object.keys(CATEGORIA_A_RUTA);

const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <div onClick={() => !disabled && onChange()} className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ease-in-out ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}>
    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${checked ? 'translate-x-5' : ''}`} />
  </div>
);

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [empleadosDisponibles, setEmpleadosDisponibles] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [usuarioActual, setUsuarioActual] = useState(null);

  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalles, setModalDetalles] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [permisosLocales, setPermisosLocales] = useState({ view: {}, mod: {} });

  const [formCrear, setFormCrear] = useState({ empleado_id: '', area_cargo: '', email: '', password: '', rol: 'Empleado', admin_password: '' });
  const [formEditar, setFormEditar] = useState({ nombre_completo: '', area_cargo: '', email: '', rol: 'Empleado', nueva_password: '', admin_password: '' });
  const [errores, setErrores] = useState({});

  const esAdmin = () => usuarioActual?.rol === 'Administrador';
  
  // 🐛 PROTECCIÓN ANTI-CRASH PARA VISUALIZAR PERMISOS
  const categoriasArray = (u) => {
    if (!u || !u.categorias) return [];
    try {
      if (Array.isArray(u.categorias)) return u.categorias;
      if (typeof u.categorias === 'string') {
        let parsed = JSON.parse(u.categorias);
        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch(e) {}
    return [];
  };

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
      const resUsuarios = await api.get('/usuarios');
      setUsuarios(resUsuarios.data);
      const resEmpleados = await api.get('/empleados');
      setEmpleadosDisponibles(resEmpleados.data.filter(e => !e.correo_corporativo));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const openModalDetalles = (u) => {
    setUsuarioSeleccionado(u);
    setModalDetalles(true);
  };

  const handleOpenCrear = () => {
    setFormCrear({ empleado_id: '', area_cargo: '', email: '', password: '', rol: 'Empleado', admin_password: '' });
    setPermisosLocales({ view: {}, mod: {} });
    setErrores({});
    setModalCrear(true);
  };

  const openModalEditar = (u) => {
    setUsuarioSeleccionado(u);
    setFormEditar({ 
      nombre_completo: u.nombre_completo, 
      area_cargo: u.area_cargo || '', 
      email: u.email, 
      rol: u.rol || 'Empleado', 
      nueva_password: '', 
      admin_password: '' 
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
        email: formEditar.email,
        area_cargo: formEditar.area_cargo,
        rol: formEditar.rol,
        categorias: procesarCategoriasParaGuardar(),
        nueva_password: formEditar.nueva_password,
        admin_password: formEditar.admin_password
      });
      setModalEditar(false);
      fetchUsuarios();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar los cambios.');
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!validarUsuario(true)) return;

    try {
      await api.post('/usuarios', {
        empleado_id: formCrear.empleado_id,
        area_cargo: formCrear.area_cargo,
        email: formCrear.email,
        password: formCrear.password,
        rol: formCrear.rol,
        categorias: procesarCategoriasParaGuardar(),
        admin_password: formCrear.admin_password
      });
      setModalCrear(false);
      fetchUsuarios();
    } catch (err) { 
      alert(err.response?.data?.error || 'Error al crear. El correo podría estar en uso.'); 
    }
  };

  const handleEliminar = async () => {
    if (!usuarioSeleccionado) return;
    try {
      await api.delete(`/usuarios/${usuarioSeleccionado.id}`);
      setModalEliminar(false);
      fetchUsuarios();
    } catch (err) { alert(err.response?.data?.error || 'Error al eliminar'); }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><UserPlus size={24} className="text-blue-600" /> Cuentas de Acceso al Sistema</h1>
        {esAdmin() && (
          <button onClick={handleOpenCrear} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus size={20} /> Crear Credencial a Empleado
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
            <tr>
              <th className="px-6 py-3">Designación en Sistema</th>
              <th className="px-6 py-3">Correo Login</th>
              <th className="px-6 py-3">Nivel de Acceso</th>
              <th className="px-6 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? <tr><td colSpan="4" className="text-center py-8">Cargando...</td></tr> : 
             usuarios.length === 0 ? <tr><td colSpan="4" className="text-center py-8">No hay usuarios registrados.</td></tr> :
             usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0">
                       {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover"/> : (u.area_cargo || u.nombre_completo)?.charAt(0).toUpperCase()}
                     </div>
                     <div>
                       <p className="font-bold text-gray-900">
                         {u.rol === 'Administrador' ? 'Administrador' : (u.area_cargo || 'Sin designar')}
                       </p>
                       <p className="text-[10px] text-gray-400 truncate">Vinc: {u.nombre_completo}</p>
                     </div>
                   </div>
                </td>
                <td className="px-6 py-4">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.rol === 'Administrador' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.rol}
                  </span>
                </td>
                <td className="px-6 py-4 flex justify-center gap-2 mt-1">
                  <button onClick={() => openModalDetalles(u)} className="p-1.5 text-gray-400 hover:text-blue-600" title="Ver Permisos"><Eye size={18} /></button>
                  {esAdmin() && usuarioActual?.id !== u.id && (
                    <>
                      <button onClick={() => openModalEditar(u)} className="p-1.5 text-gray-400 hover:text-yellow-600" title="Editar Accesos"><Edit size={18} /></button>
                      <button onClick={() => { setUsuarioSeleccionado(u); setModalEliminar(true); }} className="p-1.5 text-gray-400 hover:text-red-500" title="Revocar Acceso"><Trash2 size={18} /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DETALLES */}
      {modalDetalles && usuarioSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between mb-4 border-b pb-3">
              <h2 className="text-xl font-bold">Detalles de Acceso</h2>
              <button onClick={() => setModalDetalles(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-bold uppercase">Identidad en Sistema (Cargo)</label>
                <div className="bg-gray-50 p-2 rounded border font-bold text-blue-800 text-lg">
                  {usuarioSeleccionado.rol === 'Administrador' ? 'Administrador' : (usuarioSeleccionado.area_cargo || 'Sin designar')}
                </div>
              </div>
              <div><label className="text-xs text-gray-500 font-bold uppercase">Persona Física Vinculada</label><div className="text-sm font-medium text-gray-700">{usuarioSeleccionado.nombre_completo}</div></div>
              <div><label className="text-xs text-gray-500 font-bold uppercase">Correo Corporativo</label><div className="bg-gray-50 p-2 rounded border text-gray-800">{usuarioSeleccionado.email}</div></div>
              <div><label className="text-xs text-gray-500 font-bold uppercase">Rol</label><div className="mt-1"><span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">{usuarioSeleccionado.rol}</span></div></div>
              <div className="pt-2"><label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Módulos Permitidos</label>
                <div className="flex flex-wrap gap-2">
                  {MODULOS.filter(m => tieneView(usuarioSeleccionado, m)).length > 0 ? (
                    MODULOS.filter(m => tieneView(usuarioSeleccionado, m)).map(m => <span key={m} className="bg-slate-800 text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1"><Eye size={12}/> {m}</span>)
                  ) : <span className="text-sm text-gray-400 italic">Sin acceso a módulos.</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR Y CREAR */}
      {(modalEditar || modalCrear) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-white/50">
            <div className="p-6 border-b flex justify-between items-center bg-white z-10 shadow-sm">
              <h2 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
                {modalCrear ? <UserPlus className="text-blue-600"/> : <Edit className="text-yellow-500"/>}
                {modalCrear ? 'Generar Credencial a Empleado' : 'Editar Accesos y Permisos'}
              </h2>
              <button onClick={() => modalCrear ? setModalCrear(false) : setModalEditar(false)} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full text-gray-500"><X size={20}/></button>
            </div>
            
            <form onSubmit={modalCrear ? handleCrear : handleGuardarEditarCompleto} className="overflow-y-auto p-8 bg-gray-50/50 space-y-8">
              
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-700 mb-5 border-b border-gray-100 pb-2">Identidad en el Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Vincular a Empleado (Persona Física)</label>
                    {modalCrear ? (
                      <select className={`w-full border p-3 rounded-xl outline-none font-medium ${errores.empleado_id ? 'border-red-500' : 'border-gray-200 focus:ring-blue-500'}`} value={formCrear.empleado_id} onChange={e => setFormCrear({...formCrear, empleado_id: e.target.value})}>
                        <option value="">-- Seleccione del Staff --</option>
                        {empleadosDisponibles.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre_completo}</option>)}
                      </select>
                    ) : (
                      <input className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 text-gray-500 font-bold" value={formEditar.nombre_completo} disabled />
                    )}
                    {errores.empleado_id && <p className="text-[10px] text-red-500 mt-1 font-bold">{errores.empleado_id}</p>}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Área o Cargo (Identidad en Sistema)</label>
                    <input type="text" className={`w-full border p-3 rounded-xl outline-none font-bold text-blue-800 bg-blue-50/30 ${errores.area_cargo ? 'border-red-500' : 'border-gray-200 focus:ring-blue-500'}`} value={modalCrear ? formCrear.area_cargo : formEditar.area_cargo} onChange={e => modalCrear ? setFormCrear({...formCrear, area_cargo: e.target.value}) : setFormEditar({...formEditar, area_cargo: e.target.value})} placeholder="Ej: Cajero Turno Mañana"/>
                    {errores.area_cargo && <p className="text-[10px] text-red-500 mt-1 font-bold">{errores.area_cargo}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Correo Corporativo (Login)</label>
                    <input type="email" className={`w-full border p-3 rounded-xl outline-none font-medium ${errores.email ? 'border-red-500' : 'border-gray-200 focus:ring-blue-500'}`} value={modalCrear ? formCrear.email : formEditar.email} onChange={e => modalCrear ? setFormCrear({...formCrear, email: e.target.value}) : setFormEditar({...formEditar, email: e.target.value})} placeholder="usuario@empresa.com"/>
                    {errores.email && <p className="text-[10px] text-red-500 mt-1 font-bold">{errores.email}</p>}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Nivel de Privilegios (Rol)</label>
                    <select className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium" value={modalCrear ? formCrear.rol : formEditar.rol} onChange={e => modalCrear ? setFormCrear({...formCrear, rol: e.target.value}) : setFormEditar({...formEditar, rol: e.target.value})}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-700 mb-4">Gestión de Permisos por Módulo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {MODULOS.map(mod => (
                    <div key={mod} className={`p-5 rounded-2xl border transition-all duration-300 ${permisosLocales.view[mod] ? 'bg-white shadow-md border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                      <h4 className={`font-extrabold mb-4 text-lg ${permisosLocales.view[mod] ? 'text-blue-700' : 'text-gray-500'}`}>{mod}</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Ver Módulo</span>
                          <ToggleSwitch checked={permisosLocales.view[mod]} onChange={() => togglePermiso('view', mod)} />
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t">
                          <span className={`text-sm font-medium ${permisosLocales.view[mod] ? 'text-gray-800' : 'text-gray-400'}`}>Editar / Crear</span>
                          <ToggleSwitch checked={permisosLocales.mod[mod]} onChange={() => togglePermiso('mod', mod)} disabled={!permisosLocales.view[mod]} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-gray-700 mb-2 border-b pb-2">{modalCrear ? 'Contraseña Inicial' : 'Resetear Contraseña'}</h3>
                  <p className="text-[11px] text-gray-500 mb-3">{modalCrear ? 'Mínimo 6 caracteres.' : 'Déjalo en blanco si no deseas cambiarla.'}</p>
                  <input type="password" placeholder={modalCrear ? "Contraseña requerida..." : "Nueva contraseña..."} className={`w-full border p-3 rounded-xl outline-none font-medium ${errores.password || errores.nueva_password ? 'border-red-500' : 'border-gray-200 focus:ring-blue-500'}`} value={modalCrear ? formCrear.password : formEditar.nueva_password} onChange={e => modalCrear ? setFormCrear({...formCrear, password: e.target.value}) : setFormEditar({...formEditar, nueva_password: e.target.value})}/>
                  {(errores.password || errores.nueva_password) && <p className="text-[10px] text-red-500 mt-1 font-bold">{errores.password || errores.nueva_password}</p>}
                </div>
                
                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                  <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-1.5"><ShieldCheck size={18}/> Confirmación Obligatoria</h3>
                  <p className="text-[11px] text-blue-600 mb-3">Tu clave maestra para autorizar.</p>
                  <input type="password" placeholder="Tu contraseña..." className={`w-full border p-3 rounded-xl outline-none font-medium ${errores.admin_password ? 'border-red-500' : 'border-gray-200 focus:ring-blue-500'}`} value={modalCrear ? formCrear.admin_password : formEditar.admin_password} onChange={e => modalCrear ? setFormCrear({...formCrear, admin_password: e.target.value}) : setFormEditar({...formEditar, admin_password: e.target.value})}/>
                  {errores.admin_password && <p className="text-[10px] text-red-500 mt-1 font-bold">{errores.admin_password}</p>}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => modalCrear ? setModalCrear(false) : setModalEditar(false)} className="w-1/3 border border-gray-200 py-3.5 rounded-xl text-gray-600 font-bold hover:bg-gray-100">Cancelar</button>
                <button type="submit" disabled={modalCrear && empleadosDisponibles.length === 0} className="w-2/3 bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/30 disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed">
                  {modalCrear ? 'Otorgar Acceso y Crear Usuario' : 'Confirmar y Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {modalEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md transition-all">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center border border-white/50">
            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5 text-red-600"><AlertTriangle size={32} /></div>
            <h3 className="text-2xl font-extrabold text-gray-800">¿Revocar Acceso?</h3>
            <p className="text-sm text-gray-500 mt-3 font-medium px-4">Esta acción eliminará el usuario del sistema. <strong>El empleado seguirá en el Directorio Staff.</strong></p>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setModalEliminar(false)} className="flex-1 border border-gray-200 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleEliminar} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700">Sí, Revocar Acceso</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Usuarios;