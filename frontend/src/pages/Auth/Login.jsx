import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; 
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      
      const { token, usuario } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));

      // Lógica de Redirección según permisos
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
      if (err.response) {
        setError(err.response.data.error || 'Credenciales incorrectas');
      } else {
        setError('Error de conexión con el servidor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      
      {/* ✨ SECCIÓN IZQUIERDA: IMAGEN CORPORATIVA (Oculta en celular, visible en PC) ✨ */}
      <div className="hidden lg:flex lg:w-3/5 bg-slate-900 relative overflow-hidden items-center justify-center">
        {/* Aquí va tu imagen. Asegúrate de que exista en la carpeta public/ */}
        <img 
          src="/login-image.jpg" 
          alt="Fondo Sistema Razentec" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        
        {/* Overlay decorativo y textos */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent"></div>
        <div className="relative z-10 p-12 text-center text-white max-w-2xl animate-fade-in-up">
           <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-600/50 border border-white/20">
             <ShieldCheck size={40} className="text-white"/>
           </div>
           <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Sistema Razentec</h1>
           <p className="text-blue-100 font-medium text-lg leading-relaxed">
             Gestión Inteligente de Ventas, Compras e Inventario. <br/>
             Control total de tu negocio en la palma de tu mano.
           </p>
        </div>
      </div>

      {/* ✨ SECCIÓN DERECHA: FORMULARIO DE LOGIN ✨ */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Decoración de fondo en móvil */}
        <div className="absolute top-0 left-0 w-full h-64 bg-blue-600 rounded-b-[3rem] lg:hidden z-0 shadow-lg"></div>

        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl lg:shadow-none lg:bg-transparent p-8 sm:p-10 z-10 animate-fade-in border border-gray-100 lg:border-none">
          
          <div className="text-center mb-10">
            {/* Logo en versión móvil */}
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex lg:hidden items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-600/30">
              <ShieldCheck size={32} className="text-white"/>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">Bienvenido</h2>
            <p className="text-[11px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Ingresa tus credenciales</p>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 animate-fade-in-down shadow-sm">
              <AlertCircle size={20} className="shrink-0"/>
              <p className="text-xs font-bold leading-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Email */}
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-bold text-gray-800 text-sm"
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="w-full bg-slate-50 border border-slate-200 pl-11 pr-12 py-3.5 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all font-bold text-gray-800 tracking-wider text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {/* Botón Mostrar/Ocultar Contraseña */}
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>

            {/* Botón Submit */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-600/30 active:scale-[0.98] flex items-center justify-center gap-2 mt-8 text-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verificando...
                </>
              ) : (
                <>
                  <LogIn size={20} /> Ingresar al Sistema
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
               Desarrollado por Razentec © 2026
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;