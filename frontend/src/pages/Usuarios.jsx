import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Plus, Trash2, X, AlertTriangle, UserPlus, Eye, Edit, ShieldCheck } from 'lucide-react';
import { CATEGORIA_A_RUTA } from '../config/menuConfig';

// Se removió 'Administrador' para que no pueda ser asignado a nuevos usuarios
const ROLES = ['Supervisor', 'Empleado'];
const MODULOS = Object.keys(CATEGORIA_A_RUTA);

// Componente Interruptor (Switch)
const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <div 
    onClick={() => !disabled && onChange()}
    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ease-in-out ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
  >
    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${checked ? 'translate-x-5' : ''}`} />
  </div>
);

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usuarioActual, setUsuarioActual] = useState(null);

  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalles, setModalDetalles] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [permisosLocales, setPermisosLocales] = useState({ view: {}, mod: {} });

  const [formCrear, setFormCrear] = useState({ nombre_completo: '', email: '', password: '', rol: 'Empleado', admin_password: '' });
  const [formEditar, setFormEditar] = useState({ nombre_completo: '', email: '', rol: 'Empleado', nueva_password: '', admin_password: '' });

  const esAdmin = () => usuarioActual?.rol === 'Administrador';
  const categoriasArray = (u) => Array.isArray(u?.categorias) ? u.categorias : [];
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
      const res = await api.get('/usuarios');
      setUsuarios(res.data);
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
    setFormCrear({ nombre_completo: '', email: '', password: '', rol: 'Empleado', admin_password: '' });
    setPermisosLocales({ view: {}, mod: {} });
    setModalCrear(true);
  };

  const openModalEditar = (u) => {
    setUsuarioSeleccionado(u);
    setFormEditar({ nombre_completo: u.nombre_completo, email: u.email, rol: u.rol || 'Empleado', nueva_password: '', admin_password: '' });
    
    const view = {};
    const mod = {};
    MODULOS.forEach(m => {
      view[m] = tieneView(u, m);
      mod[m] = tieneModificador(u, m);
    });
    setPermisosLocales({ view, mod });
    setModalEditar(true);
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
    if (!usuarioSeleccionado) return;
    if (!formEditar.admin_password) return alert("Debes ingresar tu contraseña de Administrador.");

    try {
      await api.put(`/usuarios/${usuarioSeleccionado.id}`, {
        nombre_completo: formEditar.nombre_completo,
        email: formEditar.email,
        rol: formEditar.rol,
        categorias: procesarCategoriasParaGuardar(),
        nueva_password: formEditar.nueva_password,
        admin_password: formEditar.admin_password
      });
      setModalEditar(false);
      fetchUsuarios();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar los cambios');
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!formCrear.admin_password) return alert("Debes ingresar tu contraseña de Administrador.");

    try {
      await api.post('/usuarios', {
        nombre_completo: formCrear.nombre_completo,
        email: formCrear.email,
        password: formCrear.password,
        rol: formCrear.rol,
        categorias: procesarCategoriasParaGuardar(),
        admin_password: formCrear.admin_password
      });
      setModalCrear(false);
      fetchUsuarios();
    } catch (err) { 
      alert(err.response?.data?.error || 'Error al crear'); 
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
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><UserPlus size={24} className="text-blue-600" /> Usuarios</h1>
        {esAdmin() && (
          <button onClick={handleOpenCrear} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"><Plus size={20} /> Nuevo Usuario</button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
            <tr>
              <th className="px-6 py-3">Nombre</th><th className="px-6 py-3">Email</th><th className="px-6 py-3">Rol</th><th className="px-6 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? <tr><td colSpan="4" className="text-center py-8">Cargando...</td></tr> : 
             usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{u.nombre_completo}</td>
                <td className="px-6 py-4">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.rol === 'Administrador' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {u.rol}
                  </span>
                </td>
                <td className="px-6 py-4 flex justify-center gap-2">
                  <button onClick={() => openModalDetalles(u)} className="p-1.5 text-gray-400 hover:text-blue-600" title="Ver Detalles"><Eye size={18} /></button>
                  {esAdmin() && usuarioActual?.id !== u.id && (
                    <>
                      <button onClick={() => openModalEditar(u)} className="p-1.5 text-gray-400 hover:text-yellow-600" title="Editar y Accesos"><Edit size={18} /></button>
                      <button onClick={() => { setUsuarioSeleccionado(u); setModalEliminar(true); }} className="p-1.5 text-gray-400 hover:text-red-500" title="Eliminar"><Trash2 size={18} /></button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between mb-4 border-b pb-3"><h2 className="text-xl font-bold">Detalles de Usuario</h2><button onClick={() => setModalDetalles(false)}><X size={24} className="text-gray-400 hover:text-gray-600"/></button></div>
            <div className="space-y-4">
              <div><label className="text-xs text-gray-500 font-bold uppercase">Nombre</label><div className="bg-gray-50 p-2 rounded border">{usuarioSeleccionado.nombre_completo}</div></div>
              <div><label className="text-xs text-gray-500 font-bold uppercase">Email</label><div className="bg-gray-50 p-2 rounded border">{usuarioSeleccionado.email}</div></div>
              <div><label className="text-xs text-gray-500 font-bold uppercase">Rol</label><div className="mt-1"><span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">{usuarioSeleccionado.rol}</span></div></div>
              <div className="pt-2"><label className="text-xs text-gray-500 font-bold uppercase mb-2 block">Módulos Activos (Accesos)</label>
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

      {/* MODAL EDITAR Y CREAR (DISEÑO UNIFICADO TIPO TARJETAS) */}
      {(modalEditar || modalCrear) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b flex justify-between bg-white z-10 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800">{modalCrear ? 'Registrar Nuevo Usuario' : 'Editar Perfil y Accesos'}</h2>
              <button onClick={() => modalCrear ? setModalCrear(false) : setModalEditar(false)}><X size={24} className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            
            <form onSubmit={modalCrear ? handleCrear : handleGuardarEditarCompleto} className="overflow-y-auto p-6 bg-gray-50 space-y-8">
              {/* SECCIÓN 1: PERFIL */}
              <div className="bg-white p-5 rounded-lg border shadow-sm">
                <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Datos Básicos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
                    <input className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" value={modalCrear ? formCrear.nombre_completo : formEditar.nombre_completo} onChange={e => modalCrear ? setFormCrear({...formCrear, nombre_completo: e.target.value}) : setFormEditar({...formEditar, nombre_completo: e.target.value})} required/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                    <input type="email" className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" value={modalCrear ? formCrear.email : formEditar.email} onChange={e => modalCrear ? setFormCrear({...formCrear, email: e.target.value}) : setFormEditar({...formEditar, email: e.target.value})} required/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Rol</label>
                    <select className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={modalCrear ? formCrear.rol : formEditar.rol} onChange={e => modalCrear ? setFormCrear({...formCrear, rol: e.target.value}) : setFormEditar({...formEditar, rol: e.target.value})}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: TARJETAS DE ACCESO */}
              <div>
                <h3 className="font-bold text-gray-700 mb-4">Gestión de Módulos (Accesos)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MODULOS.map(mod => (
                    <div key={mod} className={`p-4 rounded-lg border transition-all ${permisosLocales.view[mod] ? 'bg-white shadow-sm border-blue-200' : 'bg-gray-100 border-gray-200'}`}>
                      <h4 className={`font-bold mb-3 ${permisosLocales.view[mod] ? 'text-blue-700' : 'text-gray-500'}`}>{mod}</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Ver Módulo</span>
                          <ToggleSwitch checked={permisosLocales.view[mod]} onChange={() => togglePermiso('view', mod)} />
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className={`text-sm ${permisosLocales.view[mod] ? 'text-gray-600' : 'text-gray-400'}`}>Editar / Crear</span>
                          <ToggleSwitch checked={permisosLocales.mod[mod]} onChange={() => togglePermiso('mod', mod)} disabled={!permisosLocales.view[mod]} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECCIÓN 3: SEGURIDAD Y GUARDADO */}
              <div className="bg-white p-5 rounded-lg border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-gray-700 mb-2 border-b pb-2">{modalCrear ? 'Contraseña Inicial' : 'Resetear Contraseña'}</h3>
                  <p className="text-xs text-gray-500 mb-2">{modalCrear ? 'Asigna una contraseña para el nuevo usuario.' : 'Déjalo en blanco si no deseas cambiarla.'}</p>
                  <input type="password" placeholder={modalCrear ? "Contraseña requerida..." : "Nueva contraseña..."} className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" required={modalCrear} value={modalCrear ? formCrear.password : formEditar.nueva_password} onChange={e => modalCrear ? setFormCrear({...formCrear, password: e.target.value}) : setFormEditar({...formEditar, nueva_password: e.target.value})}/>
                </div>
                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-1"><ShieldCheck size={18}/> Confirmación Requerida</h3>
                  <input type="password" placeholder="Tu contraseña de administrador..." className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" required value={modalCrear ? formCrear.admin_password : formEditar.admin_password} onChange={e => modalCrear ? setFormCrear({...formCrear, admin_password: e.target.value}) : setFormEditar({...formEditar, admin_password: e.target.value})}/>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => modalCrear ? setModalCrear(false) : setModalEditar(false)} className="w-1/3 border border-gray-300 py-3 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="w-2/3 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">{modalCrear ? 'Confirmar y Crear Usuario' : 'Guardar Todos los Cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {modalEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600"><AlertTriangle size={24} /></div>
            <h3 className="text-lg font-bold">¿Eliminar usuario?</h3>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalEliminar(false)} className="flex-1 border py-2 rounded">Cancelar</button>
              <button onClick={handleEliminar} className="flex-1 bg-red-600 text-white py-2 rounded">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Usuarios;