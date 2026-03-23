// src/pages/AdminSaaS.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Building2, Server, Power, Plus, ShieldCheck, CheckCircle, AlertTriangle, X, Mail, CreditCard, DollarSign, CalendarDays, Package } from 'lucide-react';

const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const AdminSaaS = () => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    nombre_empresa: '', ruc: '', admin_nombre: '', admin_email: '', admin_password: ''
  });

  // ✨ Estados para el nuevo Modal de Asignar Plan ✨
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planes, setPlanes] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [assignFormData, setAssignFormData] = useState({
    plan_id: '', monto: '', proximo_pago: ''
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

  // Cargar planes de pago para el modal
  const fetchPlanes = async () => {
    try {
      const res = await api.get('/planes');
      setPlanes(res.data);
    } catch (error) {
      showToast('error', 'Error al cargar los planes de pago');
    }
  };

  useEffect(() => { 
    fetchEmpresas();
    fetchPlanes(); // Cargamos planes al inicio
  }, []);

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

  // ✨ Funciones para el nuevo Modal de Asignar Plan ✨
  const openPlanModal = (empresa) => {
    setSelectedEmpresa(empresa);
    // Reiniciamos el formulario
    setAssignFormData({ plan_id: '', monto: '', proximo_pago: '' });
    setIsPlanModalOpen(true);
  };

  const handlePlanSelect = (planId) => {
    const selectedPlan = planes.find(p => p.id === parseInt(planId));
    if (selectedPlan) {
      // Sugerimos el monto del plan y la fecha de hoy + 1 mes
      const today = new Date();
      const nextMonth = new Date(today.setMonth(today.getMonth() + 1));
      
      setAssignFormData({
        ...assignFormData,
        plan_id: planId,
        monto: selectedPlan.precio.toString(),
        proximo_pago: nextMonth.toISOString().split('T')[0] // Formato YYYY-MM-DD
      });
    }
  };

  const handleAsignarPlan = async (e) => {
    e.preventDefault();
    if (!selectedEmpresa || !assignFormData.plan_id) return;

    try {
      const payload = {
        empresa_id: selectedEmpresa.id, // UUID
        ...assignFormData,
        monto: parseFloat(assignFormData.monto)
      };
      
      await api.post('/suscripciones/asignar', payload);
      
      showToast('success', `Plan asignado exitosamente a ${selectedEmpresa.nombre}`);
      setIsPlanModalOpen(false);
      fetchEmpresas(); // Recargamos para ver cambios si mostramos info de plan en tabla
    } catch (error) {
      showToast('error', error.response?.data?.error || 'Error al asignar el plan de pago');
    }
  };

  return (
    <Layout title="Centro de Comando" moduleIcon={<Server/>}>
      {/* ✨ TOAST (LIQUID GLASS) ✨ */}
      {toast && (
        <div className={`fixed top-4 right-4 md:top-auto md:bottom-10 md:right-10 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-white animate-fade-in-down md:animate-fade-in-up backdrop-blur-xl border border-white/20 transition-colors ${toast.type === 'success' ? 'bg-emerald-600/95' : 'bg-red-600/95'}`}>
          {toast.type === 'success' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
          <p className="font-bold text-xs md:text-sm tracking-wide">{toast.message}</p>
        </div>
      )}

      {/* ✨ HEADER DE ESTADÍSTICAS Y BOTÓN (LIQUID GLASS MÓVIL/PC) ✨ */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
        
        {/* Tarjeta 1: Total */}
        <div className="bg-gradient-to-br from-blue-950/90 to-blue-900/90 dark:from-blue-950/60 dark:to-blue-900/60 backdrop-blur-2xl p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-xl relative overflow-hidden border border-blue-800/50 dark:border-white/5 transition-colors duration-300">
          <div className="absolute -right-10 -top-10 w-24 h-24 md:w-40 md:h-40 bg-blue-500/20 rounded-full blur-2xl md:blur-3xl pointer-events-none"></div>
          <p className="text-[9px] md:text-xs font-extrabold text-blue-300 dark:text-blue-400 uppercase tracking-widest mb-1 relative z-10">Total Clientes</p>
          <p className="text-2xl md:text-4xl font-black text-white relative z-10 tracking-tight">{empresas.length}</p>
        </div>

        {/* Tarjeta 2: Activos */}
        <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl border border-white/80 dark:border-white/5 p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center transition-colors duration-300 relative overflow-hidden">
          <p className="text-[9px] md:text-xs font-extrabold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-widest mb-1 relative z-10">Activos</p>
          <p className="text-2xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400 relative z-10 tracking-tight">{empresas.filter(e => e.estado).length}</p>
        </div>

        {/* Botón de Acción (Ocupa ancho completo en móvil) */}
        <div className="col-span-2 md:col-span-1 bg-white/40 dark:bg-blue-900/10 backdrop-blur-2xl border border-white/50 dark:border-white/5 p-3 md:p-5 rounded-2xl md:rounded-[2rem] shadow-sm flex flex-col justify-center items-start transition-colors duration-300">
          <button onClick={() => setIsModalOpen(true)} className="w-full py-3 md:py-4 bg-blue-600/90 dark:bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 backdrop-blur-md border border-transparent dark:border-white/10 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <Plus size={16} className="md:w-5 md:h-5"/> <span className="hidden sm:inline">Registrar Nuevo Cliente</span><span className="sm:hidden">Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* ✨ VISTA TÁCTIL (Móvil y Tablet) ✨ */}
      <div className="md:hidden flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-blue-300/70 transition-colors">
             <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
             <p className="text-[10px] font-extrabold uppercase tracking-widest transition-colors">Cargando inquilinos...</p>
          </div>
        ) : empresas.length === 0 ? (
          <div className="text-center py-16 bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] border border-gray-100/50 dark:border-white/5 shadow-sm flex flex-col items-center transition-colors">
            <Building2 size={48} className="text-gray-300 dark:text-slate-600 mb-3" strokeWidth={1.5}/>
            <p className="text-sm font-black text-gray-600 dark:text-white transition-colors">No tienes clientes registrados.</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium transition-colors">¡Hora de vender!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-24">
            {empresas.map((emp) => (
              <div key={emp.id} className={`bg-white/60 dark:bg-blue-950/20 backdrop-blur-xl rounded-[1.5rem] border border-gray-200/50 dark:border-white/5 p-4 shadow-sm relative overflow-hidden transition-colors ${!emp.estado ? 'opacity-70 grayscale-[50%]' : ''}`}>
                 <div className="flex justify-between items-start mb-3 border-b border-dashed border-gray-200/50 dark:border-slate-700 pb-3 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/50 dark:border-blue-500/20 backdrop-blur-md transition-colors font-black text-base">
                          {emp.nombre.charAt(0)}
                       </div>
                       <div className="min-w-0 pr-2">
                         <p className="font-extrabold text-gray-800 dark:text-white text-sm leading-tight truncate transition-colors">{emp.nombre}</p>
                         <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 font-mono mt-0.5 tracking-widest uppercase transition-colors">ID: {emp.id}</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl border border-gray-100/50 dark:border-white/5 mb-3 grid grid-cols-2 gap-2 backdrop-blur-md transition-colors">
                    <div className="flex flex-col items-start gap-1 overflow-hidden">
                      <span className="text-[9px] font-extrabold uppercase text-gray-400 dark:text-slate-500 tracking-widest transition-colors">RUC</span>
                      <span className="text-[10px] font-bold text-gray-600 dark:text-slate-300 font-mono truncate transition-colors">{emp.ruc || 'S/C'}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1 overflow-hidden">
                      <span className="text-[9px] font-extrabold uppercase text-gray-400 dark:text-slate-500 tracking-widest transition-colors">Registro</span>
                      <span className="text-[10px] font-bold text-gray-600 dark:text-slate-300 truncate transition-colors">{new Date(emp.created_at).toLocaleDateString('es-PE')}</span>
                    </div>
                 </div>

                 <div className="flex flex-col gap-2">
                   <div className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border backdrop-blur-md text-center transition-colors ${emp.estado ? 'bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50' : 'bg-red-50/80 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-800/50'}`}>
                     {emp.estado ? 'Al Día (Activo)' : 'Suspendido'}
                   </div>
                   
                   <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => toggleEstado(emp.id, emp.estado)} className={`w-full py-2.5 rounded-xl text-[11px] font-extrabold transition-all shadow-sm backdrop-blur-md flex items-center justify-center gap-1.5 active:scale-95 ${emp.estado ? 'bg-red-50/80 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/50 border border-transparent dark:border-red-800/50' : 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/50 border border-transparent dark:border-emerald-800/50'}`}>
                       <Power size={14}/> {emp.estado ? 'Suspender' : 'Reactivar'}
                     </button>
                     
                     {emp.estado && (
                       <button onClick={() => openPlanModal(emp)} className="w-full py-2.5 rounded-xl text-[11px] font-extrabold transition-all shadow-sm backdrop-blur-md flex items-center justify-center gap-1.5 active:scale-95 bg-white/70 dark:bg-slate-800/80 border border-gray-200/50 dark:border-white/10 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700">
                          <CreditCard size={14} className="text-blue-500 dark:text-blue-400"/> Asignar Plan
                       </button>
                     )}
                   </div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✨ VISTA PC: Tabla (Visible en md/lg en adelante) ✨ */}
      <div className="hidden md:block bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_40px_rgb(29,78,216,0.1)] border border-white/80 dark:border-white/5 overflow-hidden transition-colors duration-300">
        <div className="p-5 md:p-6 border-b border-gray-200/50 dark:border-white/5 flex justify-between items-center bg-transparent transition-colors">
          <h2 className="text-base md:text-lg font-black text-gray-800 dark:text-white flex items-center gap-2 tracking-tight transition-colors"><Building2 className="text-blue-600 dark:text-blue-400" size={20}/> Empresas Inquilinas</h2>
        </div>
        
        <div className={`overflow-x-auto ${hideScrollbar}`}>
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
            <tbody className="divide-y divide-gray-100/50 dark:divide-white/5 relative bg-transparent transition-colors">
              {loading ? <tr><td colSpan="5" className="text-center py-12 text-gray-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest transition-colors">Cargando inquilinos...</td></tr> : 
               empresas.length === 0 ? <tr><td colSpan="5" className="text-center py-12 italic text-gray-400 dark:text-slate-500 font-medium transition-colors">No tienes clientes registrados. ¡Hora de vender!</td></tr> :
               empresas.map((emp) => (
                <tr key={emp.id} className={`transition-colors duration-200 group ${!emp.estado ? 'bg-red-50/10 dark:bg-red-950/20' : 'hover:bg-white/50 dark:hover:bg-blue-900/10'}`}>
                  <td className="px-6 py-5 font-extrabold text-gray-900 dark:text-slate-100 text-sm md:text-base transition-colors relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors ${emp.estado ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-500/20' : 'bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100/50 dark:border-red-500/20'}`}>
                        {emp.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        {emp.nombre}
                        <div className="text-[9px] text-gray-400 dark:text-slate-500 font-bold font-mono mt-0.5 tracking-widest uppercase transition-colors">ID: {emp.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-mono text-gray-500 dark:text-slate-400 font-bold transition-colors">{emp.ruc || 'S/C'}</td>
                  <td className="px-6 py-5 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest transition-colors">{new Date(emp.created_at).toLocaleDateString('es-PE')}</td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border backdrop-blur-md transition-colors ${emp.estado ? 'bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20' : 'bg-red-50/80 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-500/20'}`}>
                      {emp.estado ? 'Al Día (Activo)' : 'Suspendido'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex justify-center gap-2 mx-auto">
                      <button onClick={() => toggleEstado(emp.id, emp.estado)} className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-sm backdrop-blur-md flex items-center justify-center gap-1.5 active:scale-95 border ${emp.estado ? 'bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100/80 dark:hover:bg-red-900/50 border-transparent dark:border-red-500/20' : 'bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 border-transparent dark:border-emerald-500/20'}`}>
                        <Power size={14}/> {emp.estado ? 'Suspender' : 'Reactivar'}
                      </button>
                      
                      {emp.estado && (
                         <button onClick={() => openPlanModal(emp)} className="px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-sm backdrop-blur-md flex items-center justify-center gap-1.5 active:scale-95 bg-white/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-white/10 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700">
                           <CreditCard size={14} className="text-blue-600 dark:text-blue-400"/> Asignar Plan
                         </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✨ MODAL CREAR INQUILINO (Existente) ✨ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in transition-colors duration-300">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-3xl sm:rounded-[2.5rem] w-full max-w-3xl shadow-2xl flex flex-col h-[95vh] sm:h-auto sm:max-h-[90vh] animate-fade-in-up overflow-hidden border border-white/50 dark:border-white/10 transition-colors duration-300">
            
            <div className="bg-slate-900 dark:bg-slate-950 p-5 md:p-6 flex justify-between items-center text-white relative overflow-hidden border-b border-white/10 dark:border-white/5 shrink-0 transition-colors">
               <div className="w-12 h-1.5 bg-white/20 rounded-full absolute top-2 left-1/2 -translate-x-1/2 sm:hidden z-20"></div>
               <div className="absolute -right-10 -top-10 w-32 h-32 md:w-40 md:h-40 bg-blue-500 rounded-full blur-2xl md:blur-3xl opacity-20 pointer-events-none"></div>
               <div className="relative z-10 mt-2 sm:mt-0">
                 <h2 className="text-lg md:text-xl font-black flex items-center gap-2 tracking-tight"><ShieldCheck className="text-emerald-400" size={20}/> Alta de Nuevo Cliente</h2>
                 <p className="text-[10px] md:text-xs text-blue-200/70 font-bold mt-1 uppercase tracking-widest">Creación de Empresa y Cuenta Maestra</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full z-10 transition-colors"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleCrearEmpresa} className={`p-4 md:p-8 overflow-y-auto ${hideScrollbar} flex-1 flex flex-col`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 flex-1">
                
                {/* Datos de la Empresa */}
                <div className="space-y-4 bg-white/50 dark:bg-blue-900/10 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100/50 dark:border-white/5 shadow-sm transition-colors duration-300 relative overflow-hidden">
                   <div className="absolute -left-4 -bottom-4 w-20 h-20 md:w-24 md:h-24 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
                  <h3 className="font-black text-gray-800 dark:text-white text-xs md:text-sm uppercase tracking-widest border-b border-gray-200/50 dark:border-white/5 pb-2.5 md:pb-3 flex items-center gap-2 transition-colors relative z-10"><Building2 size={16} className="text-blue-500 dark:text-blue-400"/> Datos del Negocio</h3>
                  
                  <div className="relative z-10">
                    <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block transition-colors">Razón Social *</label>
                    <input required autoFocus className="w-full bg-white/80 dark:bg-blue-950/30 backdrop-blur-md border border-gray-200/80 dark:border-white/10 p-3 md:p-3.5 rounded-xl font-bold text-gray-800 dark:text-white focus:bg-white dark:focus:bg-blue-950 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm text-xs md:text-sm" value={formData.nombre_empresa} onChange={e => setFormData({...formData, nombre_empresa: e.target.value})} placeholder="Ej: Pollería El Buen Sabor"/>
                  </div>
                  <div className="relative z-10">
                    <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block transition-colors">RUC (Opcional)</label>
                    <input type="text" inputMode="numeric" className="w-full bg-white/80 dark:bg-blue-950/30 backdrop-blur-md border border-gray-200/80 dark:border-white/10 p-3 md:p-3.5 rounded-xl font-bold text-gray-800 dark:text-white focus:bg-white dark:focus:bg-blue-950 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm text-xs md:text-sm tracking-wider" value={formData.ruc} onChange={e => setFormData({...formData, ruc: e.target.value.replace(/\D/g, '').slice(0, 11)})} placeholder="11 dígitos"/>
                  </div>
                </div>

                {/* Cuenta del Administrador */}
                <div className="space-y-4 bg-blue-50/80 dark:bg-blue-900/30 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-blue-100/50 dark:border-blue-500/20 shadow-sm transition-colors duration-300 relative overflow-hidden backdrop-blur-md">
                  <div className="absolute -right-4 -bottom-4 w-20 h-20 md:w-24 md:h-24 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
                  <h3 className="font-black text-blue-900 dark:text-blue-100 text-xs md:text-sm uppercase tracking-widest border-b border-blue-200/50 dark:border-blue-500/20 pb-2.5 md:pb-3 flex items-center gap-2 relative z-10 transition-colors"><ShieldCheck size={16} className="text-blue-600 dark:text-blue-400"/> Cuenta Administrador</h3>
                  
                  <div className="relative z-10">
                    <label className="text-[10px] font-extrabold text-blue-600/80 dark:text-blue-200/70 uppercase tracking-widest mb-1.5 block transition-colors">Gerente General *</label>
                    <input required className="w-full border border-blue-200/80 dark:border-blue-700/50 bg-white/90 dark:bg-blue-950/50 p-3 md:p-3.5 rounded-xl font-bold text-gray-800 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm text-xs md:text-sm" value={formData.admin_nombre} onChange={e => setFormData({...formData, admin_nombre: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')})} placeholder="Ej: Carlos Mendoza"/>
                  </div>
                  <div className="relative z-10">
                    <label className="text-[10px] font-extrabold text-blue-600/80 dark:text-blue-200/70 uppercase tracking-widest mb-1.5 block transition-colors">Correo (Login) *</label>
                    <div className="relative">
                       <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 dark:text-blue-500 transition-colors" size={16}/>
                       <input type="email" required className="w-full border border-blue-200/80 dark:border-blue-700/50 bg-white/90 dark:bg-blue-950/50 pl-9 pr-3 py-3 md:py-3.5 rounded-xl font-bold text-gray-800 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm text-xs md:text-sm" value={formData.admin_email} onChange={e => setFormData({...formData, admin_email: e.target.value})} placeholder="admin@empresa.com"/>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <label className="text-[10px] font-extrabold text-blue-600/80 dark:text-blue-200/70 uppercase tracking-widest mb-1.5 block transition-colors">Contraseña Inicial *</label>
                    <input type="password" required minLength="6" className="w-full border border-blue-200/80 dark:border-blue-700/50 bg-white/90 dark:bg-blue-950/50 p-3 md:p-3.5 rounded-xl font-bold text-gray-800 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm text-xs md:text-sm tracking-wider" value={formData.admin_password} onChange={e => setFormData({...formData, admin_password: e.target.value})} placeholder="Mínimo 6 caracteres"/>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100/50 dark:border-white/5 transition-colors shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 md:py-4 border border-gray-200/80 dark:border-white/5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl font-extrabold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm shadow-sm active:scale-95">Cancelar</button>
                <button type="submit" className="flex-1 bg-slate-900/95 dark:bg-blue-600 text-white font-black py-3.5 md:py-4 rounded-xl shadow-lg shadow-slate-900/20 dark:shadow-blue-900/40 hover:bg-slate-800 dark:hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 md:gap-2 text-sm border border-transparent dark:border-white/10 backdrop-blur-md"><Server size={16}/> Desplegar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✨ ✨ ✨ NUEVO MODAL: ASIGNAR PLAN DE PAGO (DIOS MODO) ✨ ✨ ✨ */}
      {isPlanModalOpen && selectedEmpresa && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in transition-colors duration-300">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh] animate-fade-in-up overflow-hidden border border-white/50 dark:border-white/10 transition-colors duration-300">
            
            <div className="bg-white dark:bg-blue-950 p-5 md:p-6 flex justify-between items-center text-gray-800 dark:text-white relative overflow-hidden border-b border-gray-100 dark:border-white/5 shrink-0 transition-colors">
               <div className="relative z-10 mt-2 sm:mt-0">
                 <h2 className="text-lg font-black flex items-center gap-2 tracking-tight"><CreditCard className="text-blue-600 dark:text-blue-400" size={20}/> Asignar Plan de Pago</h2>
                 <p className="text-[11px] text-gray-500 dark:text-blue-200/70 font-bold mt-1 uppercase tracking-widest">Negocio: <span className="text-gray-900 dark:text-white transition-colors">{selectedEmpresa.nombre}</span></p>
               </div>
               <button onClick={() => setIsPlanModalOpen(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-100/50 dark:bg-slate-800/50 p-2 rounded-full z-10 transition-colors border border-transparent dark:border-white/10 outline-none"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleAsignarPlan} className={`p-6 md:p-8 overflow-y-auto ${hideScrollbar} flex-1 flex flex-col space-y-5`}>
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1 block transition-colors">Selecciona un Plan SaaS *</label>
                <div className="relative">
                  <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 transition-colors" size={18}/>
                  <select 
                    required 
                    value={assignFormData.plan_id} 
                    onChange={(e) => handlePlanSelect(e.target.value)} 
                    className="w-full bg-white/90 dark:bg-blue-950/30 backdrop-blur-md border border-gray-200 dark:border-white/10 pl-11 pr-5 py-3.5 rounded-xl font-bold text-gray-800 dark:text-white focus:bg-white dark:focus:bg-blue-950 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm text-sm appearance-none cursor-pointer"
                  >
                    <option value="" disabled>-- Selecciona un plan --</option>
                    {planes.map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.nombre} (S/ {parseFloat(plan.precio).toFixed(2)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1 block transition-colors">Cuota Mensual (S/) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 transition-colors" size={18}/>
                    <input type="number" step="0.01" required value={assignFormData.monto} onChange={(e) => setAssignFormData({...assignFormData, monto: e.target.value})} className="w-full bg-white/90 dark:bg-blue-950/30 backdrop-blur-md border border-gray-200 dark:border-white/10 pl-11 pr-5 py-3.5 rounded-xl font-black text-emerald-600 dark:text-emerald-400 focus:bg-white dark:focus:bg-blue-950 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm text-sm" placeholder="100.00"/>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1 block transition-colors">Próximo Pago (Ciclo) *</label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 transition-colors" size={18}/>
                    <input type="date" required value={assignFormData.proximo_pago} onChange={(e) => setAssignFormData({...assignFormData, proximo_pago: e.target.value})} className="w-full bg-white/90 dark:bg-blue-950/30 backdrop-blur-md border border-gray-200 dark:border-white/10 pl-11 pr-5 py-3.5 rounded-xl font-bold text-gray-800 dark:text-white focus:bg-white dark:focus:bg-blue-950 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm text-sm cursor-pointer"/>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex gap-3 items-center mt-2 transition-colors">
                <AlertTriangle className="text-blue-600 dark:text-blue-400 shrink-0" size={24}/>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-200 transition-colors leading-relaxed">
                  Al confirmar, se creará una suscripción activa para <strong className="font-black">{selectedEmpresa.nombre}</strong>. El estado se establecerá como 'Al Día' y se cobrará el monto indicado cada mes.
                </p>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100/50 dark:border-white/5 transition-colors shrink-0">
                <button type="button" onClick={() => setIsPlanModalOpen(false)} className="flex-1 py-4 border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-xl font-black transition-all hover:bg-gray-100 dark:hover:bg-slate-700 text-sm active:scale-95 shadow-sm">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600/90 dark:bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 border border-transparent dark:border-white/10 text-sm"><CheckCircle size={18}/> Confirmar Suscripción</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminSaaS;