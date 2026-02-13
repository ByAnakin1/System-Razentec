import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout'; // Usamos la carcasa
import { Plus, Search } from 'lucide-react';

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar productos al iniciar
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await api.get('/productos');
        setProductos(res.data);
      } catch (error) {
        console.error("Error cargando productos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, []);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventario de Productos</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Código (SKU)</th>
                <th className="px-6 py-3">Precio</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="5" className="text-center p-4">Cargando...</td></tr>
              ) : productos.length === 0 ? (
                <tr><td colSpan="5" className="text-center p-4">No hay productos registrados.</td></tr>
              ) : (
                productos.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{prod.nombre}</td>
                    <td className="px-6 py-4">{prod.codigo || '-'}</td>
                    <td className="px-6 py-4 text-green-600 font-bold">S/ {parseFloat(prod.precio).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Activo</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-blue-600 hover:underline">Editar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Productos;