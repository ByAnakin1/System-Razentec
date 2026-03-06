import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Store, User, CalendarDays, ReceiptText, CheckCircle, FileText, Building2, Ticket } from 'lucide-react';
import api from '../../services/api';
import Layout from '../../components/Layout';

const DetalleVenta = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✨ NUEVO ESTADO: Controla qué diseño se muestra y se imprime
  const [vistaActiva, setVistaActiva] = useState('empresa'); // 'empresa' | 'cliente'

  useEffect(() => {
    const fetchVenta = async () => {
      try {
        const res = await api.get(`/ventas/${id}`);
        setVenta(res.data);
      } catch (err) {
        console.error(err);
        setError('Error al cargar la boleta. Es posible que haya sido eliminada.');
      } finally {
        setLoading(false); 
      }
    };
    fetchVenta();
  }, [id]);

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '';
    const date = fechaISO.endsWith('Z') ? new Date(fechaISO) : new Date(`${fechaISO}Z`);
    return date.toLocaleString('es-PE', { 
        timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
          <span className="text-slate-500 font-extrabold tracking-widest uppercase text-sm animate-pulse">Generando Comprobante...</span>
        </div>
      </Layout>
    );
  }

  if (error || !venta) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[70vh] text-center">
          <div className="bg-red-50 text-red-500 p-6 rounded-full mb-4"><ReceiptText size={48}/></div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Comprobante no encontrado</h2>
          <p className="text-slate-500 font-medium mb-6">{error}</p>
          <button onClick={() => navigate('/historial-ventas')} className="bg-slate-800 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-900 transition-colors shadow-lg">
            Regresar al Historial
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* 🛑 CABECERA DE NAVEGACIÓN E IMPRESIÓN (OCULTA AL IMPRIMIR) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 print:hidden px-1">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/historial-ventas')} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-gray-600 hover:text-blue-600">
            <ArrowLeft size={22}/>
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
              <FileText className="text-blue-600"/> Detalle de Venta
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-0.5">Registro N° {venta.id}</p>
          </div>
        </div>
        
        <button onClick={handlePrint} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-blue-600 font-extrabold px-6 py-2.5 rounded-xl shadow-sm transition-all w-full sm:w-auto justify-center">
          <Printer size={18}/> Imprimir
        </button>
      </div>

      {/* 🛑 SELECTOR DE VISTAS (OCULTO AL IMPRIMIR) */}
      <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm w-fit print:hidden">
        <button 
          onClick={() => setVistaActiva('empresa')} 
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-colors ${vistaActiva === 'empresa' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Building2 size={16}/> Vista Empresa (A4)
        </button>
        <button 
          onClick={() => setVistaActiva('cliente')} 
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-colors ${vistaActiva === 'cliente' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Ticket size={16}/> Ticket Cliente (POS)
        </button>
      </div>

      {/* ============================================================== */}
      {/* ✨ SECCIÓN IMPRIMIBLE: CAMBIA SU CSS SEGÚN LA VISTA ACTIVA */}
      {/* ============================================================== */}
      <div id="print-section" className={`bg-white rounded-2xl shadow-sm border border-gray-200 transition-all ${vistaActiva === 'cliente' ? 'ticket-mode max-w-[400px] mx-auto p-8' : 'a4-mode p-8 w-full'}`}>
        
        {vistaActiva === 'empresa' && (
          /* ========================================== */
          /* 🏢 DISEÑO 1: VISTA EMPRESA (TIPO A4 / INGRESO) */
          /* ========================================== */
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              
              {/* Tarjeta Cliente */}
              <div className="p-6 border border-gray-100 bg-gray-50/50 rounded-2xl">
                <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-3"><User size={14}/> CLIENTE</h3>
                <p className="text-xl font-bold text-gray-800">{venta.cliente_nombre || 'Público General'}</p>
                <p className="text-sm text-gray-500 font-medium mt-1">Doc/RUC: {venta.documento_identidad || 'S/C'}</p>
              </div>

              {/* Tarjeta Datos de Comprobante */}
              <div className="p-6 border border-gray-100 bg-gray-50/50 rounded-2xl relative">
                <div className="absolute top-6 right-6 bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle size={12}/> COMPLETADO
                </div>
                <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-5"><CalendarDays size={14}/> DATOS DEL COMPROBANTE</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-400 font-extrabold uppercase mb-1">Comprobante</p>
                    <p className="font-bold text-gray-800">BOL-{String(venta.id).padStart(5, '0')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-extrabold uppercase mb-1">Fecha de Emisión</p>
                    <p className="font-bold text-gray-800">{formatearFecha(venta.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de Productos Empresa */}
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="border-b-2 border-gray-100 text-slate-800">
                  <tr>
                    <th className="py-3 font-extrabold text-gray-500 uppercase text-xs tracking-wider">Código</th>
                    <th className="py-3 font-extrabold text-gray-500 uppercase text-xs tracking-wider">Producto</th>
                    <th className="py-3 font-extrabold text-gray-500 uppercase text-xs tracking-wider text-center">Cant.</th>
                    <th className="py-3 font-extrabold text-gray-500 uppercase text-xs tracking-wider text-center">Precio Unit.</th>
                    <th className="py-3 font-extrabold text-gray-500 uppercase text-xs tracking-wider text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {venta.detalles?.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 text-gray-400 font-medium text-xs">{item.sku || 'S/C'}</td>
                      <td className="py-4 font-bold text-gray-800">{item.producto_nombre}</td>
                      <td className="py-4 font-extrabold text-blue-600 text-center">{item.cantidad}</td>
                      <td className="py-4 text-gray-600 font-medium text-center">S/ {parseFloat(item.precio_unitario).toFixed(2)}</td>
                      <td className="py-4 font-bold text-gray-800 text-right">S/ {parseFloat(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Empresa */}
            <div className="flex justify-end">
              <div className="bg-gray-50 px-8 py-5 rounded-2xl flex items-center gap-10 border border-gray-100 shadow-inner">
                <span className="text-sm font-extrabold text-gray-500 uppercase tracking-widest">Total</span>
                <span className="text-3xl font-black text-emerald-600">S/ {parseFloat(venta.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {vistaActiva === 'cliente' && (
          /* ========================================== */
          /* 🧾 DISEÑO 2: VISTA CLIENTE (TICKET TÉRMICO POS) */
          /* ========================================== */
          <div className="animate-fade-in bg-white">
            <div className="text-center border-b-2 border-dashed border-gray-300 pb-6 mb-6">
              <div className="mx-auto w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center mb-3 shadow-inner">
                 <Store size={28}/>
              </div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Razentec</h2>
              <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-widest">Comprobante de Venta</p>
            </div>

            <div className="space-y-3 text-sm text-slate-600 mb-6 border-b-2 border-dashed border-gray-300 pb-6">
              <div className="flex justify-between items-center">
                <span className="font-bold flex items-center gap-1.5"><ReceiptText size={14}/> Boleta N°:</span>
                <span className="font-mono font-bold text-slate-900">BOL-{String(venta.id).padStart(5, '0')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold flex items-center gap-1.5"><CalendarDays size={14}/> Fecha:</span>
                <span className="font-medium text-right">{formatearFecha(venta.created_at)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold flex items-center gap-1.5"><User size={14}/> Cliente:</span>
                <span className="font-extrabold text-slate-800 text-right">{venta.cliente_nombre || 'Público General'}</span>
              </div>
              {venta.documento_identidad && (
                <div className="flex justify-between items-center">
                  <span className="font-bold ml-5">Doc:</span>
                  <span className="font-medium">{venta.documento_identidad}</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Descripción de Artículos</h3>
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 text-slate-800">
                  <tr>
                    <th className="text-left pb-2 font-bold w-12">Cant.</th>
                    <th className="text-left pb-2 font-bold">Producto</th>
                    <th className="text-right pb-2 font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 font-medium">
                  {venta.detalles?.map((item, index) => (
                    <tr key={index} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 align-top">{item.cantidad}x</td>
                      <td className="py-3 pr-2">
                        <p className="text-slate-800 font-bold leading-tight">{item.producto_nombre}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{item.sku}</p>
                        <p className="text-xs text-slate-500 mt-0.5">S/ {parseFloat(item.precio_unitario).toFixed(2)} c/u</p>
                      </td>
                      <td className="py-3 align-top text-right font-bold text-slate-800">
                        S/ {parseFloat(item.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t-2 border-dashed border-gray-300 pt-6">
              <div className="flex justify-between items-center mb-2 text-slate-500 font-bold text-sm">
                <span>Subtotal:</span>
                <span>S/ {(parseFloat(venta.total) / 1.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-4 text-slate-500 font-bold text-sm">
                <span>IGV (18%):</span>
                <span>S/ {(parseFloat(venta.total) - (parseFloat(venta.total) / 1.18)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-lg font-black text-slate-800 uppercase">Total Pago</span>
                <span className="text-2xl font-black text-blue-700">S/ {parseFloat(venta.total).toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-8 text-center space-y-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <div className="flex justify-center text-emerald-500 mb-2"><CheckCircle size={24}/></div>
              <p>¡Gracias por su compra!</p>
              <p className="text-[10px]">Cajero: {venta.cajero_nombre || 'Sistema'}</p>
            </div>
          </div>
        )}

      </div>
      
      {/* ✨ MAGIA CSS: OCULTAR TODO Y CENTRAR EL TICKET AL IMPRIMIR */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          #print-section, #print-section * { visibility: visible; }
          
          #print-section {
            position: absolute;
            top: 0;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Modo Ticket: Alineación perfecta al centro del papel */
          #print-section.ticket-mode {
            left: 50%;
            transform: translateX(-50%);
            width: 80mm !important; /* Estándar de impresora térmica POS */
          }

          /* Modo Empresa: Se expande en tamaño A4 */
          #print-section.a4-mode {
            left: 0;
            width: 100% !important;
          }
        }
      `}} />
    </Layout>
  );
};

export default DetalleVenta;