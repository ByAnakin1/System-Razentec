import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, FileText, Trash2, History, Store, ReceiptText, CalendarDays, User, ArrowRight } from 'lucide-react'; 
import Layout from '../../components/Layout';
import api from '../../services/api';

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
        timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: '2-digit', 
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
    <Layout title="Historial de Ventas" moduleIcon={<History/>}>
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 md:mb-6 gap-3">
        <p className="text-[11px] md:text-sm text-gray-500 font-bold px-1 uppercase tracking-wider">
            {esVistaGlobal ? 'Transacciones Globales' : `Sede: ${sucursalActiva?.nombre || 'Ninguna'}`}
        </p>
      </div>

      {/* ✨ VISTA MÓVIL: Tarjetas de Transacciones ✨ */}
      <div className="md:hidden flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
             <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
             <p className="text-xs font-medium">Cargando transacciones...</p>
          </div>
        ) : !sucursalActiva ? (
          <div className="text-center py-10 text-xs text-red-500 bg-red-50 rounded-2xl border border-red-100">
            ⚠️ Sin sucursal asignada.
          </div>
        ) : ventas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center">
            <ReceiptText size={48} className="text-gray-200 mb-3" strokeWidth={1.5}/>
            <p className="text-sm font-bold text-gray-600">Aún no hay ventas registradas</p>
            <p className="text-xs text-gray-400 mt-1">Realiza tu primera venta en el POS.</p>
          </div>
        ) : (
          ventas.map((venta) => (
            <div key={venta.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm relative group overflow-hidden">
               {/* Banda superior de la tarjeta */}
               <div className="flex justify-between items-start mb-3 border-b border-dashed border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                     <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <ReceiptText size={18}/>
                     </div>
                     <div>
                       <p className="font-extrabold text-gray-800 text-sm">#{String(venta.id).padStart(5, '0')}</p>
                       <p className="text-[9px] font-bold text-gray-400 flex items-center gap-1 mt-0.5"><CalendarDays size={10}/> {formatearFecha(venta.created_at)}</p>
                     </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total</p>
                    <p className="font-black text-emerald-600 text-lg leading-none">S/ {parseFloat(venta.total).toFixed(2)}</p>
                  </div>
               </div>

               {/* Info del Cliente y Sucursal */}
               <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-gray-400 shrink-0"/>
                    <span className="text-[11px] font-bold text-gray-700 truncate">{venta.cliente_nombre || 'Público General'}</span>
                  </div>
                  {esVistaGlobal && (
                    <div className="flex items-center gap-2">
                      <Store size={12} className="text-purple-400 shrink-0"/>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-100/50 px-1.5 rounded truncate">
                        {venta.sucursal_nombre || 'No asignado'}
                      </span>
                    </div>
                  )}
               </div>

               {/* Botones de Acción */}
               <div className="flex gap-2">
                 <button onClick={() => navigate(`/ventas/${venta.id}`)} className="flex-1 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold text-xs hover:bg-blue-100 flex items-center justify-center gap-1.5 transition-colors">
                   <FileText size={14}/> Ver Boleta
                 </button>
                 <button onClick={() => handleOpenDelete(venta.id)} className="w-12 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 flex items-center justify-center transition-colors">
                   <Trash2 size={16}/>
                 </button>
               </div>
            </div>
          ))
        )}
      </div>

      {/* ✨ VISTA PC: Tabla Elegante ✨ */}
      <div className="hidden md:block bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold tracking-wider text-[10px] border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-center">N° Boleta</th>
              {esVistaGlobal && <th className="px-6 py-4">Sucursal</th>}
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4 text-right">Monto Total</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan="6" className="text-center py-12 text-gray-400 font-medium">Cargando transacciones...</td></tr> : 
             !sucursalActiva ? <tr><td colSpan="6" className="text-center py-12 text-red-500 font-medium">⚠️ Sin sucursal asignada.</td></tr> :
             ventas.length === 0 ? <tr><td colSpan="6" className="text-center py-12 italic text-gray-400">No hay ventas registradas.</td></tr> :
             ventas.map((venta) => (
              <tr key={venta.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4 font-bold text-gray-800 text-center font-mono">#{String(venta.id).padStart(5, '0')}</td>
                
                {esVistaGlobal && (
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded-md flex items-center gap-1 w-fit">
                      <Store size={12}/> {venta.sucursal_nombre || 'No asignado'}
                    </span>
                  </td>
                )}

                <td className="px-6 py-4 text-[11px] font-bold text-gray-500">{formatearFecha(venta.created_at)}</td>
                <td className="px-6 py-4 font-bold text-slate-700 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User size={12}/></div>
                  {venta.cliente_nombre || 'Público General'}
                </td>
                <td className="px-6 py-4 text-right font-black text-emerald-600 bg-emerald-50/20">S/ {parseFloat(venta.total).toFixed(2)}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => navigate(`/ventas/${venta.id}`)} className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors">
                      <FileText size={14} /> Boleta
                    </button>
                    <button onClick={() => handleOpenDelete(venta.id)} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
             ))}
          </tbody>
        </table>
      </div>

      {/* ✨ MODAL ELIMINAR (Bottom Sheet Móvil) ✨ */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-[2rem] p-6 md:p-8 w-full sm:max-w-sm text-center shadow-2xl animate-fade-in-up pb-8">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 border-4 border-red-100 mb-4 text-red-500 shadow-inner">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">¿Anular Venta?</h3>
            <p className="text-xs md:text-sm text-gray-500 mb-6 font-medium leading-relaxed">
              La boleta <b className="text-gray-800">#{String(ventaToDelete).padStart(5, '0')}</b> será eliminada y el stock regresará al inventario.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm">
                Cancelar
              </button>
              <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-600/30 transition-colors text-sm flex justify-center items-center">
                {isDeleting ? 'Anulando...' : 'Sí, Anular'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ✨ MODAL ÉXITO ✨ */}
      {showSuccess && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white px-8 py-6 rounded-3xl shadow-xl flex flex-col items-center animate-bounce border border-white/50">
              <CheckCircle size={40} className="text-emerald-500 mb-3"/>
              <p className="font-extrabold text-sm text-gray-800">Venta anulada con éxito</p>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default HistorialVentas;