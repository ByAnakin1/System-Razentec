import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';

const Clientes = () => {
  const [puedeModificar, setPuedeModificar] = useState(false);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const api = (await import('../services/api')).default;
        const res = await api.get('/auth/me');
        const u = res.data;
        const cat = u.categorias || [];
        setPuedeModificar(u.rol === 'Administrador' || (Array.isArray(cat) && cat.includes('Modificador')));
      } catch {
        setPuedeModificar(false);
      }
    };
    loadMe();
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Clientes</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
        Módulo en desarrollo. {!puedeModificar && 'Solo lectura.'}
      </div>
    </Layout>
  );
};

export default Clientes;
