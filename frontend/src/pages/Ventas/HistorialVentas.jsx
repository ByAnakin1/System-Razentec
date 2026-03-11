import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, FileText, Trash2, History, Store } from 'lucide-react'; 
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

  // ✨ ESTADO GLOBAL PARA SABER EN QUÉ VISTA ESTAMOS
  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);
  const esVistaGlobal = sucursalActiva?.id === 'ALL';

  const fetchVentas = async () => {
    // 🚨 SEMÁFORO: Si no hay sucursal definida, espera.
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
    
    // ✨ RECARGA AUTOMÁTICA AL CAMBIAR DE SUCURSAL ARRIBA
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
        timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric', 
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
    <Layout>
      <div className="mb-6 flex items-center gap-2">
        <History className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Historial de Ventas</h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            {esVistaGlobal ? 'Viendo todas las transacciones de la empresa' : `Viendo transacciones de: ${sucursalActiva?.nombre || '...'}`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border-2 border-slate-300 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-bold">Cargando ventas...</div>
        ) : !sucursalActiva ? (
          <div className="p-8 text-center text-red-500 font-bold bg-red-50">⚠️ No se ha detectado sucursal autorizada.</div>
        ) : ventas.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-bold">No hay ventas registradas en esta vista.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-100 text-slate-800 border-b-2 border-slate-300 uppercase text-xs font-extrabold tracking-wider">
                <tr>
                  <th className="py-4 px-5 border-r border-slate-300 w-32 text-center">ID Venta</th>
                  {/* ✨ COLUMNA SUCURSAL SOLO SI ESTÁ EN MODO GLOBAL */}
                  {esVistaGlobal && <th className="py-4 px-5 border-r border-slate-300">Sucursal</th>}
                  <th className="py-4 px-5 border-r border-slate-300">Fecha</th>
                  <th className="py-4 px-5 border-r border-slate-300">Cliente</th>
                  <th className="py-4 px-5 border-r border-slate-300 text-right w-40">Total</th>
                  <th className="py-4 px-5 text-center w-64">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-200">
                {ventas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-5 font-bold text-slate-800 border-r border-slate-200 text-center font-mono">
                      #{String(venta.id).padStart(5, '0')}
                    </td>
                    
                    {/* ✨ ETIQUETA SUCURSAL */}
                    {esVistaGlobal && (
                      <td className="py-3 px-5 border-r border-slate-200">
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded flex items-center gap-1 w-max">
                          <Store size={12}/> {venta.sucursal_nombre || 'Local no asignado'}
                        </span>
                      </td>
                    )}

                    <td className="py-3 px-5 text-slate-600 font-medium border-r border-slate-200">
                      {formatearFecha(venta.created_at)}
                    </td>
                    <td className="py-3 px-5 text-slate-700 font-bold border-r border-slate-200">
                      {venta.cliente_nombre || 'Público General'}
                    </td>
                    <td className="py-3 px-5 text-right font-extrabold text-emerald-700 border-r border-slate-200 bg-emerald-50/20">
                      S/ {parseFloat(venta.total).toFixed(2)}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => navigate(`/ventas/${venta.id}`)}
                          className="flex items-center gap-1.5 text-blue-700 hover:text-white font-bold bg-blue-100 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors border border-blue-200 hover:border-blue-600 shadow-sm"
                        >
                          <FileText size={16} /> Ver Boleta
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(venta.id)}
                          className="flex items-center gap-1.5 text-red-700 hover:text-white font-bold bg-red-100 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors border border-red-200 hover:border-red-600 shadow-sm"
                        >
                          <Trash2 size={16} /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center transform scale-100 transition-transform border border-white/50">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-50 border-4 border-red-100 mb-6">
              <AlertCircle className="h-10 w-10 text-red-600 animate-pulse" />
            </div>
            <h3 className="text-2xl font-extrabold text-gray-800 mb-2">¿Eliminar esta venta?</h3>
            <p className="text-sm text-gray-500 mb-8 font-medium">
              Estás a punto de borrar la venta <b className="text-gray-800">#{String(ventaToDelete).padStart(5, '0')}</b>. Esta acción es permanente y devolverá el stock al inventario.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="flex-1 px-4 py-3 border-2 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-600/30 disabled:opacity-50 flex justify-center items-center">
                {isDeleting ? 'Borrando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showSuccess && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-10 text-center animate-bounce border border-white/50">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-50 border-4 border-green-100 mb-6">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h3 className="text-3xl font-extrabold text-gray-800 mb-2">¡Eliminada!</h3>
            <p className="text-gray-500 font-medium">La venta fue borrada con éxito de la base de datos.</p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default HistorialVentas;