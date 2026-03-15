import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Store, User, CalendarDays, ReceiptText, CheckCircle, FileText, Building2, Ticket, MapPin } from 'lucide-react';
import api from '../../services/api';
import Layout from '../../components/Layout';

const DetalleVenta = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [vistaActiva, setVistaActiva] = useState('empresa'); 

  useEffect(() => {
    const fetchVenta = async () => {
      try {
        const res = await api.get(`/ventas/${id}`);
        setVenta(res.data);
      } catch (err) {
        console.error(err);
        setError('Error al cargar la boleta. Es posible que haya sido eliminada o no tengas permisos.');
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
      <Layout title="Comprobante" moduleIcon={<FileText/>}>
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
           <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-sm font-bold tracking-widest uppercase animate-pulse">Generando Documento...</p>
        </div>
      </Layout>
    );
  }

  if (error || !venta) {
    return (
      <Layout title="Comprobante" moduleIcon={<FileText/>}>
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
          <div className="bg-red-50 text-red-500 p-6 rounded-full mb-6 border-4 border-white shadow-sm"><ReceiptText size={48}/></div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 mb-2">Comprobante no encontrado</h2>
          <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">{error}</p>
          <button onClick={() => navigate('/ventas')} className="bg-blue-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 w-full">
            Regresar al Historial
          </button>
        </div>
      </Layout>
    );
  }

  return (
    // ✨ FIX: Título más corto ("Comprobante") para que no se corte en el navbar del móvil ✨
    <Layout title="Comprobante" moduleIcon={<FileText/>}>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 print:hidden px-1">
        <div>
          <p className="text-[10px] md:text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">
            Registro N° {venta.id}
          </p>
          <button onClick={() => navigate('/ventas')} className="text-blue-600 hover:text-blue-800 font-bold text-xs md:text-sm flex items-center gap-1.5 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Volver al Historial
          </button>
        </div>
        
        <button onClick={handlePrint} className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 text-sm">
          <Printer size={16}/> Imprimir Documento
        </button>
      </div>

      <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-full md:w-fit mb-4 md:mb-6 print:hidden mx-auto sm:mx-0">
        <button 
          onClick={() => setVistaActiva('empresa')} 
          className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-bold text-[11px] md:text-sm transition-all ${vistaActiva === 'empresa' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Building2 size={14}/> Formato A4
        </button>
        <button 
          onClick={() => setVistaActiva('cliente')} 
          className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-bold text-[11px] md:text-sm transition-all ${vistaActiva === 'cliente' ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <Ticket size={14}/> Ticket POS
        </button>
      </div>

      {/* ✨ ÁREA DE IMPRESIÓN (Paddings reducidos en móvil) ✨ */}
      <div id="print-section" className={`bg-white shadow-sm border border-gray-200 transition-all ${vistaActiva === 'cliente' ? 'ticket-mode max-w-[380px] mx-auto p-5 md:p-8 rounded-2xl md:rounded-3xl' : 'a4-mode p-4 md:p-10 w-full rounded-2xl md:rounded-[2rem]'}`}>
        
        {/* =========================================
            FORMATO EMPRESA (A4)
            ========================================= */}
        {vistaActiva === 'empresa' && (
          <div className="animate-fade-in">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 md:mb-8 pb-4 md:pb-6 border-b border-gray-100 gap-4 md:gap-6">
              <div>
                <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                   <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 text-white rounded-lg md:rounded-xl flex items-center justify-center shadow-sm shrink-0">
                      <Store size={16} className="md:w-5 md:h-5"/>
                   </div>
                   <h2 className="text-lg md:text-3xl font-black text-gray-800 uppercase tracking-tight">Razentec</h2>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg border border-gray-200 w-fit">
                  <MapPin size={12} className="text-blue-600 md:w-3.5 md:h-3.5"/>
                  <span className="font-bold text-[10px] md:text-sm">Sede: {venta.sucursal_nombre || 'No asignada'}</span>
                </div>
              </div>

              <div className="md:text-right flex flex-col md:items-end w-full md:w-auto">
                <div className="bg-emerald-50 text-emerald-600 text-[10px] md:text-xs font-extrabold px-2.5 md:px-3 py-1 md:py-1.5 rounded-full flex items-center gap-1.5 mb-2 w-fit border border-emerald-100 shadow-sm md:ml-auto">
                  <CheckCircle size={12} className="md:w-3.5 md:h-3.5"/> PAGADO
                </div>
                <p className="text-base md:text-xl font-black text-gray-800">BOL-{String(venta.id).padStart(5, '0')}</p>
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase mt-0.5 flex items-center gap-1 md:gap-1.5 md:justify-end">
                  <CalendarDays size={10} className="md:w-3 md:h-3"/> {formatearFecha(venta.created_at)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-5 md:mb-8">
              <div className="p-3 md:p-5 border border-gray-100 bg-slate-50/50 rounded-xl md:rounded-2xl">
                <h3 className="text-[9px] md:text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-2 md:mb-3 bg-blue-50 w-fit px-2 py-0.5 md:py-1 rounded"><User size={10} className="md:w-3 md:h-3"/> Cliente</h3>
                <p className="text-xs md:text-lg font-bold text-gray-800">{venta.cliente_nombre || 'Público General'}</p>
                <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-0.5 md:mt-1">Doc: {venta.documento_identidad || 'S/C'}</p>
              </div>

              <div className="p-3 md:p-5 border border-gray-100 bg-slate-50/50 rounded-xl md:rounded-2xl">
                <h3 className="text-[9px] md:text-[10px] font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-2 md:mb-3 bg-blue-50 w-fit px-2 py-0.5 md:py-1 rounded"><FileText size={10} className="md:w-3 md:h-3"/> Detalles de Pago</h3>
                <p className="text-[10px] md:text-xs text-gray-500 font-bold mb-1">Cajero: <span className="text-gray-800 font-bold ml-1">{venta.cajero_nombre || 'Usuario Sistema'}</span></p>
                {venta.metodo_pago && (
                  <p className="text-[10px] md:text-xs text-gray-500 font-bold">Método: <span className="text-gray-800 font-bold uppercase ml-1">{venta.metodo_pago.replace('_', ' ')}</span></p>
                )}
              </div>
            </div>

            {/* ✨ FIX: TABLA ULTRA COMPACTA EN MÓVIL (Paddings reducidos y scroll oculto) ✨ */}
            <div className="overflow-x-auto mb-6 md:mb-8 border border-gray-200 rounded-xl md:rounded-2xl shadow-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="py-2 px-3 md:py-4 md:px-5 font-extrabold uppercase text-[8px] md:text-[10px] tracking-wider">Código</th>
                    <th className="py-2 px-3 md:py-4 md:px-5 font-extrabold uppercase text-[8px] md:text-[10px] tracking-wider">Descripción</th>
                    <th className="py-2 px-3 md:py-4 md:px-5 font-extrabold uppercase text-[8px] md:text-[10px] tracking-wider text-center">Cant.</th>
                    <th className="py-2 px-3 md:py-4 md:px-5 font-extrabold uppercase text-[8px] md:text-[10px] tracking-wider text-center">Precio U.</th>
                    <th className="py-2 px-3 md:py-4 md:px-5 font-extrabold uppercase text-[8px] md:text-[10px] tracking-wider text-right bg-gray-100/50">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {venta.detalles?.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 md:py-3.5 md:px-5 text-gray-400 font-bold text-[9px] md:text-[11px]">{item.sku || 'S/C'}</td>
                      <td className="py-2.5 px-3 md:py-3.5 md:px-5 font-bold text-[10px] md:text-sm">{item.producto_nombre}</td>
                      <td className="py-2.5 px-3 md:py-3.5 md:px-5 font-extrabold text-blue-600 text-center bg-blue-50/30 text-[10px] md:text-sm">{item.cantidad}</td>
                      <td className="py-2.5 px-3 md:py-3.5 md:px-5 font-medium text-center text-[10px] md:text-xs">S/ {parseFloat(item.precio_unitario).toFixed(2)}</td>
                      <td className="py-2.5 px-3 md:py-3.5 md:px-5 font-black text-gray-900 text-right bg-gray-50/50 text-[10px] md:text-sm">S/ {parseFloat(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-full sm:w-80 space-y-1.5 md:space-y-2 bg-slate-50 p-4 md:p-5 rounded-xl md:rounded-2xl border border-slate-200">
                <div className="flex justify-between text-gray-500 font-bold text-[10px] md:text-xs">
                  <span>Subtotal Gravado:</span>
                  <span>S/ {(parseFloat(venta.total) / 1.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-bold text-[10px] md:text-xs border-b border-gray-200 pb-2 md:pb-3 mb-2 md:mb-3">
                  <span>IGV (18%):</span>
                  <span>S/ {(parseFloat(venta.total) - (parseFloat(venta.total) / 1.18)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-900">
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Importe Total</span>
                  <span className="text-xl md:text-2xl font-black text-blue-600">S/ {parseFloat(venta.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 md:mt-12 text-center text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-4 md:pt-6 border-t border-dashed border-gray-200">
              Gracias por su preferencia • Documento generado por Razentec SaaS
            </div>
          </div>
        )}

        {/* =========================================
            FORMATO TICKET (POS Térmica)
            ========================================= */}
        {vistaActiva === 'cliente' && (
          <div className="animate-fade-in bg-white text-gray-800">
            <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 md:pb-5 mb-4 md:mb-5">
              <div className="mx-auto w-10 h-10 md:w-12 md:h-12 bg-slate-900 text-white rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-3 shadow-sm">
                 <Store size={20} className="md:w-6 md:h-6"/>
              </div>
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tight leading-none mb-1">Razentec</h2>
              <p className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-widest">{venta.sucursal_nombre || 'Sede Principal'}</p>
            </div>

            <div className="space-y-1.5 md:space-y-2 text-[10px] md:text-xs font-medium text-gray-600 mb-4 md:mb-5 border-b-2 border-dashed border-gray-300 pb-4 md:pb-5">
              <div className="flex justify-between items-center">
                <span>N° Boleta:</span>
                <span className="font-mono font-bold text-gray-900">B-{String(venta.id).padStart(5, '0')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Fecha:</span>
                <span>{formatearFecha(venta.created_at)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 mt-1 border-t border-gray-100">
                <span>Cliente:</span>
                <span className="font-bold text-gray-900 text-right truncate max-w-[150px]">{venta.cliente_nombre || 'Público General'}</span>
              </div>
              {venta.documento_identidad && (
                <div className="flex justify-between items-center">
                  <span>Doc:</span>
                  <span>{venta.documento_identidad}</span>
                </div>
              )}
            </div>

            <div className="mb-4 md:mb-5 border-b-2 border-dashed border-gray-300 pb-2">
              <table className="w-full text-[10px] md:text-xs">
                <thead className="text-gray-400 border-b border-gray-200">
                  <tr>
                    <th className="text-left pb-1 font-bold uppercase text-[8px] md:text-[9px] w-6 md:w-8">Cant</th>
                    <th className="text-left pb-1 font-bold uppercase text-[8px] md:text-[9px]">Desc</th>
                    <th className="text-right pb-1 font-bold uppercase text-[8px] md:text-[9px]">Imp</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 font-bold">
                  {venta.detalles?.map((item, index) => (
                    <tr key={index}>
                      <td className="py-1.5 md:py-2 align-top text-gray-500">{item.cantidad}x</td>
                      <td className="py-1.5 md:py-2 pr-1 leading-tight">
                        {item.producto_nombre}
                        <div className="text-[8px] md:text-[9px] text-gray-400 font-medium mt-0.5">{item.sku}</div>
                      </td>
                      <td className="py-1.5 md:py-2 align-top text-right">
                        {parseFloat(item.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 md:space-y-1.5 mb-5 md:mb-6">
              <div className="flex justify-between items-center text-gray-500 text-[9px] md:text-[11px] font-bold">
                <span>OP. GRAVADA:</span>
                <span>S/ {(parseFloat(venta.total) / 1.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500 text-[9px] md:text-[11px] font-bold">
                <span>I.G.V. (18%):</span>
                <span>S/ {(parseFloat(venta.total) - (parseFloat(venta.total) / 1.18)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-2 md:p-3 rounded-lg md:rounded-xl mt-1.5 md:mt-2 border border-gray-200">
                <span className="text-[10px] md:text-xs font-black uppercase">Total</span>
                <span className="text-lg md:text-xl font-black">S/ {parseFloat(venta.total).toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center space-y-1 md:space-y-1.5 text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <p className="text-gray-800">¡Gracias por su compra!</p>
              <p>Atendido por: {venta.cajero_nombre || 'Caja'}</p>
              <p className="pt-1.5 md:pt-2 text-[7px] md:text-[8px]">Software por Razentec</p>
            </div>
          </div>
        )}

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          #print-section, #print-section * { visibility: visible; }
          
          #print-section {
            position: absolute;
            top: 0;
            left: 0;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background-color: white !important;
          }

          #print-section.ticket-mode {
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 5mm !important;
          }

          #print-section.a4-mode {
            width: 100% !important;
            padding: 10mm !important;
          }

          * {
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
    </Layout>
  );
};

export default DetalleVenta;