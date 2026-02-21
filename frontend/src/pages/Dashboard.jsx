import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const Dashboard = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, pRes] = await Promise.all([
          api.get('/usuarios').catch(() => ({ data: [] })),
          api.get('/productos?estado=activos').catch(() => ({ data: [] }))
        ]);
        setUsuarios(uRes.data || []);
        setProductos(pRes.data || []);
      } catch {
        setUsuarios([]);
        setProductos([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Resumen General</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm">Ventas Hoy</h3>
          <p className="text-2xl font-bold text-gray-800">S/ 0.00</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm">Productos activos</h3>
          <p className="text-2xl font-bold text-gray-800">{loading ? '...' : productos.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm">Usuarios</h3>
          <p className="text-2xl font-bold text-gray-800">{loading ? '...' : usuarios.length}</p>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;