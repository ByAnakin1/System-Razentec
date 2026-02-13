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

      // 3. Redirigimos al Dashboard
      navigate('/dashboard');
      
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
    <div className="flex min-h-screen">
      {/* Imagen que ocupa 5/7 del ancho */}
      <div className="h-screen shrink-0" style={{ width: '65%' }}>
        <img 
          src="/login-image.jpg" 
          alt="Sistema Razentec" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Contenedor del login que ocupa 2/7 del ancho */}
      <div className="flex flex-1 items-center justify-center bg-gray-50 p-8 min-w-0">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
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
    </div>
  );
};

export default Login;