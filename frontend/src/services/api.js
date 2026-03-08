import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Cambia a tu URL de Render cuando lo subas
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✨ INTERCEPTOR MAGISTRAL
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  // Extraemos la sucursal en la que el usuario está trabajando
  const sucursalStr = localStorage.getItem('sucursalActiva');
  if (sucursalStr) {
    try {
      const suc = JSON.parse(sucursalStr);
      // Si no es la vista de "Todas (ALL)", le avisamos al Backend en qué sede estamos
      if (suc && suc.id && suc.id !== 'ALL') {
        config.headers['x-sucursal-id'] = suc.id;
      }
    } catch(e) {}
  }
  
  return config;
});

export default api;