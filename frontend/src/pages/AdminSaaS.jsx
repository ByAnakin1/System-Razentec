import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Building2, Server, Power, Plus, ShieldCheck, CheckCircle, AlertTriangle, X, Mail, CreditCard, DollarSign, CalendarDays, Package, Edit, Eye, Key, User } from 'lucide-react';

const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const AdminSaaS = () => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Estados Modal CREAR
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre_empresa: '', ruc: '', admin_nombre: '', admin_email: '', admin_password: ''
  });

  // ✨ Estados Modal EDITAR ✨
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '', nombre_empresa: '', ruc: '', admin_email: '', admin_password: ''
  });

  // ✨ Estados Modal VER (NUEVO) ✨
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewEmpresa, setViewEmpresa] = useState(null);

  // Estados Modal ASIGNAR PLAN
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

  const fetchPlanes = async () => {
    try {
      const res = await api.get('/planes');
      setPlanes(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { 
    fetchEmpresas();
    fetchPlanes();
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

  // ✨ ABRIR MODAL VER ✨
  const openViewModal = (emp) => {
    setViewEmpresa(emp);
    setIsViewModalOpen(true);
  };

  // ✨ ABRIR MODAL EDITAR ✨
  const openEditModal = (emp) => {
    setEditFormData({
      id: emp.id,
      nombre_empresa: emp.nombre,
      ruc: emp.ruc || '',
      admin_email: emp.admin_email || '', // Necesita que el backend mande este campo
      admin_password: '' // Se deja vacío intencionalmente
    });
    setIsEditModalOpen(true);
  };

  const handleEditarEmpresa = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/empresas/${editFormData.id}`, editFormData);
      showToast('success', '¡Datos y credenciales actualizados!');
      setIsEditModalOpen(false);
      fetchEmpresas();
    } catch (error) {
      showToast('error', error.response?.data?.error || 'Error al actualizar');
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

  const openPlanModal = (empresa) => {
    setSelectedEmpresa(empresa);
    setAssignFormData({ plan_id: '', monto: '', proximo_pago: '' });
    setIsPlanModalOpen(true);
  };

  const handlePlanSelect = (planId) => {
    const selectedPlan = planes.find(p => p.id === parseInt(planId));
    if (selectedPlan) {
      const today = new Date();
      const nextMonth = new Date(today.setMonth(today.getMonth() + 1));
      setAssignFormData({
        ...assignFormData,
        plan_id: planId,
        monto: selectedPlan.precio.toString(),
        proximo_pago: nextMonth.toISOString().split('T')[0] 
      });
    }
  };

  const handleAsignarPlan = async (e) => {
    e.preventDefault();
    if (!selectedEmpresa || !assignFormData.plan_id) return;
    try {
      const payload = {
        empresa_id: selectedEmpresa.id,
        ...assignFormData,
        monto: parseFloat(assignFormData.monto)
      };
      await api.post('/suscripciones/asignar', payload);
      showToast('success', `Plan asignado a ${selectedEmpresa.nombre}`);
      setIsPlanModalOpen(false);
      fetchEmpresas(); 
    } catch (error) {
      showToast('error', error.response?.data?.error || 'Error al asignar el plan');
    }
  };

  return (
    <Layout title="Centro de Comando" moduleIcon={<Server/>}>
      {toast && (
        <div className={`fixed top-4 right-4 md:top-auto md:bottom-10 md:right-10 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-white animate-fade-in-down md:animate-fade-in-up backdrop-blur-xl border border-white/20 transition-colors ${toast.type === 'success' ? 'bg-emerald-600/95' : 'bg-red-600/95'}`}>
          {toast.type === 'success' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
          <p className="font-bold text-xs md:text-sm tracking-wide">{toast.message}</p>
        </div>
      )}

      {/* HEADER DE ESTADÍSTICAS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="bg-gradient-to-br from-blue-950/90 to-blue-900/90 dark:from-blue-950/60 dark:to-blue-900/60 backdrop-blur-2xl p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-xl relative overflow-hidden border border-blue-800/50 dark:border-white/5 transition-colors duration-300">
          <div className="absolute -right-10 -top-10 w-24 h-24 md:w-40 md:h-40 bg-blue-500/20 rounded-full blur-2xl md:blur-3xl pointer-events-none"></div>
          <p className="text-[9px] md:text-xs font-extrabold text-blue-300 dark:text-blue-400 uppercase tracking-widest mb-1 relative z-10">Total Clientes</p>
          <p className="text-2xl md:text-4xl font-black text-white relative z-10 tracking-tight">{empresas.length}</p>
        </div>

        <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl border border-white/80 dark:border-white/5 p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center transition-colors duration-300 relative overflow-hidden">
          <p className="text-[9px] md:text-xs font-extrabold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-widest mb-1 relative z-10">Activos</p>
          <p className="text-2xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400 relative z-10 tracking-tight">{empresas.filter(e => e.estado).length}</p>
        </div>

        <div className="col-span-2 md:col-span-1 bg-white/40 dark:bg-blue-900/10 backdrop-blur-2xl border border-white/50 dark:border-white/5 p-3 md:p-5 rounded-2xl md:rounded-[2rem] shadow-sm flex flex-col justify-center items-start transition-colors duration-300">
          <button onClick={() => setIsModalOpen(true)} className="w-full py-3 md:py-4 bg-blue-600/90 dark:bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 backdrop-blur-md border border-transparent dark:border-white/10 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm">
            <Plus size={16} className="md:w-5 md:h-5"/> <span className="hidden sm:inline">Registrar Nuevo Cliente</span><span className="sm:hidden">Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* VISTA TÁCTIL (Móvil y Tablet) */}
      <div className="md:hidden flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-blue-300/70">
             <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
             <p className="text-[10px] font-extrabold uppercase tracking-widest">Cargando inquilinos...</p>
          </div>
        ) : empresas.length === 0 ? (
          <div className="text-center py-16 bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] border border-gray-100/50 dark:border-white/5 shadow-sm flex flex-col items-center">
            <Building2 size={48} className="text-gray-300 dark:text-slate-600 mb-3" strokeWidth={1.5}/>
            <p className="text-sm font-black text-gray-600 dark:text-white">No tienes clientes registrados.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-24">
            {empresas.map((emp) => (
              <div key={emp.id} className={`bg-white/60 dark:bg-blue-950/20 backdrop-blur-xl rounded-[1.5rem] border border-gray-200/50 dark:border-white/5 p-4 shadow-sm relative overflow-hidden transition-colors ${!emp.estado ? 'opacity-70 grayscale-[50%]' : ''}`}>
                 <div className="flex justify-between items-start mb-3 border-b border-dashed border-gray-200/50 dark:border-slate-700 pb-3">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/50 dark:border-blue-500/20 font-black text-base">
                          {emp.nombre.charAt(0)}
                       </div>
                       <div className="min-w-0 pr-2">
                         <p className="font-extrabold text-gray-800 dark:text-white text-sm leading-tight truncate">{emp.nombre}</p>
                         <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 font-mono mt-0.5 tracking-widest uppercase">ID: {emp.id}</p>
                       </div>
                    </div>
                 </div>

                 <div className="bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl border border-gray-100/50 dark:border-white/5 mb-3 grid grid-cols-2 gap-2">
                    <div className="flex flex-col items-start gap-1 overflow-hidden">
                      <span className="text-[9px] font-extrabold uppercase text-gray-400 dark:text-slate-500 tracking-widest">RUC</span>
                      <span className="text-[10px] font-bold text-gray-600 dark:text-slate-300 font-mono truncate">{emp.ruc || 'S/C'}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1 overflow-hidden">
                      <span className="text-[9px] font-extrabold uppercase text-gray-400 dark:text-slate-500 tracking-widest">Registro</span>
                      <span className="text-[10px] font-bold text-gray-600 dark:text-slate-300 truncate">{new Date(emp.created_at).toLocaleDateString('es-PE')}</span>
                    </div>
                 </div>

                 <div className="flex flex-col gap-2">
                   <div className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border text-center ${emp.estado ? 'bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50' : 'bg-red-50/80 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200/50'}`}>
                     {emp.estado ? 'Al Día (Activo)' : 'Suspendido'}
                   </div>
                   
                   <div className="grid grid-cols-4 gap-1.5 mt-1">
                     <button onClick={() => toggleEstado(emp.id, emp.estado)} className={`col-span-2 py-2.5 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 active:scale-95 border ${emp.estado ? 'bg-red-50/80 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/50' : 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/50'}`}>
                       <Power size={14}/> {emp.estado ? 'Suspender' : 'Reactivar'}
                     </button>
                     
                     <button onClick={() => openViewModal(emp)} className="col-span-1 py-2.5 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 active:scale-95 bg-white/70 dark:bg-slate-800/80 border border-gray-200/50 dark:border-white/10 text-gray-700 dark:text-slate-200">
                        <Eye size={14}/>
                     </button>

                     <button onClick={() => openEditModal(emp)} className="col-span-1 py-2.5 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 active:scale-95 bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 text-blue-700 dark:text-blue-400">
                        <Edit size={14}/>
                     </button>
                   </div>
                   {emp.estado && (
                       <button onClick={() => openPlanModal(emp)} className="w-full mt-1 py-2.5 rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1 active:scale-95 bg-purple-50/80 dark:bg-purple-900/30 border border-purple-200/50 dark:border-purple-800/50 text-purple-700 dark:text-purple-400">
                          <CreditCard size={14}/> Asignar Plan de Pago
                       </button>
                   )}
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✨ VISTA PC: Tabla ✨ */}
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
                    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border backdrop-blur-md transition-colors ${emp.estado ? 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20' : 'bg-red-100/50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-500/20'}`}>
                      {emp.estado ? 'Al Día (Activo)' : 'Suspendido'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex justify-center gap-2 mx-auto">
                      <button onClick={() => toggleEstado(emp.id, emp.estado)} className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-sm backdrop-blur-md flex items-center justify-center gap-1.5 active:scale-95 border ${emp.estado ? 'bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100/80 dark:hover:bg-red-900/50 border-transparent dark:border-red-500/20' : 'bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 border-transparent dark:border-emerald-500/20'}`}>
                        <Power size={14}/> {emp.estado ? 'Suspender' : 'Reactivar'}
                      </button>
                      
                      <button onClick={() => openViewModal(emp)} className="px-3 py-2 rounded-xl text-xs font-extrabold transition-all shadow-sm backdrop-blur-md flex items-center justify-center gap-1.5 active:scale-95 bg-white/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-white/10 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700">
                        <Eye size={14}/> Ficha
                      </button>

                      <button onClick={() => openEditModal(emp)} className="px-3 py-2 rounded-xl text-xs font-extrabold transition-all shadow-sm backdrop-blur-md flex items-center justify-center gap-1.5 active:scale-95 bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50">
                        <Edit size={14}/>
                      </button>

                      {emp.estado && (
                         <button onClick={() => openPlanModal(emp)} className="px-3 py-2 rounded-xl text-xs font-extrabold transition-all shadow-sm backdrop-blur-md flex items-center justify-center gap-1.5 active:scale-95 bg-purple-50/80 dark:bg-purple-900/30 border border-purple-200/50 dark:border-purple-800/50 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50">
                           <CreditCard size={14}/> Plan
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

      {/* ✨ MODAL VER EMPRESA (NUEVO) ✨ */}
      {isViewModalOpen && viewEmpresa && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in transition-colors duration-300">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-3xl sm:rounded-[2.5rem] w-full max-w-md shadow-2xl flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh] animate-fade-in-up overflow-hidden border border-white/50 dark:border-white/10 transition-colors duration-300">
            <div className="bg-white dark:bg-blue-950 p-5 md:p-6 flex justify-between items-center text-gray-800 dark:text-white relative overflow-hidden border-b border-gray-100/50 dark:border-white/5 shrink-0">
               <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mt-2 sm:hidden z-20 absolute top-2 left-1/2 -translate-x-1/2"></div>
               <div className="relative z-10 mt-3 sm:mt-0">
                 <h2 className="text-lg md:text-xl font-black flex items-center gap-2 tracking-tight"><Building2 className="text-blue-600 dark:text-blue-400" size={20}/> Ficha del Cliente</h2>
               </div>
               <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-full z-10"><X size={18}/></button>
            </div>

            <div className={`p-6 overflow-y-auto ${hideScrollbar}`}>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-2xl border border-blue-100 dark:border-blue-500/20 shrink-0">
                   {viewEmpresa.nombre.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-gray-800 dark:text-white text-lg">{viewEmpresa.nombre}</h3>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 font-mono tracking-widest uppercase">ID: {viewEmpresa.id.split('-')[0]}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-gray-100/50 dark:border-white/5">
                  <h4 className="text-[10px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 border-b border-gray-200/50 dark:border-white/5 pb-1.5">Datos Legales</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">RUC</p>
                      <p className="font-bold text-sm text-gray-800 dark:text-slate-200">{viewEmpresa.ruc || 'S/C'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Fecha Registro</p>
                      <p className="font-bold text-sm text-gray-800 dark:text-slate-200">{new Date(viewEmpresa.created_at).toLocaleDateString('es-PE')}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-500/20">
                  <h4 className="text-[10px] font-extrabold text-blue-600/80 dark:text-blue-400/80 uppercase tracking-widest mb-3 border-b border-blue-200/50 dark:border-blue-500/20 pb-1.5 flex items-center gap-1.5"><Key size={12}/> Credenciales Principales</h4>
                  
                  <div className="mb-3">
                    <p className="text-[9px] font-bold text-blue-600/80 dark:text-blue-300/70 uppercase tracking-widest flex items-center gap-1.5"><Mail size={12}/> Correo Electrónico (Login)</p>
                    <p className="font-black text-sm text-blue-900 dark:text-blue-100 bg-white/70 dark:bg-blue-950/50 p-2.5 rounded-xl border border-blue-200/50 dark:border-blue-500/30 mt-1 shadow-sm break-all">
                      {viewEmpresa.admin_email || 'No disponible. Revisa el Backend.'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] font-bold text-blue-600/80 dark:text-blue-300/70 uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck size={12}/> Contraseña</p>
                    <p className="font-bold text-xs text-blue-700/80 dark:text-blue-300/80 mt-1 italic">
                      Las contraseñas están encriptadas por seguridad. Si el cliente la olvidó, usa el botón "Editar" para asignarle una nueva.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-t border-gray-100/50 dark:border-white/5 shrink-0 flex gap-3">
               <button onClick={() => setIsViewModalOpen(false)} className="flex-1 py-3.5 bg-white/80 dark:bg-slate-800/80 border border-gray-200/80 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-extrabold text-sm shadow-sm transition-colors active:scale-95">Cerrar Ficha</button>
               <button onClick={() => { setIsViewModalOpen(false); openEditModal(viewEmpresa); }} className="flex-1 py-3.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-extrabold text-sm shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 flex items-center justify-center gap-2 transition-colors active:scale-95"><Edit size={16}/> Editar</button>
            </div>
          </div>
        </div>
      )}

      {/* ✨ MODAL EDITAR EMPRESA Y CREDENCIALES ✨ */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in transition-colors duration-300">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-3xl sm:rounded-[2.5rem] w-full max-w-3xl shadow-2xl flex flex-col h-[95vh] sm:h-auto sm:max-h-[90vh] animate-fade-in-up overflow-hidden border border-white/50 dark:border-white/10 transition-colors duration-300">
            
            <div className="bg-white dark:bg-blue-950 p-5 md:p-6 flex justify-between items-center text-gray-800 dark:text-white relative overflow-hidden border-b border-gray-100/50 dark:border-white/5 shrink-0">
               <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mt-2 sm:hidden z-20 absolute top-2 left-1/2 -translate-x-1/2"></div>
               <div className="relative z-10 mt-3 sm:mt-0">
                 <h2 className="text-lg md:text-xl font-black flex items-center gap-2 tracking-tight"><Edit className="text-blue-600 dark:text-blue-400" size={20}/> Editar Cliente (Tenant)</h2>
                 <p className="text-[10px] md:text-xs text-gray-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest">Modificar datos y credenciales de acceso</p>
               </div>
               <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-full z-10"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleEditarEmpresa} className={`p-4 md:p-8 overflow-y-auto ${hideScrollbar} flex-1 flex flex-col`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 flex-1">
                
                {/* Datos de la Empresa */}
                <div className="space-y-4 bg-slate-50/50 dark:bg-blue-900/10 p-4 md:p-6 rounded-2xl border border-gray-100/50 dark:border-white/5 shadow-sm relative overflow-hidden">
                  <h3 className="font-black text-gray-800 dark:text-white text-xs md:text-sm uppercase border-b border-gray-200/50 dark:border-white/5 pb-2.5 flex items-center gap-2"><Building2 size={16} className="text-blue-500 dark:text-blue-400"/> Datos del Negocio</h3>
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Razón Social *</label>
                    <input required className="w-full bg-white/80 dark:bg-blue-950/30 border border-gray-200/80 dark:border-white/10 p-3 rounded-xl font-bold text-gray-800 dark:text-white outline-none shadow-sm text-xs" value={editFormData.nombre_empresa} onChange={e => setEditFormData({...editFormData, nombre_empresa: e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">RUC</label>
                    <input className="w-full bg-white/80 dark:bg-blue-950/30 border border-gray-200/80 dark:border-white/10 p-3 rounded-xl font-bold text-gray-800 dark:text-white outline-none shadow-sm text-xs" value={editFormData.ruc} onChange={e => setEditFormData({...editFormData, ruc: e.target.value.replace(/\D/g, '').slice(0, 11)})}/>
                  </div>
                </div>

                {/* Cuenta del Administrador */}
                <div className="space-y-4 bg-blue-50/50 dark:bg-blue-900/20 p-4 md:p-6 rounded-2xl border border-blue-100/50 dark:border-blue-500/20 shadow-sm relative overflow-hidden">
                  <h3 className="font-black text-blue-900 dark:text-blue-100 text-xs md:text-sm uppercase border-b border-blue-200/50 dark:border-blue-500/20 pb-2.5 flex items-center gap-2"><ShieldCheck size={16} className="text-blue-600 dark:text-blue-400"/> Credenciales (Dueño)</h3>
                  <div>
                    <label className="text-[10px] font-extrabold text-blue-600/80 dark:text-blue-300 uppercase tracking-widest mb-1.5 block">Correo (Login)</label>
                    <input type="email" className="w-full bg-white/90 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-500/30 p-3 rounded-xl font-bold text-gray-800 dark:text-white outline-none shadow-sm text-xs" value={editFormData.admin_email} onChange={e => setEditFormData({...editFormData, admin_email: e.target.value})} placeholder="El backend debe enviar este dato"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-blue-600/80 dark:text-blue-300 uppercase tracking-widest mb-1.5 block">Nueva Contraseña</label>
                    <input type="password" minLength="6" className="w-full bg-white/90 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-500/30 p-3 rounded-xl font-bold text-gray-800 dark:text-white outline-none shadow-sm text-xs" value={editFormData.admin_password} onChange={e => setEditFormData({...editFormData, admin_password: e.target.value})} placeholder="Déjalo en blanco para no cambiarla"/>
                    <p className="text-[9px] text-blue-600/70 dark:text-blue-400 mt-1.5 font-bold">Solo escribe aquí si el cliente olvidó su contraseña y necesita una nueva.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100/50 dark:border-white/5 shrink-0">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3.5 bg-white/50 dark:bg-slate-800/50 border border-gray-200/80 dark:border-white/10 rounded-xl font-extrabold text-gray-600 dark:text-slate-300 text-sm shadow-sm">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-black py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-1.5 text-sm"><CheckCircle size={16}/> Actualizar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✨ MODAL CREAR INQUILINO ✨ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in transition-colors duration-300">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-3xl sm:rounded-[2.5rem] w-full max-w-3xl shadow-2xl flex flex-col h-[95vh] sm:h-auto sm:max-h-[90vh] animate-fade-in-up overflow-hidden border border-white/50 dark:border-white/10 transition-colors duration-300">
            <div className="bg-slate-900 dark:bg-slate-950 p-5 md:p-6 flex justify-between items-center text-white relative overflow-hidden border-b border-white/10 dark:border-white/5 shrink-0">
               <div className="w-12 h-1.5 bg-white/20 rounded-full absolute top-2 left-1/2 -translate-x-1/2 sm:hidden z-20"></div>
               <div className="absolute -right-10 -top-10 w-32 h-32 md:w-40 md:h-40 bg-blue-500 rounded-full blur-2xl md:blur-3xl opacity-20 pointer-events-none"></div>
               <div className="relative z-10 mt-2 sm:mt-0">
                 <h2 className="text-lg md:text-xl font-black flex items-center gap-2 tracking-tight"><ShieldCheck className="text-emerald-400" size={20}/> Alta de Nuevo Cliente</h2>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full z-10"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleCrearEmpresa} className={`p-4 md:p-8 overflow-y-auto ${hideScrollbar} flex-1 flex flex-col`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 flex-1">
                <div className="space-y-4 bg-white/50 dark:bg-blue-900/10 p-4 md:p-6 rounded-2xl border border-gray-100/50 shadow-sm relative overflow-hidden">
                  <h3 className="font-black text-gray-800 dark:text-white text-xs md:text-sm uppercase border-b border-gray-200/50 pb-2.5 flex items-center gap-2"><Building2 size={16} className="text-blue-500"/> Datos del Negocio</h3>
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5 block">Razón Social *</label>
                    <input required className="w-full bg-white/80 dark:bg-blue-950/30 border border-gray-200/80 p-3 rounded-xl font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm text-xs" value={formData.nombre_empresa} onChange={e => setFormData({...formData, nombre_empresa: e.target.value})} placeholder="Ej: Pollería El Buen Sabor"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5 block">RUC</label>
                    <input className="w-full bg-white/80 dark:bg-blue-950/30 border border-gray-200/80 p-3 rounded-xl font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm text-xs" value={formData.ruc} onChange={e => setFormData({...formData, ruc: e.target.value})} placeholder="11 dígitos"/>
                  </div>
                </div>

                <div className="space-y-4 bg-blue-50/80 dark:bg-blue-900/30 p-4 md:p-6 rounded-2xl border border-blue-100/50 shadow-sm relative overflow-hidden">
                  <h3 className="font-black text-blue-900 dark:text-blue-100 text-xs md:text-sm uppercase border-b border-blue-200/50 pb-2.5 flex items-center gap-2"><ShieldCheck size={16} className="text-blue-600"/> Cuenta Administrador</h3>
                  <div>
                    <label className="text-[10px] font-extrabold text-blue-600/80 uppercase tracking-widest mb-1.5 block">Gerente General *</label>
                    <input required className="w-full bg-white/90 border border-blue-200/80 p-3 rounded-xl font-bold text-gray-800 focus:ring-2 outline-none shadow-sm text-xs" value={formData.admin_nombre} onChange={e => setFormData({...formData, admin_nombre: e.target.value})} placeholder="Ej: Carlos"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-blue-600/80 uppercase tracking-widest mb-1.5 block">Correo (Login) *</label>
                    <input type="email" required className="w-full bg-white/90 border border-blue-200/80 p-3 rounded-xl font-bold text-gray-800 focus:ring-2 outline-none shadow-sm text-xs" value={formData.admin_email} onChange={e => setFormData({...formData, admin_email: e.target.value})} placeholder="admin@empresa.com"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-blue-600/80 uppercase tracking-widest mb-1.5 block">Contraseña Inicial *</label>
                    <input type="password" required className="w-full bg-white/90 border border-blue-200/80 p-3 rounded-xl font-bold text-gray-800 focus:ring-2 outline-none shadow-sm text-xs" value={formData.admin_password} onChange={e => setFormData({...formData, admin_password: e.target.value})} placeholder="Mínimo 6 caracteres"/>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100/50 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 bg-white/50 border border-gray-200/80 rounded-xl font-extrabold text-gray-600 text-sm shadow-sm">Cancelar</button>
                <button type="submit" className="flex-1 bg-slate-900/95 dark:bg-blue-600 text-white font-black py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-1.5 text-sm"><Server size={16}/> Desplegar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✨ MODAL ASIGNAR PLAN ✨ */}
      {isPlanModalOpen && selectedEmpresa && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in transition-colors duration-300">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh] animate-fade-in-up overflow-hidden border border-white/50 dark:border-white/10 transition-colors duration-300">
            <div className="bg-white dark:bg-blue-950 p-5 md:p-6 flex justify-between items-center text-gray-800 dark:text-white relative overflow-hidden border-b border-gray-100 dark:border-white/5 shrink-0">
               <div className="relative z-10 mt-2 sm:mt-0">
                 <h2 className="text-lg font-black flex items-center gap-2"><CreditCard className="text-blue-600" size={20}/> Asignar Plan</h2>
                 <p className="text-[11px] text-gray-500 font-bold mt-1 uppercase">Negocio: <span className="text-gray-900 dark:text-white">{selectedEmpresa.nombre}</span></p>
               </div>
               <button onClick={() => setIsPlanModalOpen(false)} className="text-gray-400 bg-gray-100/50 p-2 rounded-full z-10"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleAsignarPlan} className={`p-6 md:p-8 overflow-y-auto ${hideScrollbar} flex-1 flex flex-col space-y-5`}>
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-1 block">Selecciona un Plan SaaS *</label>
                <select required value={assignFormData.plan_id} onChange={(e) => handlePlanSelect(e.target.value)} className="w-full bg-white/90 border border-gray-200 p-3.5 rounded-xl font-bold text-gray-800 focus:ring-2 outline-none shadow-sm text-sm">
                  <option value="" disabled>-- Selecciona un plan --</option>
                  {planes.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.nombre} (S/ {parseFloat(plan.precio).toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-1 block">Cuota (S/) *</label>
                  <input type="number" step="0.01" required value={assignFormData.monto} onChange={(e) => setAssignFormData({...assignFormData, monto: e.target.value})} className="w-full bg-white/90 border border-gray-200 p-3.5 rounded-xl font-black text-emerald-600 focus:ring-2 outline-none shadow-sm text-sm"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-1 block">Próximo Pago *</label>
                  <input type="date" required value={assignFormData.proximo_pago} onChange={(e) => setAssignFormData({...assignFormData, proximo_pago: e.target.value})} className="w-full bg-white/90 border border-gray-200 p-3.5 rounded-xl font-bold text-gray-800 focus:ring-2 outline-none shadow-sm text-sm"/>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100/50 shrink-0">
                <button type="button" onClick={() => setIsPlanModalOpen(false)} className="flex-1 py-4 border border-gray-200 bg-white rounded-xl font-black text-sm">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm"><CheckCircle size={18}/> Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminSaaS;