import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Store, User, CalendarDays, ReceiptText, CheckCircle, FileText, Building2, Ticket, MapPin } from 'lucide-react';
import api from '../../services/api';
import Layout from '../../components/Layout';

const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

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
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-blue-300/70 transition-colors">
           <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-xs font-black tracking-widest uppercase animate-pulse">Generando Documento...</p>
        </div>
      </Layout>
    );
  }

  if (error || !venta) {
    return (
      <Layout title="Comprobante" moduleIcon={<FileText/>}>
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
          <div className="bg-red-50/80 dark:bg-red-900/30 backdrop-blur-md text-red-500 dark:text-red-400 p-6 rounded-full mb-6 border-4 border-white dark:border-red-500/20 shadow-sm transition-colors"><ReceiptText size={48}/></div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mb-2 transition-colors">Comprobante no encontrado</h2>
          <p className="text-slate-500 dark:text-blue-200/70 text-sm font-bold mb-8 leading-relaxed transition-colors">{error}</p>
          <button onClick={() => navigate('/ventas')} className="bg-blue-600/90 dark:bg-blue-600 backdrop-blur-md text-white font-black px-8 py-3.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 w-full border border-transparent dark:border-white/10">
            Regresar al Historial
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Comprobante" moduleIcon={<FileText/>}>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 print:hidden px-1">
        <div>
          <p className="text-[10px] md:text-xs text-gray-500 dark:text-blue-300/70 font-extrabold uppercase tracking-widest mb-1 transition-colors">
            Registro N° {venta.id}
          </p>
          <button onClick={() => navigate('/ventas')} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-black text-xs md:text-sm flex items-center gap-1.5 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Volver al Historial
          </button>
        </div>
        
        <button onClick={handlePrint} className="w-full sm:w-auto bg-slate-800/90 dark:bg-blue-600 backdrop-blur-md hover:bg-slate-900 dark:hover:bg-blue-700 text-white font-black px-5 py-3 rounded-xl shadow-lg shadow-slate-800/20 dark:shadow-blue-900/40 border border-transparent dark:border-white/10 flex items-center justify-center gap-2 transition-all active:scale-95 text-xs md:text-sm">
          <Printer size={16}/> Imprimir Documento
        </button>
      </div>

      <div className="flex bg-white/60 dark:bg-blue-950/30 backdrop-blur-xl p-1 rounded-xl border border-gray-200/50 dark:border-white/5 shadow-sm w-full md:w-fit mb-4 md:mb-6 print:hidden mx-auto sm:mx-0 transition-colors duration-300">
        <button 
          onClick={() => setVistaActiva('empresa')} 
          className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg font-extrabold text-[10px] md:text-xs uppercase tracking-wider transition-all ${vistaActiva === 'empresa' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/50'}`}
        >
          <Building2 size={14}/> Formato A4
        </button>
        <button 
          onClick={() => setVistaActiva('cliente')} 
          className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg font-extrabold text-[10px] md:text-xs uppercase tracking-wider transition-all ${vistaActiva === 'cliente' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-gray-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/50'}`}
        >
          <Ticket size={14}/> Ticket POS
        </button>
      </div>

      {/* ✨ ÁREA DE IMPRESIÓN (Liquid Glass Visual, pero forzando impresión limpia en B/N mediante CSS) ✨ */}
      <div id="print-section" className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/80 dark:border-white/10 transition-colors duration-300 ${vistaActiva === 'cliente' ? 'ticket-mode max-w-[380px] mx-auto p-5 md:p-8 rounded-2xl md:rounded-3xl' : 'a4-mode p-4 md:p-10 w-full rounded-2xl md:rounded-[2rem]'}`}>
        
        {/* =========================================
            FORMATO EMPRESA (A4)
            ========================================= */}
        {vistaActiva === 'empresa' && (
          <div className="animate-fade-in">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 md:mb-8 pb-4 md:pb-6 border-b border-gray-100/50 dark:border-white/5 gap-4 md:gap-6 transition-colors">
              <div>
                <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                   <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg md:rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-colors print:bg-black print:text-white">
                      <Store size={16} className="md:w-5 md:h-5"/>
                   </div>
                   <h2 className="text-lg md:text-3xl font-black text-gray-800 dark:text-white uppercase tracking-tight transition-colors">Razentec</h2>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 dark:text-blue-200/70 bg-gray-50/80 dark:bg-slate-800/50 backdrop-blur-md px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg border border-gray-200/50 dark:border-white/5 w-fit transition-colors print:border-black print:bg-white print:text-black">
                  <MapPin size={12} className="text-blue-600 dark:text-blue-400 md:w-3.5 md:h-3.5 print:text-black"/>
                  <span className="font-extrabold text-[9px] md:text-[11px] uppercase tracking-widest">Sede: {venta.sucursal_nombre || 'No asignada'}</span>
                </div>
              </div>

              <div className="md:text-right flex flex-col md:items-end w-full md:w-auto">
                <div className="bg-emerald-50/80 dark:bg-emerald-900/30 backdrop-blur-md text-emerald-600 dark:text-emerald-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2.5 md:px-3 py-1 md:py-1.5 rounded-full flex items-center gap-1.5 mb-2 w-fit border border-emerald-100/50 dark:border-emerald-500/20 shadow-sm md:ml-auto transition-colors print:border-black print:bg-white print:text-black">
                  <CheckCircle size={12} className="md:w-3.5 md:h-3.5"/> PAGADO
                </div>
                <p className="text-base md:text-xl font-black text-gray-800 dark:text-white font-mono transition-colors">BOL-{String(venta.id).padStart(5, '0')}</p>
                <p className="text-[9px] md:text-[10px] font-bold text-gray-400 dark:text-blue-300/70 uppercase tracking-widest mt-0.5 flex items-center gap-1 md:gap-1.5 md:justify-end transition-colors print:text-black">
                  <CalendarDays size={10} className="md:w-3 md:h-3"/> {formatearFecha(venta.created_at)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-5 md:mb-8">
              <div className="p-3 md:p-5 border border-gray-100/50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-md rounded-xl md:rounded-2xl transition-colors print:border-black print:bg-white">
                <h3 className="text-[8px] md:text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 mb-2 md:mb-3 bg-blue-50/80 dark:bg-blue-900/30 w-fit px-2 py-0.5 md:py-1 rounded border border-blue-100/50 dark:border-blue-500/20 transition-colors print:border-black print:bg-white print:text-black"><User size={10} className="md:w-3 md:h-3"/> Cliente</h3>
                <p className="text-xs md:text-lg font-black text-gray-800 dark:text-white transition-colors print:text-black">{venta.cliente_nombre || 'Público General'}</p>
                <p className="text-[10px] md:text-xs text-gray-500 dark:text-blue-200/70 font-bold mt-0.5 md:mt-1 transition-colors print:text-black">Doc: {venta.documento_identidad || 'S/C'}</p>
              </div>

              <div className="p-3 md:p-5 border border-gray-100/50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-md rounded-xl md:rounded-2xl transition-colors print:border-black print:bg-white">
                <h3 className="text-[8px] md:text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 mb-2 md:mb-3 bg-blue-50/80 dark:bg-blue-900/30 w-fit px-2 py-0.5 md:py-1 rounded border border-blue-100/50 dark:border-blue-500/20 transition-colors print:border-black print:bg-white print:text-black"><FileText size={10} className="md:w-3 md:h-3"/> Detalles de Pago</h3>
                <p className="text-[9px] md:text-[11px] text-gray-500 dark:text-blue-200/70 font-bold mb-1 transition-colors print:text-black">Cajero: <span className="text-gray-800 dark:text-white font-black ml-1 transition-colors print:text-black">{venta.cajero_nombre || 'Usuario Sistema'}</span></p>
                {venta.metodo_pago && (
                  <p className="text-[9px] md:text-[11px] text-gray-500 dark:text-blue-200/70 font-bold transition-colors print:text-black">Método: <span className="text-gray-800 dark:text-white font-black uppercase ml-1 transition-colors print:text-black">{venta.metodo_pago.replace('_', ' ')}</span></p>
                )}
              </div>
            </div>

            <div className={`overflow-x-auto mb-6 md:mb-8 border border-gray-200/50 dark:border-white/5 rounded-xl md:rounded-2xl shadow-sm transition-colors ${hideScrollbar} print:border-black`}>
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50/80 dark:bg-slate-800/50 border-b border-gray-200/50 dark:border-white/5 text-gray-600 dark:text-slate-300 transition-colors print:bg-white print:text-black print:border-black">
                  <tr>
                    <th className="py-2.5 px-4 md:py-4 md:px-5 font-black uppercase text-[8px] md:text-[10px] tracking-widest">Código</th>
                    <th className="py-2.5 px-4 md:py-4 md:px-5 font-black uppercase text-[8px] md:text-[10px] tracking-widest">Descripción</th>
                    <th className="py-2.5 px-4 md:py-4 md:px-5 font-black uppercase text-[8px] md:text-[10px] tracking-widest text-center">Cant.</th>
                    <th className="py-2.5 px-4 md:py-4 md:px-5 font-black uppercase text-[8px] md:text-[10px] tracking-widest text-center">Precio U.</th>
                    <th className="py-2.5 px-4 md:py-4 md:px-5 font-black uppercase text-[8px] md:text-[10px] tracking-widest text-right bg-gray-100/30 dark:bg-slate-900/30 print:bg-white">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/50 dark:divide-white/5 text-gray-700 dark:text-slate-200 transition-colors print:text-black print:divide-black">
                  {venta.detalles?.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 md:py-3.5 md:px-5 text-gray-400 dark:text-blue-300/70 font-black text-[9px] md:text-[11px] uppercase tracking-wider print:text-black">{item.sku || 'S/C'}</td>
                      <td className="py-3 px-4 md:py-3.5 md:px-5 font-bold text-[10px] md:text-sm">{item.producto_nombre}</td>
                      <td className="py-3 px-4 md:py-3.5 md:px-5 font-black text-blue-600 dark:text-blue-400 text-center bg-blue-50/30 dark:bg-blue-900/10 text-[10px] md:text-sm print:bg-white print:text-black">{item.cantidad}</td>
                      <td className="py-3 px-4 md:py-3.5 md:px-5 font-medium text-center text-[10px] md:text-xs">S/ {parseFloat(item.precio_unitario).toFixed(2)}</td>
                      <td className="py-3 px-4 md:py-3.5 md:px-5 font-black text-gray-900 dark:text-white text-right bg-gray-50/30 dark:bg-slate-800/20 text-[10px] md:text-sm print:bg-white print:text-black">S/ {parseFloat(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-full sm:w-80 space-y-2 md:space-y-2.5 bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-md p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200/50 dark:border-white/5 transition-colors print:bg-white print:border-black">
                <div className="flex justify-between text-gray-500 dark:text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-widest print:text-black">
                  <span>Subtotal Gravado:</span>
                  <span>S/ {(parseFloat(venta.total) / 1.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-slate-400 font-bold text-[10px] md:text-[11px] uppercase tracking-widest border-b border-gray-200/50 dark:border-slate-700 pb-3 md:pb-4 mb-3 md:mb-4 transition-colors print:text-black print:border-black">
                  <span>IGV (18%):</span>
                  <span>S/ {(parseFloat(venta.total) - (parseFloat(venta.total) / 1.18)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-end text-gray-900 dark:text-white transition-colors print:text-black">
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Importe Total</span>
                  <span className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400 leading-none print:text-black">S/ {parseFloat(venta.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 md:mt-12 text-center text-[8px] md:text-[9px] text-gray-400 dark:text-slate-500 font-black uppercase tracking-widest pt-4 md:pt-6 border-t border-dashed border-gray-200/80 dark:border-slate-700 transition-colors print:text-black print:border-black">
              Gracias por su preferencia • Documento generado por Razentec SaaS
            </div>
          </div>
        )}

        {/* =========================================
            FORMATO TICKET (POS Térmica)
            ========================================= */}
        {vistaActiva === 'cliente' && (
          <div className="animate-fade-in text-gray-800 dark:text-slate-200 transition-colors print:text-black print:bg-white">
            <div className="text-center border-b-2 border-dashed border-gray-300/80 dark:border-slate-700 pb-4 md:pb-5 mb-4 md:mb-5 transition-colors print:border-black">
              <div className="mx-auto w-12 h-12 md:w-14 md:h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl md:rounded-2xl flex items-center justify-center mb-3 md:mb-4 shadow-sm transition-colors print:bg-black print:text-white">
                 <Store size={24} className="md:w-7 md:h-7"/>
              </div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none mb-1.5 dark:text-white print:text-black">Razentec</h2>
              <p className="text-[9px] md:text-[10px] text-gray-500 dark:text-slate-400 font-extrabold uppercase tracking-widest transition-colors print:text-black">{venta.sucursal_nombre || 'Sede Principal'}</p>
            </div>

            <div className="space-y-2 md:space-y-2.5 text-[10px] md:text-[11px] font-bold text-gray-600 dark:text-slate-300 mb-4 md:mb-5 border-b-2 border-dashed border-gray-300/80 dark:border-slate-700 pb-4 md:pb-5 transition-colors print:text-black print:border-black">
              <div className="flex justify-between items-center">
                <span>N° Boleta:</span>
                <span className="font-mono font-black text-gray-900 dark:text-white print:text-black">B-{String(venta.id).padStart(5, '0')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Fecha:</span>
                <span className="font-bold">{formatearFecha(venta.created_at)}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t border-gray-100/50 dark:border-white/5 transition-colors print:border-black">
                <span>Cliente:</span>
                <span className="font-black text-gray-900 dark:text-white text-right truncate max-w-[150px] print:text-black">{venta.cliente_nombre || 'Público General'}</span>
              </div>
              {venta.documento_identidad && (
                <div className="flex justify-between items-center">
                  <span>Doc:</span>
                  <span className="font-bold">{venta.documento_identidad}</span>
                </div>
              )}
            </div>

            <div className="mb-4 md:mb-5 border-b-2 border-dashed border-gray-300/80 dark:border-slate-700 pb-3 transition-colors print:border-black">
              <table className="w-full text-[10px] md:text-xs">
                <thead className="text-gray-400 dark:text-slate-500 border-b border-gray-200/50 dark:border-white/5 transition-colors print:text-black print:border-black">
                  <tr>
                    <th className="text-left pb-1.5 font-black uppercase text-[8px] md:text-[9px] w-6 md:w-8 tracking-widest">Cant</th>
                    <th className="text-left pb-1.5 font-black uppercase text-[8px] md:text-[9px] tracking-widest">Desc</th>
                    <th className="text-right pb-1.5 font-black uppercase text-[8px] md:text-[9px] tracking-widest">Imp</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 dark:text-slate-200 font-bold transition-colors print:text-black">
                  {venta.detalles?.map((item, index) => (
                    <tr key={index}>
                      <td className="py-2 align-top text-gray-500 dark:text-slate-400 font-black print:text-black">{item.cantidad}x</td>
                      <td className="py-2 pr-1 leading-tight font-extrabold dark:text-white print:text-black">
                        {item.producto_nombre}
                        <div className="text-[8px] md:text-[9px] text-gray-400 dark:text-slate-500 font-bold mt-0.5 tracking-widest uppercase print:text-black">{item.sku}</div>
                      </td>
                      <td className="py-2 align-top text-right font-black dark:text-white print:text-black">
                        {parseFloat(item.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1.5 md:space-y-2 mb-5 md:mb-6">
              <div className="flex justify-between items-center text-gray-500 dark:text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-colors print:text-black">
                <span>Op. Gravada:</span>
                <span>S/ {(parseFloat(venta.total) / 1.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-500 dark:text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-colors print:text-black">
                <span>I.G.V. (18%):</span>
                <span>S/ {(parseFloat(venta.total) - (parseFloat(venta.total) / 1.18)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 p-2.5 md:p-3 rounded-xl mt-2 border border-gray-200/50 dark:border-white/5 transition-colors print:bg-white print:border-black">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest dark:text-white print:text-black">Total</span>
                <span className="text-xl md:text-2xl font-black dark:text-white print:text-black">S/ {parseFloat(venta.total).toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center space-y-1 md:space-y-1.5 text-[8px] md:text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest transition-colors print:text-black">
              <p className="text-gray-800 dark:text-slate-300 font-black print:text-black">¡Gracias por su compra!</p>
              <p>Atendido por: {venta.cajero_nombre || 'Caja'}</p>
              <p className="pt-2 md:pt-3 text-[7px] md:text-[8px]">Software por Razentec SaaS</p>
            </div>
          </div>
        )}

      </div>
      
      {/* CSS para forzar impresión en blanco y negro, sin importar si estamos en Modo Oscuro en la pantalla */}
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
            color: black !important;
          }
          
          #print-section * {
            color: black !important;
            border-color: black !important;
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