import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; // Importamos el puente que acabamos de crear

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Para mostrar errores rojos
  const navigate = useNavigate(); // Para redirigir al Dashboard

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 1. Llamamos al Backend
      const response = await api.post('/auth/login', { email, password });
      
      // 2. Si todo sale bien, guardamos el token
      const { token, usuario } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));

      // 3. Redirigir: Admin → Dashboard; vendedor (solo Ventas) → Ventas; resto → primer módulo
      const cat = (usuario.categorias || []).filter(c => c !== 'Modificador');
      const destino = usuario.rol === 'Administrador' ? '/dashboard'
        : cat.includes('Inventario') ? '/productos'
        : cat.includes('Ventas') ? '/ventas'
        : cat.includes('Compras') ? '/compras'
        : cat.includes('Clientes') ? '/clientes'
        : cat.includes('Proveedores') ? '/proveedores'
        : cat.includes('Usuarios') ? '/usuarios'
        : '/dashboard';
      navigate(destino);
      
    } catch (err) {
      // 4. Si falla, mostramos el error
      if (err.response) {
        setError(err.response.data.error || 'Error al iniciar sesión');
      } else {
        setError('Error de conexión con el servidor');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Sistema Razentec</h1>
          <p className="text-gray-500 mt-2">Bienvenido de nuevo</p>
        </div>

        {/* Mensaje de Error (Solo aparece si falla) */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="admin@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;