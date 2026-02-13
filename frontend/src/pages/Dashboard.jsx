import React from 'react';
import Layout from '../components/Layout';

const Dashboard = () => {
  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Resumen General</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm">Ventas Hoy</h3>
          <p className="text-2xl font-bold text-gray-800">S/ 0.00</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm">Productos</h3>
          <p className="text-2xl font-bold text-gray-800">Checking...</p>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;