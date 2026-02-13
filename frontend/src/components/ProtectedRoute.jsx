import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Verificamos si existe la llave en el bolsillo del navegador
  const token = localStorage.getItem('token');

  if (!token) {
    // 🚨 ¡ALTO AHÍ! No tienes pase. Te vas al Login.
    return <Navigate to="/login" replace />;
  }

  // ✅ Pase usted, caballero.
  return children;
};

export default ProtectedRoute;