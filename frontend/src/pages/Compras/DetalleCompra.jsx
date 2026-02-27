import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api'; // Ajusta la ruta a tu api.js
import Layout from '../../components/Layout'; // Ajusta la ruta a tu Layout
import { ArrowLeft, Printer, FileText, User, Calendar, CheckCircle } from 'lucide-react';

const DetalleCompra = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ compra: null, detalles: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetalle = async () => {
      try {
        const res = await api.get(`/compras/${id}`);
        setData(res.data);
      } catch (err) {
        setError('No se pudo cargar la información de la compra.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetalle();
  }, [id]);

  if (loading) return <Layout><div className="p-8 text-center text-gray-500 font-bold animate-pulse">Cargando detalles de compra...</div></Layout>;
  if (error) return <Layout><div className="p-8 text-center text-red-500 font-bold">{error}</div></Layout>;
  if (!data.compra) return <Layout><div className="p-8 text-center text-gray-500 font-bold">Compra no encontrada.</div></Layout>;

  const { compra, detalles } = data;

  return (
    <Layout>
      {/* CABECERA */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/compras')} className="p-2 bg-white border rounded-xl hover:bg-gray-50">
            <ArrowLeft className="text-gray-600" size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="text-blue-600" size={28}/> Detalle de Ingreso / Compra
            </h1>
            <p className="text-sm text-gray-500 font-medium">Registro N° {compra.id}</p>
          </div>
        </div>
        <button onClick={() => window.print()} className="bg-white border-2 border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50">
          <Printer size={20} /> Imprimir
        </button>
      </div>

      {/* ZONA DE IMPRESIÓN */}
      <div className="bg-white rounded-2xl shadow-sm border p-8 print:shadow-none print:border-none print:p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase mb-4 flex items-center gap-2"><User size={16}/> Proveedor</h3>
            <p className="text-lg font-bold text-gray-800">{compra.proveedor_nombre || 'Sin Proveedor'}</p>
            {compra.proveedor_ruc && <p className="text-sm text-gray-600">RUC: {compra.proveedor_ruc}</p>}
          </div>

          <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 relative">
            <h3 className="text-xs font-black text-gray-400 uppercase mb-4 flex items-center gap-2"><Calendar size={16}/> Datos del Comprobante</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Comprobante</p>
                <p className="text-sm font-bold text-gray-800">{compra.comprobante}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Fecha</p>
                <p className="text-sm font-bold text-gray-800">{new Date(compra.created_at).toLocaleString('es-PE')}</p>
              </div>
            </div>
            <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black uppercase">
              <CheckCircle size={14} className="inline mr-1"/> {compra.estado}
            </div>
          </div>
        </div>

        {/* TABLA DE PRODUCTOS */}
        <div className="border rounded-xl overflow-hidden mb-8">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="px-4 py-3 font-bold">Código</th>
                <th className="px-4 py-3 font-bold">Producto</th>
                <th className="px-4 py-3 font-bold text-center">Cant.</th>
                <th className="px-4 py-3 font-bold text-right">Costo Unit.</th>
                <th className="px-4 py-3 font-bold text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {detalles.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{item.producto_codigo || 'S/C'}</td>
                  <td className="px-4 py-3 font-bold text-gray-800">{item.producto_nombre}</td>
                  <td className="px-4 py-3 text-center font-bold text-blue-600">{item.cantidad}</td>
                  <td className="px-4 py-3 text-right">S/ {parseFloat(item.precio_unitario).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-black">S/ {parseFloat(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTAL */}
        <div className="flex justify-end">
          <div className="bg-gray-50 p-6 rounded-xl border w-full md:w-80 flex justify-between items-center">
            <span className="text-gray-500 font-black uppercase text-sm">Total</span>
            <span className="text-3xl font-black text-emerald-600">S/ {parseFloat(compra.total).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DetalleCompra;