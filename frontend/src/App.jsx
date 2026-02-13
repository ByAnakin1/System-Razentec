import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos'; // <--- IMPORTAR
import Categorias from './pages/Categorias';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rutas Protegidas */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        
        {/* 👇 NUEVA RUTA DE PRODUCTOS 👇 */}
        <Route path="/productos" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
        <Route path="/categorias" element={<ProtectedRoute><Categorias /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;