import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { CreditCard, TrendingUp, AlertTriangle, CheckCircle, Plus, Building2, CalendarDays, DollarSign, Package, Mail, Edit, Trash2, X, Power } from 'lucide-react';

const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const SuscripcionesSaaS = () => {
  const [activeTab, setActiveTab] = useState('suscripciones');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [suscripciones, setSuscripciones] = useState([]);
  const [planes, setPlanes] = useState([]);
  
  // Modal de Planes
  const [modalPlan, setModalPlan] = useState(false);
  const [formData, setFormData] = useState({
    id: null, nombre: '', precio: '', limite_sucursales: '', caracteristicas: ''
  });

  // ✨ Modal de Editar Suscripción ✨
  const [modalEditSub, setModalEditSub] = useState(false);
  const [subFormData, setSubFormData] = useState({
    id: null, estado: '', proximo_pago: '', monto: '', empresa: ''
  });

  const showToast = (type, message) => { setToast({ type, message }); setTimeout(() => setToast(null), 3000); };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSub, resPlanes] = await Promise.all([
        api.get('/suscripciones'),
        api.get('/planes')
      ]);
      setSuscripciones(resSub.data);
      setPlanes(resPlanes.data);
    } catch (error) {
      console.error("Error cargando SaaS:", error);
      showToast('error', 'Error al conectar con la base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FUNCIONES DE PLANES ---
  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api.put(`/planes/${formData.id}`, formData);
        showToast('success', 'Plan actualizado correctamente');
      } else {
        await api.post('/planes', formData);
        showToast('success', 'Nuevo plan creado');
      }
      setModalPlan(false);
      fetchData(); 
    } catch (error) {
      showToast('error', 'Error al guardar el plan');
    }
  };

  const handleDeletePlan = async (id) => {
    if(window.confirm('¿Seguro que deseas eliminar este plan? Afectará a las empresas que lo usan.')){
      try {
        await api.delete(`/planes/${id}`);
        showToast('success', 'Plan eliminado');
        fetchData();
      } catch (error) {
        showToast('error', 'Error al eliminar el plan');
      }
    }
  };

  const openModalCrear = () => {
    setFormData({ id: null, nombre: '', precio: '', limite_sucursales: '', caracteristicas: '' });
    setModalPlan(true);
  };

  const openModalEditar = (plan) => {
    setFormData(plan);
    setModalPlan(true);
  };

  // --- FUNCIONES DE SUSCRIPCIONES ---
  const handleRecordatorio = async (sub_id, empresaNombre) => {
    try {
      await api.post(`/suscripciones/${sub_id}/recordatorio`);
      showToast('success', `Recordatorio enviado a ${empresaNombre}`);
    } catch (error) {
      showToast('error', 'Error al enviar el recordatorio');
    }
  };

  // ✨ Editar Suscripción (Modal)
  const openEditSub = (sub) => {
    // Convertir la fecha a formato YYYY-MM-DD para el input type="date"
    const dateObj = new Date(sub.proximo_pago);
    const dateStr = dateObj.toISOString().split('T')[0];
    
    setSubFormData({
      id: sub.id,
      estado: sub.estado,
      proximo_pago: dateStr,
      monto: sub.monto,
      empresa: sub.empresa
    });
    setModalEditSub(true);
  };

  const handleSaveSub = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/suscripciones/${subFormData.id}`, {
        estado: subFormData.estado,
        proximo_pago: subFormData.proximo_pago,
        monto: parseFloat(subFormData.monto)
      });
      showToast('success', 'Suscripción actualizada');
      setModalEditSub(false);
      fetchData();
    } catch (error) {
      showToast('error', 'Error al actualizar suscripción');
    }
  };

  // ✨ Eliminar Suscripción
  const handleDeleteSub = async (id, nombre) => {
    if(window.confirm(`¿Estás seguro de cancelar la suscripción de ${nombre}?`)){
      try {
        await api.delete(`/suscripciones/${id}`);
        showToast('success', 'Suscripción cancelada correctamente');
        fetchData();
      } catch (error) {
        showToast('error', 'Error al cancelar la suscripción');
      }
    }
  };


  const mrr = suscripciones.filter(s => s.estado === 'Al Día').reduce((acc, curr) => acc + parseFloat(curr.monto), 0);
  const vencidos = suscripciones.filter(s => s.estado === 'Vencido').length;

  return (
    <Layout title="Suscripciones y Pagos" moduleIcon={<CreditCard/>}>
      
      {toast && (
        <div className={`fixed top-4 right-4 md:top-auto md:bottom-10 md:right-10 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-white animate-fade-in-down md:animate-fade-in-up backdrop-blur-xl border border-white/20 transition-colors ${toast.type === 'success' ? 'bg-emerald-600/95' : 'bg-red-600/95'}`}>
          {toast.type === 'success' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
          <p className="font-bold text-xs md:text-sm tracking-wide">{toast.message}</p>
        </div>
      )}

      {/* MÉTRICAS FINANCIERAS SaaS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-emerald-500/90 to-emerald-700/90 dark:from-emerald-900/80 dark:to-emerald-950/80 backdrop-blur-2xl p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-xl relative overflow-hidden border border-emerald-400/50 dark:border-emerald-500/20 transition-colors duration-300">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
          <p className="text-[10px] md:text-xs font-extrabold text-emerald-100 dark:text-emerald-400 uppercase tracking-widest mb-1 relative z-10 flex items-center gap-1.5"><TrendingUp size={14}/> MRR Estimado</p>
          <p className="text-3xl md:text-4xl font-black text-white relative z-10 tracking-tight">S/ {mrr.toFixed(2)}</p>
          <p className="text-[9px] text-emerald-200 mt-1 relative z-10 font-bold tracking-wider">Ingreso Recurrente Mensual</p>
        </div>

        <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl border border-white/80 dark:border-white/5 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm flex flex-col justify-center transition-colors duration-300 relative overflow-hidden">
          <p className="text-[9px] md:text-xs font-extrabold text-blue-600/80 dark:text-blue-400/80 uppercase tracking-widest mb-1 relative z-10">Pagos al Día</p>
          <p className="text-2xl md:text-4xl font-black text-blue-600 dark:text-blue-400 relative z-10 tracking-tight">{suscripciones.length - vencidos}</p>
        </div>

        <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl border border-white/80 dark:border-white/5 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm flex flex-col justify-center transition-colors duration-300 relative overflow-hidden">
          <p className="text-[9px] md:text-xs font-extrabold text-red-600/80 dark:text-red-400/80 uppercase tracking-widest mb-1 relative z-10 flex items-center gap-1"><AlertTriangle size={12}/> Vencidos</p>
          <p className="text-2xl md:text-4xl font-black text-red-600 dark:text-red-400 relative z-10 tracking-tight">{vencidos}</p>
        </div>
      </div>

      {/* PESTAÑAS */}
      <div className="flex bg-white/60 dark:bg-blue-950/30 backdrop-blur-xl p-1 rounded-xl border border-gray-200/50 dark:border-white/5 shadow-sm mb-4 md:mb-6 sticky top-0 z-20 transition-colors duration-300 w-full md:w-fit">
        <button 
          onClick={() => setActiveTab('suscripciones')} 
          className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg font-extrabold text-[11px] md:text-sm uppercase tracking-wider transition-all ${activeTab === 'suscripciones' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/50'}`}
        >
          <Building2 size={16} /> Suscriptores
        </button>
        <button 
          onClick={() => setActiveTab('planes')} 
          className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg font-extrabold text-[11px] md:text-sm uppercase tracking-wider transition-all ${activeTab === 'planes' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/50'}`}
        >
          <Package size={16} /> Planes SaaS
        </button>
      </div>

      {/* =====================================================================
          TAB 1: SUSCRIPTORES 
          ===================================================================== */}
      {activeTab === 'suscripciones' && (
        <div className="animate-fade-in">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-blue-300/70">
               <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
               <p className="text-[10px] font-extrabold uppercase tracking-widest">Cargando pagos...</p>
            </div>
          ) : suscripciones.length === 0 ? (
            <div className="text-center py-16 bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] border border-gray-100/50 dark:border-white/5 shadow-sm flex flex-col items-center">
              <Building2 size={48} className="text-gray-300 dark:text-slate-600 mb-3" strokeWidth={1.5}/>
              <p className="text-sm font-black text-gray-600 dark:text-white">Aún no hay suscripciones activas.</p>
            </div>
          ) : (
            <>
              {/* VISTA MÓVIL */}
              <div className="md:hidden flex flex-col gap-3 pb-6">
                {suscripciones.map((sub) => (
                  <div key={sub.id} className={`bg-white/60 dark:bg-blue-950/20 backdrop-blur-xl rounded-[1.5rem] border border-gray-200/50 dark:border-white/5 p-4 shadow-sm relative overflow-hidden transition-colors ${sub.estado === 'Vencido' ? 'border-red-200 dark:border-red-900/50' : ''}`}>
                     <div className="flex justify-between items-start mb-3 border-b border-dashed border-gray-200/50 dark:border-slate-700 pb-3 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 backdrop-blur-md transition-colors font-black text-lg ${sub.estado === 'Vencido' ? 'bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100/50 dark:border-red-500/20' : 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-500/20'}`}>
                              {sub.empresa.charAt(0)}
                           </div>
                           <div className="min-w-0 pr-2">
                             <p className="font-extrabold text-gray-800 dark:text-white text-sm leading-tight truncate transition-colors">{sub.empresa}</p>
                             <p className="text-[9px] font-bold text-gray-400 dark:text-slate-400 font-mono mt-0.5 tracking-widest uppercase transition-colors">RUC: {sub.ruc}</p>
                           </div>
                        </div>
                     </div>

                     <div className="bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl border border-gray-100/50 dark:border-white/5 mb-3 grid grid-cols-2 gap-2 backdrop-blur-md transition-colors">
                        <div className="flex flex-col items-start gap-1 overflow-hidden">
                          <span className="text-[9px] font-extrabold uppercase text-gray-400 dark:text-slate-500 tracking-widest transition-colors">Plan</span>
                          <span className="text-[10px] font-black text-purple-700 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-900/30 px-2 py-0.5 rounded border border-purple-100/50 dark:border-purple-500/20 truncate transition-colors">{sub.plan_nombre}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1 overflow-hidden">
                          <span className="text-[9px] font-extrabold uppercase text-gray-400 dark:text-slate-500 tracking-widest transition-colors">Próximo Pago</span>
                          <span className="text-[10px] font-bold text-gray-600 dark:text-slate-300 flex items-center gap-1 transition-colors"><CalendarDays size={10}/> {new Date(sub.proximo_pago).toLocaleDateString('es-PE')}</span>
                        </div>
                     </div>

                     <div className="flex flex-col gap-2">
                       <div className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border backdrop-blur-md text-center transition-colors ${sub.estado === 'Al Día' ? 'bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50' : 'bg-red-50/80 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-800/50'}`}>
                         {sub.estado} (S/ {parseFloat(sub.monto).toFixed(2)})
                       </div>
                       
                       <div className="grid grid-cols-2 gap-2 mt-1">
                          <button onClick={() => openEditSub(sub)} className="w-full py-2.5 rounded-xl text-[11px] font-extrabold transition-all shadow-sm backdrop-blur-md flex items-center justify-center gap-1.5 active:scale-95 bg-white/70 dark:bg-slate-800/80 border border-gray-200/50 dark:border-white/10 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700">
                             <Edit size={14}/> Editar
                          </button>
                          {sub.estado === 'Vencido' ? (
                            <button onClick={() => handleRecordatorio(sub.id, sub.empresa)} className="w-full py-2.5 rounded-xl text-[11px] font-extrabold transition-all shadow-sm backdrop-blur-md flex items-center justify-center gap-1.5 active:scale-95 bg-orange-50/80 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-500/30">
                              <Mail size={14}/> Recordatorio
                            </button>
                          ) : (
                            <button onClick={() => handleDeleteSub(sub.id, sub.empresa)} className="w-full py-2.5 rounded-xl text-[11px] font-extrabold transition-all shadow-sm backdrop-blur-md flex items-center justify-center gap-1.5 active:scale-95 bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-transparent dark:border-red-500/20 hover:bg-red-100/80 dark:hover:bg-red-900/50">
                              <Trash2 size={14}/> Cancelar
                            </button>
                          )}
                       </div>
                     </div>
                  </div>
                ))}
              </div>

              {/* VISTA PC TABLA */}
              <div className="hidden md:block bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_40px_rgb(29,78,216,0.1)] border border-white/80 dark:border-white/5 overflow-hidden transition-colors duration-300">
                <div className={`overflow-x-auto ${hideScrollbar}`}>
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50/50 dark:bg-blue-950/30 text-slate-500 dark:text-blue-300 uppercase font-extrabold tracking-widest text-[10px] border-b border-gray-200/50 dark:border-white/5 transition-colors">
                      <tr>
                        <th className="px-6 py-5">Empresa (Tenant)</th>
                        <th className="px-6 py-5">Plan</th>
                        <th className="px-6 py-5">Cuota Mes</th>
                        <th className="px-6 py-5">Próximo Pago</th>
                        <th className="px-6 py-5 text-center">Estado</th>
                        <th className="px-6 py-5 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/50 dark:divide-white/5 relative bg-transparent transition-colors">
                      {suscripciones.map((sub) => (
                        <tr key={sub.id} className={`transition-colors duration-200 relative group ${sub.estado === 'Vencido' ? 'bg-red-50/10 dark:bg-red-950/20' : 'hover:bg-white/50 dark:hover:bg-blue-900/10'}`}>
                          <td className="px-6 py-5 font-extrabold text-gray-900 dark:text-slate-100 text-sm transition-colors relative z-10">
                            {sub.empresa}
                            <div className="text-[9px] text-gray-400 dark:text-slate-500 font-bold font-mono mt-0.5 tracking-widest uppercase">RUC: {sub.ruc}</div>
                          </td>
                          <td className="px-6 py-5">
                             <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-900/30 border border-purple-100/50 dark:border-purple-500/20 backdrop-blur-md px-2 py-1 rounded-md transition-colors">{sub.plan_nombre}</span>
                          </td>
                          <td className="px-6 py-5 font-black text-gray-800 dark:text-white transition-colors">S/ {parseFloat(sub.monto).toFixed(2)}</td>
                          <td className="px-6 py-5 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 transition-colors"><CalendarDays size={14} className="text-blue-400"/> {new Date(sub.proximo_pago).toLocaleDateString('es-PE')}</td>
                          <td className="px-6 py-5 text-center">
                            <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border backdrop-blur-md transition-colors ${sub.estado === 'Al Día' ? 'bg-emerald-100/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50' : 'bg-red-100/50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-800/50'}`}>
                              {sub.estado}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className="flex justify-center gap-2">
                              {/* ✨ Siempre ver Editar ✨ */}
                              <button onClick={() => openEditSub(sub)} className="p-2.5 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-transparent dark:border-blue-500/20 transition-all shadow-sm backdrop-blur-md active:scale-95" title="Editar Suscripción">
                                <Edit size={16}/>
                              </button>
                              
                              {/* ✨ Si está vencido: Botón Recordar ✨ */}
                              {sub.estado === 'Vencido' && (
                                <button onClick={() => handleRecordatorio(sub.id, sub.empresa)} className="px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm backdrop-blur-md flex items-center gap-1.5 active:scale-95 bg-white/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-white/10 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:border-orange-300 dark:hover:border-orange-500/50">
                                  <Mail size={14}/> Cobrar
                                </button>
                              )}

                              {/* ✨ Botón Cancelar (Rojo, solo icono) ✨ */}
                              <button onClick={() => handleDeleteSub(sub.id, sub.empresa)} className="p-2.5 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 border border-transparent dark:border-red-500/20 transition-all shadow-sm backdrop-blur-md active:scale-95" title="Cancelar Suscripción">
                                <Trash2 size={16}/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: PLANES Y PRECIOS 
          ===================================================================== */}
      {activeTab === 'planes' && (
        <div className="animate-fade-in">
          
          <div className="flex justify-end mb-4">
             <button onClick={openModalCrear} className="w-full sm:w-auto bg-blue-600/90 dark:bg-blue-600 text-white px-5 py-3 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 hover:bg-blue-700 transition-all active:scale-95 text-xs md:text-sm border border-transparent dark:border-white/10 backdrop-blur-md">
               <Plus size={16}/> Nuevo Plan
             </button>
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-blue-300/70">
               <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-6">
               {planes.map(plan => (
                 <div key={plan.id} className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-xl rounded-[2rem] border border-gray-200/50 dark:border-white/5 p-6 shadow-sm hover:shadow-xl dark:hover:shadow-[0_8px_30px_rgb(29,78,216,0.15)] hover:-translate-y-1 transition-all duration-300 flex flex-col group relative overflow-hidden">
                   
                   <div className="absolute -right-10 -top-10 w-32 h-32 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none transition-colors"></div>

                   <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2 uppercase tracking-tight transition-colors relative z-10">{plan.nombre}</h3>
                   <div className="flex items-end gap-1 mb-6 relative z-10">
                     <span className="text-3xl font-black text-blue-600 dark:text-blue-400 transition-colors leading-none">S/ {parseFloat(plan.precio).toFixed(2)}</span>
                     <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1 transition-colors">/ Mes</span>
                   </div>
                   
                   <div className="space-y-3 flex-1 relative z-10">
                     <div className="flex items-start gap-2">
                       <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0"/>
                       <p className="text-xs font-bold text-gray-600 dark:text-slate-300 transition-colors">Sucursales: <span className="text-gray-900 dark:text-white font-black">{plan.limite_sucursales}</span></p>
                     </div>
                     <div className="flex items-start gap-2">
                       <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0"/>
                       <p className="text-xs font-bold text-gray-600 dark:text-slate-300 transition-colors">{plan.caracteristicas}</p>
                     </div>
                   </div>

                   <div className="flex gap-2 mt-6 pt-4 border-t border-dashed border-gray-200/80 dark:border-white/10 relative z-10 transition-colors">
                     <button onClick={() => openModalEditar(plan)} className="flex-1 py-2.5 bg-white/80 dark:bg-slate-800/80 border border-transparent dark:border-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors backdrop-blur-md active:scale-95 shadow-sm"><Edit size={14}/> Editar</button>
                     <button onClick={() => handleDeletePlan(plan.id)} className="w-12 py-2.5 bg-red-50/80 dark:bg-red-900/30 border border-transparent dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl flex items-center justify-center transition-colors backdrop-blur-md active:scale-95"><Trash2 size={14}/></button>
                   </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      )}

      {/* ✨ MODAL CREAR/EDITAR PLAN ✨ */}
      {modalPlan && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in transition-colors duration-300">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-3xl sm:rounded-[2.5rem] w-full max-w-md shadow-2xl flex flex-col h-[85vh] sm:h-auto sm:max-h-[90vh] animate-fade-in-up overflow-hidden border border-white/50 dark:border-white/10 transition-colors duration-300">
            
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mt-4 sm:hidden shrink-0"></div>
            
            <div className="px-6 py-4 flex justify-between items-center text-gray-800 dark:text-white relative overflow-hidden border-b border-gray-100/50 dark:border-white/5 shrink-0 transition-colors">
               <h2 className="text-lg font-black flex items-center gap-2 tracking-tight">
                 <Package className="text-blue-600 dark:text-blue-400" size={20}/> 
                 {formData.id ? 'Editar Plan' : 'Nuevo Plan SaaS'}
               </h2>
               <button onClick={() => setModalPlan(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-50/50 dark:bg-slate-800/50 p-2 rounded-full transition-colors border border-transparent dark:border-white/5"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSavePlan} className={`p-6 overflow-y-auto ${hideScrollbar} flex-1 space-y-4`}>
              <div>
                <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block transition-colors">Nombre del Plan *</label>
                <input required autoFocus className="w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border border-gray-200/80 dark:border-white/10 p-3.5 rounded-xl font-bold text-gray-800 dark:text-white focus:bg-white dark:focus:bg-blue-950 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm text-sm" placeholder="Ej: Avanzado" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})}/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block transition-colors">Precio (S/) Mensual *</label>
                  <input type="number" step="0.01" required className="w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border border-gray-200/80 dark:border-white/10 p-3.5 rounded-xl font-black text-emerald-600 dark:text-emerald-400 focus:bg-white dark:focus:bg-blue-950 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm text-sm" placeholder="150.00" value={formData.precio} onChange={(e) => setFormData({...formData, precio: e.target.value})}/>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block transition-colors">Límite Sucursales *</label>
                  <input type="text" required className="w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border border-gray-200/80 dark:border-white/10 p-3.5 rounded-xl font-bold text-gray-800 dark:text-white focus:bg-white dark:focus:bg-blue-950 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm text-sm" placeholder="Ej: 5 o Ilimitadas" value={formData.limite_sucursales} onChange={(e) => setFormData({...formData, limite_sucursales: e.target.value})}/>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block transition-colors">Características Destacadas</label>
                <textarea rows="3" className="w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border border-gray-200/80 dark:border-white/10 p-3.5 rounded-xl font-bold text-gray-800 dark:text-white focus:bg-white dark:focus:bg-blue-950 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm text-sm resize-none" placeholder="Facturación, App Móvil, etc..." value={formData.caracteristicas} onChange={(e) => setFormData({...formData, caracteristicas: e.target.value})}></textarea>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100/50 dark:border-white/5 mt-6 transition-colors shrink-0">
                <button type="button" onClick={() => setModalPlan(false)} className="flex-1 py-3.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-gray-200/80 dark:border-white/5 rounded-xl font-extrabold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm shadow-sm active:scale-95">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600/90 dark:bg-blue-600 text-white font-black py-3.5 rounded-xl shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 border border-transparent dark:border-white/10 backdrop-blur-md text-sm"><CheckCircle size={16}/> Guardar Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✨ MODAL EDITAR SUSCRIPCIÓN ✨ */}
      {modalEditSub && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in transition-colors duration-300">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-2xl flex flex-col animate-fade-in-up overflow-hidden border border-white/50 dark:border-white/10 transition-colors duration-300">
            
            <div className="bg-white dark:bg-blue-950 p-5 md:p-6 flex justify-between items-center text-gray-800 dark:text-white relative overflow-hidden border-b border-gray-100 dark:border-white/5 shrink-0 transition-colors">
               <div className="relative z-10 mt-2 sm:mt-0">
                 <h2 className="text-lg font-black flex items-center gap-2 tracking-tight"><Edit className="text-blue-600 dark:text-blue-400" size={18}/> Editar Pago</h2>
                 <p className="text-[11px] text-gray-500 dark:text-blue-200/70 font-bold mt-1 uppercase tracking-widest truncate max-w-[200px]"><span className="text-gray-900 dark:text-white transition-colors">{subFormData.empresa}</span></p>
               </div>
               <button onClick={() => setModalEditSub(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-100/50 dark:bg-slate-800/50 p-2 rounded-full z-10 transition-colors border border-transparent dark:border-white/10 outline-none"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSaveSub} className={`p-6 md:p-6 overflow-y-auto ${hideScrollbar} flex-1 flex flex-col space-y-4`}>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1 block transition-colors">Estado de la Suscripción</label>
                <div className="relative">
                  <Power className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 transition-colors" size={16}/>
                  <select required value={subFormData.estado} onChange={(e) => setSubFormData({...subFormData, estado: e.target.value})} className="w-full bg-white/90 dark:bg-blue-950/30 backdrop-blur-md border border-gray-200 dark:border-white/10 pl-10 pr-5 py-3 rounded-xl font-bold text-gray-800 dark:text-white focus:bg-white dark:focus:bg-blue-950 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm text-sm appearance-none cursor-pointer">
                    <option value="Al Día">Al Día (Activo)</option>
                    <option value="Vencido">Vencido (Debe Pagar)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1 block transition-colors">Cuota Mensual</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 transition-colors" size={16}/>
                    <input type="number" step="0.01" required value={subFormData.monto} onChange={(e) => setSubFormData({...subFormData, monto: e.target.value})} className="w-full bg-white/90 dark:bg-blue-950/30 backdrop-blur-md border border-gray-200 dark:border-white/10 pl-10 pr-4 py-3 rounded-xl font-black text-emerald-600 dark:text-emerald-400 focus:bg-white dark:focus:bg-blue-950 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm text-sm"/>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1 block transition-colors">Próximo Pago</label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 transition-colors" size={16}/>
                    <input type="date" required value={subFormData.proximo_pago} onChange={(e) => setSubFormData({...subFormData, proximo_pago: e.target.value})} className="w-full bg-white/90 dark:bg-blue-950/30 backdrop-blur-md border border-gray-200 dark:border-white/10 pl-10 pr-4 py-3 rounded-xl font-bold text-gray-800 dark:text-white focus:bg-white dark:focus:bg-blue-950 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm text-sm cursor-pointer"/>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6 pt-5 border-t border-gray-100/50 dark:border-white/5 transition-colors shrink-0">
                <button type="submit" className="flex-1 bg-blue-600/90 dark:bg-blue-600 text-white font-black py-3.5 rounded-xl shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 border border-transparent dark:border-white/10 text-sm"><CheckCircle size={16}/> Actualizar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SuscripcionesSaaS;