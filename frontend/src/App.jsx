import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import Ventas from './pages/Ventas';
import Compras from './pages/Compras';
import Clientes from './pages/Clientes';
import Proveedores from './pages/Proveedores';
import Usuarios from './pages/Usuarios';
import Logs from './pages/Logs';
import Categorias from './pages/Categorias';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        <Route path="/productos" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
        <Route path="/ventas" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
        <Route path="/compras" element={<ProtectedRoute><Compras /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
        <Route path="/proveedores" element={<ProtectedRoute><Proveedores /></ProtectedRoute>} />
        <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
        <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
        <Route path="/categorias" element={<ProtectedRoute><Categorias /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;