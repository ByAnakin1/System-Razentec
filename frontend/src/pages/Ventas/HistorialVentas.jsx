import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react'; // Importamos los íconos para las animaciones
import Layout from '../../components/Layout';
import api from '../../services/api';

const HistorialVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Estados para los modales animados
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ventaToDelete, setVentaToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchVentas();
  }, []);

  const fetchVentas = async () => {
    try {
      const res = await api.get('/ventas');
      setVentas(res.data);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✨ FUNCIÓN DE HORA DE PERÚ APLICADA AL CÓDIGO DE OSVALDO
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '';
    const date = fechaISO.endsWith('Z') ? new Date(fechaISO) : new Date(`${fechaISO}Z`);
    return date.toLocaleString('es-PE', { 
        timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', hour12: true 
    });
  };

  // 1. Abrir la ventana de emergencia
  const handleOpenDelete = (id) => {
    setVentaToDelete(id);
    setShowDeleteModal(true);
  };

  // 2. Confirmar y eliminar
  const confirmDelete = async () => {
    if (!ventaToDelete) return;
    setIsDeleting(true);

    try {
      await api.delete(`/ventas/${ventaToDelete}`);
      
      // Cerramos el modal de advertencia
      setShowDeleteModal(false);
      
      // Actualizamos la tabla para que desaparezca la fila
      setVentas(ventas.filter(venta => venta.id !== ventaToDelete));
      
      // Mostramos la animación verde de éxito
      setShowSuccess(true);
      
      // Ocultamos el mensaje de éxito automáticamente después de 2 segundos
      setTimeout(() => {
        setShowSuccess(false);
        setVentaToDelete(null);
      }, 2000);

    } catch (error) {
      alert("Error al eliminar la venta. Revisa la consola del backend.");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Historial de Ventas</h1>
        <p className="text-gray-500 text-sm mt-1">Listado de transacciones realizadas</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando ventas...</div>
        ) : ventas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay ventas registradas.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">ID Venta</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ventas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-800">#{String(venta.id).padStart(5, '0')}</td>
                    <td className="py-3 px-4 text-gray-600">{formatearFecha(venta.created_at)}</td>
                    <td className="py-3 px-4 text-gray-600">{venta.cliente_nombre || 'Público General'}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-800">S/ {parseFloat(venta.total).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center flex justify-center gap-2">
                      <button 
                        // ✨ CORRECCIÓN DE RUTA DE OSVALDO
                        onClick={() => navigate(`/ventas/${venta.id}`)}
                        className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1 rounded-md transition-colors"
                      >
                        Ver Boleta
                      </button>
                      <button 
                        onClick={() => handleOpenDelete(venta.id)}
                        className="text-red-600 hover:text-red-800 font-medium bg-red-50 px-3 py-1 rounded-md transition-colors"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center transform scale-100 transition-transform">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar esta venta?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Estás a punto de borra la venta <b>#{ventaToDelete}</b>. Esta acción es permanente y no podrás recuperarla.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex justify-center items-center"
              >
                {isDeleting ? 'Borrando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showSuccess && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center animate-bounce">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">¡Eliminada!</h3>
            <p className="text-gray-500">La venta fue borrada con éxito de la base de datos.</p>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default HistorialVentas;