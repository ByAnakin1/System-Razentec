import axios from 'axios';

// Creamos la conexión base
const api = axios.create({
  baseURL: 'https://system-razentec.onrender.com/api', // La dirección de tu Backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Antes de cada petición, inyectamos el Token si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;