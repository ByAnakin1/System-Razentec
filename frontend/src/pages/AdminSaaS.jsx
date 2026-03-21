import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Building2, Server, Power, Plus, ShieldCheck, CheckCircle, AlertTriangle, X, Mail } from 'lucide-react';

const AdminSaaS = () => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    nombre_empresa: '', ruc: '', admin_nombre: '', admin_email: '', admin_password: ''
  });

  const showToast = (type, message) => { setToast({ type, message }); setTimeout(() => setToast(null), 3000); };

  const fetchEmpresas = async () => {
    setLoading(true);
    try {
      const res = await api.get('/empresas');
      setEmpresas(res.data);
    } catch (error) {
      showToast('error', 'Error al cargar las empresas inquilinas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmpresas(); }, []);

  const handleCrearEmpresa = async (e) => {
    e.preventDefault();
    try {
      await api.post('/empresas', formData);
      showToast('success', '¡Cliente registrado con éxito!');
      setIsModalOpen(false);
      setFormData({ nombre_empresa: '', ruc: '', admin_nombre: '', admin_email: '', admin_password: '' });
      fetchEmpresas();
    } catch (error) {
      showToast('error', error.response?.data?.error || 'Error al registrar al cliente');
    }
  };

  const toggleEstado = async (id, estadoActual) => {
    try {
      await api.put(`/empresas/${id}/estado`, { estado: !estadoActual });
      fetchEmpresas();
      showToast('success', `Empresa ${!estadoActual ? 'Reactivada' : 'Suspendida'}`);
    } catch (error) {
      showToast('error', 'Error al cambiar el estado');
    }
  };

  return (
    <Layout title="Centro de Comando SaaS" moduleIcon={<Server/>}>
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white animate-fade-in-down backdrop-blur-md border ${toast.type === 'success' ? 'bg-emerald-600/90 border-emerald-500' : 'bg-red-600/90 border-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle size={20}/> : <AlertTriangle size={20}/>}
          <p className="font-bold text-sm tracking-wide">{toast.message}</p>
        </div>
      )}

      {/* ✨ HEADER DE ESTADÍSTICAS (LIQUID GLASS ADAPTADO A AZULADO) ✨ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Tarjeta 1: Total (Deep Blue Glass) */}
        <div className="bg-gradient-to-br from-blue-950/80 to-blue-900/90 dark:from-blue-950/40 dark:to-blue-900/40 backdrop-blur-2xl p-6 rounded-[2rem] shadow-xl relative overflow-hidden border border-blue-800/50 dark:border-white/5 transition-colors duration-300">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <p className="text-xs font-extrabold text-blue-300 dark:text-blue-400 uppercase tracking-widest mb-1 relative z-10">Total Clientes</p>
          <p className="text-4xl font-black text-white relative z-10 tracking-tight">{empresas.length}</p>
        </div>

        {/* Tarjeta 2: Activos (Transparent Blue Glass) */}
        <div className="bg-white/50 dark:bg-blue-950/20 backdrop-blur-2xl border border-white/60 dark:border-white/5 p-6 rounded-[2rem] shadow-sm flex flex-col justify-center transition-colors duration-300 relative overflow-hidden">
          <p className="text-xs font-extrabold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-widest mb-1 relative z-10">Activos</p>
          <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 relative z-10 tracking-tight">{empresas.filter(e => e.estado).length}</p>
        </div>

        {/* Tarjeta 3: Acción (Azure Action Glass) */}
        <div className="bg-white/40 dark:bg-blue-900/10 backdrop-blur-2xl border border-white/50 dark:border-white/5 p-5 rounded-[2rem] shadow-sm flex flex-col justify-center items-start transition-colors duration-300">
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600/90 hover:bg-blue-600 text-white w-full py-4 rounded-xl font-black shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 backdrop-blur-md border border-white/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2 tracking-wide text-sm">
            <Plus size={20}/> Registrar Nuevo Cliente
          </button>
        </div>
      </div>

      {/* ✨ TABLA DE INQUILINOS (LIQUID GLASS ADAPTADO A AZULADO) ✨ */}
      <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_40px_rgb(29,78,216,0.1)] border border-white/80 dark:border-white/5 overflow-hidden transition-colors duration-300">
        
        <div className="p-6 border-b border-gray-200/50 dark:border-white/5 flex justify-between items-center bg-transparent">
          <h2 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2 tracking-tight transition-colors"><Building2 className="text-blue-600 dark:text-blue-400"/> Empresas Inquilinas</h2>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 dark:bg-blue-950/30 text-slate-500 dark:text-blue-300 uppercase font-extrabold tracking-widest text-[10px] border-b border-gray-200/50 dark:border-white/5 transition-colors">
              <tr>
                <th className="px-6 py-5">Empresa (Tenant)</th>
                <th className="px-6 py-5">RUC</th>
                <th className="px-6 py-5">Fecha de Alta</th>
                <th className="px-6 py-5 text-center">Estado del Servicio</th>
                <th className="px-6 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            {/* ✨ Cambios Críticos de Color en la divide y en la hover ✨ */}
            <tbody className="divide-y divide-gray-100/50 dark:divide-white/5 relative">
              {loading ? <tr><td colSpan="5" className="text-center py-12 text-gray-400 font-medium">Cargando inquilinos...</td></tr> : 
               empresas.length === 0 ? <tr><td colSpan="5" className="text-center py-12 italic text-gray-400 dark:text-blue-700/60">No tienes clientes registrados. ¡Hora de vender!</td></tr> :
               empresas.map((emp) => (
                <tr key={emp.id} className={`transition-colors duration-200 relative ${!emp.estado ? 'bg-red-50/20 dark:bg-red-950/20 opacity-70' : 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10'}`}>
                  <td className="px-6 py-5 font-extrabold text-gray-900 dark:text-slate-100 text-base transition-colors relative z-10">
                    {emp.nombre}
                    <div className="text-[10px] text-gray-400 dark:text-blue-600 font-medium font-mono mt-0.5 tracking-tighter">{emp.id}</div>
                  </td>
                  <td className="px-6 py-5 font-mono text-gray-500 dark:text-blue-400 font-bold transition-colors">{emp.ruc || 'S/C'}</td>
                  <td className="px-6 py-5 text-xs font-bold text-gray-400 dark:text-blue-600 transition-colors">{new Date(emp.created_at).toLocaleDateString('es-PE')}</td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border backdrop-blur-md transition-colors ${emp.estado ? 'bg-emerald-100/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50' : 'bg-red-100/50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-800/50'}`}>
                      {emp.estado ? 'Al Día (Activo)' : 'Suspendido'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button onClick={() => toggleEstado(emp.id, emp.estado)} className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-sm backdrop-blur-md flex items-center gap-1.5 mx-auto active:scale-95 ${emp.estado ? 'bg-red-50/50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/50 border border-red-200/50 dark:border-red-800/50' : 'bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/50 border border-emerald-200/50 dark:border-emerald-800/50'}`}>
                      <Power size={14}/> {emp.estado ? 'Suspender Servicio' : 'Reactivar Servicio'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✨ MODAL CREAR INQUILINO (LIQUID GLASS ADAPTADO A AZULADO) ✨ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md animate-fade-in transition-colors duration-300">
          <div className="bg-white/90 dark:bg-blue-950/80 backdrop-blur-3xl rounded-[2.5rem] w-full max-w-3xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden border border-white/50 dark:border-white/10 transition-colors duration-300">
            
            <div className="bg-slate-900/95 dark:bg-slate-950/95 p-6 flex justify-between items-center text-white relative overflow-hidden border-b border-white/5 dark:border-white/5">
               <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
               <div className="relative z-10">
                 <h2 className="text-xl font-black flex items-center gap-2 tracking-tight"><ShieldCheck className="text-emerald-400"/> Alta de Nuevo Cliente (Tenant)</h2>
                 <p className="text-xs text-blue-200/70 font-bold mt-1 uppercase tracking-widest">Creación de Empresa y Cuenta Maestra</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white bg-white/5 p-2 rounded-full z-10 transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleCrearEmpresa} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Datos de la Empresa (Azure Glass) */}
                <div className="space-y-4 bg-slate-50/50 dark:bg-blue-900/10 p-6 rounded-3xl border border-gray-200/50 dark:border-white/5 shadow-sm transition-colors duration-300 relative overflow-hidden">
                   <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
                  <h3 className="font-black text-gray-800 dark:text-white text-sm uppercase tracking-widest border-b border-gray-200/50 dark:border-white/5 pb-3 flex items-center gap-2 transition-colors relative z-10"><Building2 size={16} className="text-blue-500"/> Datos del Negocio</h3>
                  <div className="relative z-10">
                    <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300 uppercase tracking-widest mb-1.5 block transition-colors">Nombre Comercial / Razón Social *</label>
                    <input required className="w-full border border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-blue-950/30 p-3.5 rounded-xl font-bold text-gray-800 dark:text-white focus:bg-white dark:focus:bg-blue-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={formData.nombre_empresa} onChange={e => setFormData({...formData, nombre_empresa: e.target.value})} placeholder="Ej: Pollería El Buen Sabor"/>
                  </div>
                  <div className="relative z-10">
                    <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300 uppercase tracking-widest mb-1.5 block transition-colors">RUC (Opcional)</label>
                    <input className="w-full border border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-blue-950/30 p-3.5 rounded-xl font-bold text-gray-800 dark:text-white focus:bg-white dark:focus:bg-blue-950 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={formData.ruc} onChange={e => setFormData({...formData, ruc: e.target.value})} placeholder="11 dígitos"/>
                  </div>
                </div>

                {/* Cuenta del Administrador (Deep Blue Action Glass) */}
                <div className="space-y-4 bg-blue-50/50 dark:bg-blue-900/30 p-6 rounded-3xl border border-blue-100/80 dark:border-blue-500/20 shadow-sm transition-colors duration-300 relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
                  <h3 className="font-black text-blue-900 dark:text-blue-100 text-sm uppercase tracking-widest border-b border-blue-200/50 dark:border-blue-500/20 pb-3 flex items-center gap-2 relative z-10 transition-colors"><ShieldCheck size={16} className="text-blue-600 dark:text-blue-400"/> Cuenta Administrador</h3>
                  <div className="relative z-10">
                    <label className="text-[10px] font-extrabold text-blue-600/80 dark:text-blue-100 uppercase tracking-widest mb-1.5 block transition-colors">Nombre del Dueño/Gerente *</label>
                    <input required className="w-full border border-blue-200/80 dark:border-blue-700/50 bg-white/70 dark:bg-blue-950/50 p-3.5 rounded-xl font-bold text-gray-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={formData.admin_nombre} onChange={e => setFormData({...formData, admin_nombre: e.target.value})} placeholder="Ej: Carlos Mendoza"/>
                  </div>
                  <div className="relative z-10">
                    <label className="text-[10px] font-extrabold text-blue-600/80 dark:text-blue-100 uppercase tracking-widest mb-1.5 block transition-colors">Correo (Login) *</label>
                    <div className="relative">
                       <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-blue-600" size={18}/>
                       <input type="email" required className="w-full border border-blue-200/80 dark:border-blue-700/50 bg-white/70 dark:bg-blue-950/50 pl-11 pr-3.5 py-3.5 rounded-xl font-bold text-gray-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={formData.admin_email} onChange={e => setFormData({...formData, admin_email: e.target.value})} placeholder="admin@empresa.com"/>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <label className="text-[10px] font-extrabold text-blue-600/80 dark:text-blue-100 uppercase tracking-widest mb-1.5 block transition-colors">Contraseña Inicial *</label>
                    <input type="password" required minLength="6" className="w-full border border-blue-200/80 dark:border-blue-700/50 bg-white/70 dark:bg-blue-950/50 p-3.5 rounded-xl font-bold text-gray-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" value={formData.admin_password} onChange={e => setFormData({...formData, admin_password: e.target.value})} placeholder="Mínimo 6 caracteres"/>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200/50 dark:border-white/5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border border-gray-200 dark:border-blue-800/50 bg-white/50 dark:bg-blue-950/30 rounded-xl font-extrabold text-gray-600 dark:text-blue-300 hover:bg-gray-50 dark:hover:bg-blue-950/50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-slate-900/95 dark:bg-blue-600 text-white font-black py-4 rounded-xl shadow-xl shadow-slate-900/20 dark:shadow-blue-900/30 hover:bg-blue-600 dark:hover:bg-blue-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-slate-800/50 dark:border-blue-500"><Server size={18}/> Desplegar Entorno</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminSaaS;