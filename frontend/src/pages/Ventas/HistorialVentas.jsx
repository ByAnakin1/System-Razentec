import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, FileText, Trash2, History, Store, ReceiptText, CalendarDays, User, ArrowRight } from 'lucide-react'; 
import Layout from '../../components/Layout';
import api from '../../services/api';

const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const HistorialVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ventaToDelete, setVentaToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);
  const esVistaGlobal = sucursalActiva?.id === 'ALL';

  const fetchVentas = async () => {
    const currentSucursal = JSON.parse(localStorage.getItem('sucursalActiva'));
    if (!currentSucursal) {
      setVentas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/ventas');
      setVentas(res.data);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
    const handleSucursalCambiada = () => {
      setSucursalActiva(JSON.parse(localStorage.getItem('sucursalActiva')));
      fetchVentas(); 
    };
    window.addEventListener('sucursalCambiada', handleSucursalCambiada);
    return () => window.removeEventListener('sucursalCambiada', handleSucursalCambiada);
  }, []);

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '';
    const date = fechaISO.endsWith('Z') ? new Date(fechaISO) : new Date(`${fechaISO}Z`);
    return date.toLocaleString('es-PE', { 
        timeZone: 'America/Lima', day: '2-digit', month: 'short', year: '2-digit', 
        hour: '2-digit', minute: '2-digit', hour12: true 
    });
  };

  const handleOpenDelete = (id) => {
    setVentaToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!ventaToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/ventas/${ventaToDelete}`);
      setShowDeleteModal(false);
      setVentas(ventas.filter(venta => venta.id !== ventaToDelete));
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setVentaToDelete(null);
      }, 2000);
    } catch (error) {
      alert("Error al eliminar la venta. Revisa la consola del backend.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Layout title="Historial" moduleIcon={<History/>}>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 md:mb-6 gap-3 px-1">
        <p className="text-[10px] md:text-xs text-gray-500 dark:text-blue-300/70 font-bold uppercase tracking-wider transition-colors">
            {esVistaGlobal ? 'Transacciones Globales' : `Sede: ${sucursalActiva?.nombre || 'Ninguna'}`}
        </p>
      </div>

      {/* ✨ VISTA MÓVIL Y TABLET (Liquid Glass) ✨ */}
      <div className="lg:hidden flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-blue-300/70">
             <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
             <p className="text-[10px] font-extrabold uppercase tracking-widest transition-colors">Cargando transacciones...</p>
          </div>
        ) : !sucursalActiva ? (
          <div className="text-center py-10 text-xs text-red-500 bg-red-50/80 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-500/20 backdrop-blur-md transition-colors">
            ⚠️ Sin sucursal asignada.
          </div>
        ) : ventas.length === 0 ? (
          <div className="text-center py-16 bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] border border-gray-100/50 dark:border-white/5 shadow-sm flex flex-col items-center transition-colors">
            <ReceiptText size={48} className="text-gray-300 dark:text-slate-600 mb-3" strokeWidth={1.5}/>
            <p className="text-sm font-black text-gray-600 dark:text-white">Aún no hay ventas registradas</p>
            <p className="text-xs text-gray-400 dark:text-slate-400 mt-1 font-medium">Realiza tu primera venta en el POS.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {ventas.map((venta) => (
              <div key={venta.id} className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-xl rounded-[1.5rem] border border-gray-100/50 dark:border-white/5 p-4 shadow-sm relative group overflow-hidden transition-colors">
                 <div className="flex justify-between items-start mb-3 border-b border-dashed border-gray-200/50 dark:border-slate-700 pb-3 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-500/20 flex items-center justify-center shrink-0 backdrop-blur-md transition-colors">
                          <ReceiptText size={18}/>
                       </div>
                       <div>
                         <p className="font-black text-gray-800 dark:text-white text-sm tracking-tight transition-colors">#{String(venta.id).padStart(5, '0')}</p>
                         <p className="text-[9px] font-bold text-gray-400 dark:text-slate-400 flex items-center gap-1 mt-0.5 uppercase tracking-wider transition-colors"><CalendarDays size={10}/> {formatearFecha(venta.created_at)}</p>
                       </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-extrabold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest mb-0.5 transition-colors">Total</p>
                      <p className="font-black text-emerald-600 dark:text-emerald-400 text-lg leading-none transition-colors">S/ {parseFloat(venta.total).toFixed(2)}</p>
                    </div>
                 </div>

                 <div className="bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-gray-100 dark:border-white/5 mb-3 flex flex-col gap-1.5 backdrop-blur-md transition-colors">
                    <div className="flex items-center gap-2">
                      <User size={12} className="text-gray-400 dark:text-slate-500 shrink-0"/>
                      <span className="text-[11px] font-bold text-gray-700 dark:text-slate-300 truncate transition-colors">{venta.cliente_nombre || 'Público General'}</span>
                    </div>
                    {esVistaGlobal && (
                      <div className="flex items-center gap-2">
                        <Store size={12} className="text-purple-400 shrink-0"/>
                        <span className="text-[9px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-200/50 dark:border-purple-500/20 truncate transition-colors">
                          {venta.sucursal_nombre || 'No asignado'}
                        </span>
                      </div>
                    )}
                 </div>

                 <div className="flex gap-2">
                   <button onClick={() => navigate(`/ventas/${venta.id}`)} className="flex-1 py-2.5 bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100/50 dark:border-blue-500/20 rounded-xl font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center justify-center gap-1.5 transition-colors backdrop-blur-md active:scale-95">
                     <FileText size={14}/> Ver Boleta
                   </button>
                   <button onClick={() => handleOpenDelete(venta.id)} className="w-12 py-2.5 bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100/50 dark:border-red-500/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center justify-center transition-colors backdrop-blur-md active:scale-95">
                     <Trash2 size={16}/>
                   </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✨ VISTA PC: Tabla (Liquid Glass) ✨ */}
      <div className="hidden lg:block bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/80 dark:border-white/5 overflow-hidden transition-colors duration-300">
        <div className={`overflow-x-auto ${hideScrollbar}`}>
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 dark:bg-blue-950/30 text-slate-500 dark:text-blue-300 uppercase font-extrabold tracking-widest text-[10px] border-b border-gray-200/50 dark:border-white/5 transition-colors">
              <tr>
                <th className="px-6 py-5 text-center">N° Boleta</th>
                {esVistaGlobal && <th className="px-6 py-5">Sucursal</th>}
                <th className="px-6 py-5">Fecha</th>
                <th className="px-6 py-5">Cliente</th>
                <th className="px-6 py-5 text-right">Monto Total</th>
                <th className="px-6 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50 dark:divide-white/5 relative">
              {loading ? <tr><td colSpan="6" className="text-center py-12 text-gray-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest transition-colors">Cargando transacciones...</td></tr> : 
               !sucursalActiva ? <tr><td colSpan="6" className="text-center py-12 text-red-500 font-bold transition-colors">⚠️ Sin sucursal asignada.</td></tr> :
               ventas.length === 0 ? <tr><td colSpan="6" className="text-center py-12 font-medium text-gray-400 dark:text-slate-500 transition-colors">No hay ventas registradas.</td></tr> :
               ventas.map((venta) => (
                <tr key={venta.id} className="hover:bg-white/40 dark:hover:bg-blue-900/10 transition-colors duration-200 group">
                  <td className="px-6 py-5 font-black text-gray-800 dark:text-white text-center font-mono transition-colors">#{String(venta.id).padStart(5, '0')}</td>
                  
                  {esVistaGlobal && (
                    <td className="px-6 py-5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-900/30 border border-purple-100/50 dark:border-purple-500/20 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 w-fit transition-colors">
                        <Store size={12}/> {venta.sucursal_nombre || 'No asignado'}
                      </span>
                    </td>
                  )}

                  <td className="px-6 py-5 text-[10px] font-bold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest transition-colors">{formatearFecha(venta.created_at)}</td>
                  <td className="px-6 py-5 font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-gray-200/50 dark:border-white/5"><User size={14}/></div>
                    {venta.cliente_nombre || 'Público General'}
                  </td>
                  <td className="px-6 py-5 text-right font-black text-emerald-600 dark:text-emerald-400 transition-colors">S/ {parseFloat(venta.total).toFixed(2)}</td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => navigate(`/ventas/${venta.id}`)} className="px-3 py-2 bg-blue-50/80 dark:bg-blue-900/30 border border-blue-100/50 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 backdrop-blur-md rounded-lg font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-colors active:scale-95">
                        <FileText size={14} /> Boleta
                      </button>
                      <button onClick={() => handleOpenDelete(venta.id)} className="p-2 bg-red-50/80 dark:bg-red-900/30 border border-red-100/50 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 backdrop-blur-md rounded-lg transition-colors active:scale-95">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ELIMINAR */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md transition-colors animate-fade-in">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-3xl sm:rounded-[2.5rem] p-6 md:p-8 w-full sm:max-w-sm text-center shadow-2xl border border-white/50 dark:border-white/10 animate-fade-in-up pb-8 transition-colors">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50/80 dark:bg-red-900/30 border border-red-100 dark:border-red-500/20 mb-4 text-red-500 dark:text-red-400 shadow-sm backdrop-blur-md">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2 transition-colors">¿Anular Venta?</h3>
            <p className="text-xs md:text-sm text-gray-500 dark:text-blue-200/70 mb-8 font-medium leading-relaxed transition-colors">
              La boleta <b className="text-gray-800 dark:text-blue-100 font-black">#{String(ventaToDelete).padStart(5, '0')}</b> será eliminada y el stock regresará al inventario.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="flex-1 py-3.5 bg-gray-100/80 dark:bg-slate-800/80 border border-transparent dark:border-white/5 text-gray-700 dark:text-slate-300 font-extrabold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-sm backdrop-blur-md shadow-sm">
                Cancelar
              </button>
              <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 py-3.5 bg-red-600/90 dark:bg-red-600 border border-red-500/50 text-white font-black rounded-xl hover:bg-red-700 active:scale-95 shadow-lg shadow-red-600/20 dark:shadow-red-900/40 transition-all text-sm flex justify-center items-center backdrop-blur-md">
                {isDeleting ? 'Anulando...' : 'Sí, Anular'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL ÉXITO */}
      {showSuccess && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-fade-in transition-colors">
           <div className="bg-white/90 dark:bg-blue-950/80 backdrop-blur-2xl border border-white/50 dark:border-white/10 px-8 py-6 rounded-3xl shadow-xl flex flex-col items-center animate-bounce transition-colors">
              <CheckCircle size={40} className="text-emerald-500 dark:text-emerald-400 mb-3"/>
              <p className="font-black text-sm text-gray-800 dark:text-white transition-colors">Venta anulada con éxito</p>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default HistorialVentas;