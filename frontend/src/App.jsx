import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Auth/Login'; 
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Perfil from './pages/Perfil';
import DirectorioAdmin from './pages/DirectorioAdmin';
import Productos from './pages/Productos'; 
import Categorias from './pages/Categorias'; 
import Auditoria from './pages/Auditoria'; 
import Proveedores from './pages/Proveedores';
import Compras from './pages/Compras';
import DetalleCompra from './pages/Compras/DetalleCompra';

// MÓDULO DE VENTAS Y POS
import Ventas from './pages/Ventas'; 
import DetalleVenta from './pages/Ventas/DetalleVenta';
import HistorialVentas from './pages/Ventas/HistorialVentas'; // ✨ IMPORTAMOS EL HISTORIAL

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  if (!token) return <Navigate to="/login" />;
  if (usuario.rol !== 'Administrador') return <Navigate to="/dashboard" />;
  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rutas Generales */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        <Route path="/inventario" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
        <Route path="/categorias" element={<ProtectedRoute><Categorias /></ProtectedRoute>} />
        
        {/* ✨ RUTAS DE VENTAS ACTIVADAS */}
        <Route path="/ventas" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
        <Route path="/ventas/:id" element={<ProtectedRoute><DetalleVenta /></ProtectedRoute>} />
        <Route path="/historial-ventas" element={<ProtectedRoute><HistorialVentas /></ProtectedRoute>} />
        
        {/* Rutas Exclusivas del Administrador */}
        <Route path="/usuarios" element={<AdminRoute><Usuarios /></AdminRoute>} />
        <Route path="/directorio" element={<AdminRoute><DirectorioAdmin /></AdminRoute>} />
        <Route path="/logs" element={<AdminRoute><Auditoria /></AdminRoute>} />
        <Route path="/proveedores" element={<AdminRoute><Proveedores /></AdminRoute>} />
        <Route path="/compras" element={<AdminRoute><Compras /></AdminRoute>} />
        <Route path="/compras/:id" element={<AdminRoute><DetalleCompra /></AdminRoute>} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;