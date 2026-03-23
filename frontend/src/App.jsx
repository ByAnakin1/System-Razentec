import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import AdminSaaS from './pages/AdminSaaS';
import SuscripcionesSaaS from './pages/SuscripcionesSaaS';
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
import Clientes from './pages/Clientes';
import Configuracion from './pages/Configuracion';  

// MÓDULO DE VENTAS Y SUCURSALES
import Ventas from './pages/Ventas'; 
import DetalleVenta from './pages/Ventas/DetalleVenta';
import HistorialVentas from './pages/Ventas/HistorialVentas';
import Sucursales from './pages/Sucursales';

// ✅ Guardia Único y Central: Verifica si está logueado.
// La seguridad por módulos y sucursales ya la maneja tu Layout y tu Backend.
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* RUTA EXCLUSIVA PARA EL SUPERADMIN */}
        <Route path="/admin-saas" element={<ProtectedRoute><AdminSaaS /></ProtectedRoute>} />
        <Route path="/suscripciones-saas" element={<ProtectedRoute><SuscripcionesSaaS /></ProtectedRoute>} />
        
        {/* Rutas Generales */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        <Route path="/inventario" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
        <Route path="/categorias" element={<ProtectedRoute><Categorias /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
        <Route path="/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />
        
        {/* RUTAS DE VENTAS Y SUCURSALES */}
        <Route path="/ventas" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
        <Route path="/ventas/:id" element={<ProtectedRoute><DetalleVenta /></ProtectedRoute>} />
        <Route path="/historial-ventas" element={<ProtectedRoute><HistorialVentas /></ProtectedRoute>} />
        <Route path="/sucursales" element={<ProtectedRoute><Sucursales /></ProtectedRoute>} /> 
        
        {/* ✨ RUTAS DESBLOQUEADAS: Ahora el empleado puede entrar si el Layout le muestra el botón */}
        <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
        <Route path="/directorio" element={<ProtectedRoute><DirectorioAdmin /></ProtectedRoute>} />
        <Route path="/logs" element={<ProtectedRoute><Auditoria /></ProtectedRoute>} />
        <Route path="/proveedores" element={<ProtectedRoute><Proveedores /></ProtectedRoute>} />
        <Route path="/compras" element={<ProtectedRoute><Compras /></ProtectedRoute>} />
        <Route path="/compras/:id" element={<ProtectedRoute><DetalleCompra /></ProtectedRoute>} />
        
        {/* Ruta salvavidas */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;