import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; 
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, ShieldCheck, Zap, Server } from 'lucide-react';

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
      const destino = usuario.rol === 'SuperAdmin' ? '/admin-saas'
        : usuario.rol === 'Administrador' ? '/dashboard'
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
    <div className="flex min-h-screen bg-slate-50 relative overflow-hidden font-sans">
      
      {/* 🔴 SECCIÓN IZQUIERDA: HERO / BRANDING (Oculto en móvil) 🔴 */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-12 overflow-hidden bg-slate-900">
        
        {/* Imagen de fondo con Overlay Oscuro */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/login-image.jpg" 
            alt="Fondo Sistema Razentec" 
            className="w-full h-full object-cover opacity-30 mix-blend-luminosity scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/80 to-transparent"></div>
        </div>

        {/* Elementos Decorativos Flotantes (Blur) */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px] pointer-events-none z-0"></div>
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none z-0"></div>

        {/* Contenido Hero */}
        <div className="relative z-10 w-full max-w-lg text-white animate-fade-in-up">
           
           <div className="flex items-center gap-3 mb-10">
             <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/10">
               <ShieldCheck size={28} className="text-white"/>
             </div>
             <span className="text-2xl font-black tracking-tight flex items-center gap-1">Razentec <span className="text-blue-400 font-bold text-base bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">SaaS</span></span>
           </div>

           <h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-[1.1] mb-6">
             Control Total <br/> 
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">para tu Negocio.</span>
           </h1>
           
           <p className="text-slate-300 font-medium text-lg leading-relaxed mb-10 max-w-md">
             La plataforma integral de Ventas, Compras e Inventario diseñada para escalar las operaciones de tu empresa.
           </p>

           <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm flex items-center gap-3">
               <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0"><Zap size={20}/></div>
               <p className="text-xs font-bold text-slate-200">Sincronización<br/><span className="text-slate-400 font-medium">en Tiempo Real</span></p>
             </div>
             <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm flex items-center gap-3">
               <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center shrink-0"><Server size={20}/></div>
               <p className="text-xs font-bold text-slate-200">Multi-Sucursal<br/><span className="text-slate-400 font-medium">Arquitectura Cloud</span></p>
             </div>
           </div>
        </div>
      </div>

      {/* 🔴 SECCIÓN DERECHA: FORMULARIO LOGIN (Ocupa 100% en móvil) 🔴 */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24 relative bg-slate-50 overflow-y-auto">
        
        {/* Decoración Exclusiva para Móvil */}
        <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-blue-600 to-blue-800 lg:hidden z-0 rounded-b-[4rem] shadow-xl"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl lg:hidden z-0"></div>

        <div className="w-full max-w-sm mx-auto relative z-10 animate-fade-in">
          
          {/* Logo Móvil */}
          <div className="lg:hidden flex flex-col items-center mb-8 text-white">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-lg shadow-black/10 mb-4 border border-white/20">
              <ShieldCheck size={36} className="text-blue-600"/>
            </div>
            <h1 className="text-2xl font-black tracking-wide">Razentec SaaS</h1>
          </div>

          {/* Caja del Formulario (Glassmorphism sutil) */}
          <div className="bg-white/80 lg:bg-white backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 lg:border-gray-100">
            
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Iniciar Sesión</h2>
              <p className="text-sm font-medium text-slate-500 mt-2">Ingresa tus credenciales para continuar.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50/80 border border-red-100 text-red-600 rounded-2xl flex items-start gap-3 animate-fade-in-down shadow-sm">
                <AlertCircle size={20} className="shrink-0 mt-0.5"/>
                <p className="text-[13px] font-bold leading-snug">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="group">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 group-focus-within:text-blue-600 transition-colors">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={18} strokeWidth={2.5} />
                  </div>
                  <input 
                    type="email" 
                    className="w-full bg-slate-50/50 border border-slate-200 pl-12 pr-4 py-3.5 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-800 text-[13px] placeholder:text-slate-400 placeholder:font-medium shadow-sm"
                    placeholder="usuario@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="group">
                <div className="flex justify-between items-end mb-1.5 px-1">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest group-focus-within:text-blue-600 transition-colors">Contraseña</label>
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock size={18} strokeWidth={2.5} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="w-full bg-slate-50/50 border border-slate-200 pl-12 pr-12 py-3.5 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-800 tracking-wider text-[13px] placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-medium shadow-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 focus:text-blue-600 transition-colors outline-none"
                  >
                    {showPassword ? <EyeOff size={18} strokeWidth={2.5}/> : <Eye size={18} strokeWidth={2.5}/>}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-blue-600 disabled:bg-slate-300 disabled:text-slate-500 text-white font-extrabold py-4 rounded-xl transition-all duration-300 shadow-xl shadow-slate-900/20 hover:shadow-blue-600/30 active:scale-[0.98] flex items-center justify-center gap-2 mt-8 text-sm"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verificando...
                  </>
                ) : (
                  <>
                    Ingresar <LogIn size={18} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center lg:mt-10">
             <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
               <ShieldCheck size={14}/> Plataforma Segura • Razentec © 2026
             </p>
          </div>
          
        </div>
      </div>

    </div>
  );
};

export default Login;