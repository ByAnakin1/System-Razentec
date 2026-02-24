import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Auth/Login'; 
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Ventas from './pages/Ventas/index.jsx';
import HistorialVentas from './pages/Ventas/HistorialVentas';
import DetalleVenta from './pages/Ventas/DetalleVenta';
import Perfil from './pages/Perfil';
import DirectorioAdmin from './pages/DirectorioAdmin';
import Productos from './pages/Productos'; // Inventario
import Categorias from './pages/Categorias'; 

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rutas Protegidas */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        <Route path="/directorio" element={<ProtectedRoute><DirectorioAdmin /></ProtectedRoute>} />
        <Route path="/ventas" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
        <Route path="/ventas/:id/detalle" element={<ProtectedRoute><DetalleVenta /></ProtectedRoute>} />
        <Route path="/historial-ventas" element={<ProtectedRoute><HistorialVentas /></ProtectedRoute>} />
        <Route path="/inventario" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
        <Route path="/categorias" element={<ProtectedRoute><Categorias /></ProtectedRoute>} />
        
        {/* 🐛 PROTECCIÓN ANTI-CRASH: Si la URL no existe, te manda al inicio en vez de quedarse en blanco */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;