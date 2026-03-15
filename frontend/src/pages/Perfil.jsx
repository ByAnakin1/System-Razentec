import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { User, Mail, ShieldCheck, Eye, Zap, Phone, CreditCard, Camera, Briefcase } from 'lucide-react';

const Perfil = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUserData(res.data);
    } catch (error) { console.error("Error", error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await api.put('/usuarios/me', { avatar: reader.result });
          fetchProfile(); window.location.reload(); 
        } catch (err) { alert('Error al actualizar la foto de perfil'); }
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <Layout title="Mi Perfil" moduleIcon={<User/>}>
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
           <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
           <p className="text-xs font-medium">Cargando perfil...</p>
        </div>
      </Layout>
    );
  }
  
  if (!userData) {
    return (
      <Layout title="Mi Perfil" moduleIcon={<User/>}>
        <div className="text-center py-10 text-xs text-red-500 bg-red-50 rounded-2xl border border-red-100">
          ⚠️ Error al cargar los datos del perfil.
        </div>
      </Layout>
    );
  }

  // 🐛 PROTECCIÓN ANTI-CRASH PARA EL PERFIL PROPIO
  let catsSeguras = [];
  try {
    if (Array.isArray(userData.categorias)) {
      catsSeguras = userData.categorias;
    } else if (typeof userData.categorias === 'string') {
      let parsed = JSON.parse(userData.categorias);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      catsSeguras = Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    catsSeguras = [];
  }

  const permisosVista = catsSeguras.filter(c => c !== 'Modificador' && !c.startsWith('Modificador_'));
  const permisosEdicion = catsSeguras.filter(c => c === 'Modificador' || c.startsWith('Modificador_')).map(c => c.replace('Modificador_', '').replace('Modificador', 'Acceso Global'));

  return (
    <Layout title="Mi Perfil" moduleIcon={<User/>}>
      <div className="max-w-5xl mx-auto">
        
        {/* Título (Visible solo en PC, en móvil lo maneja el Layout) */}
        <h1 className="hidden md:flex text-2xl font-extrabold text-gray-800 mb-6 items-center gap-2">
          <User className="text-blue-600" /> Mi Perfil
        </h1>

        <div className="bg-white rounded-[2rem] md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* ✨ HEADER HERO (Responsive) ✨ */}
          <div className="bg-slate-900 px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>

            <div className="relative group cursor-pointer z-10 shrink-0">
              <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleImageUpload} title="Cambiar foto de perfil" />
              <div className="h-24 w-24 md:h-32 md:w-32 bg-blue-600 rounded-full border-4 border-slate-800 shadow-xl flex items-center justify-center text-white text-4xl md:text-5xl font-black overflow-hidden relative transition-transform group-hover:scale-105">
                {userData.avatar ? <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" /> : userData.nombre?.charAt(0)?.toUpperCase()}
                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white drop-shadow-md md:w-8 md:h-8" />
                </div>
              </div>
            </div>
            
            <div className="text-center md:text-left text-white z-10 flex-1 min-w-0">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight line-clamp-2">{userData.nombre}</h2>
              <div className="mt-3 md:mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3">
                {userData.area_cargo && (
                  <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold tracking-wide flex items-center gap-1 md:gap-1.5">
                    <Briefcase size={14} className="md:w-4 md:h-4"/> <span className="truncate max-w-[150px] md:max-w-none">{userData.area_cargo}</span>
                  </span>
                )}
                <span className="bg-blue-500/20 border border-blue-400/30 text-blue-200 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[10px] md:text-sm font-bold tracking-wide uppercase md:normal-case">
                  <span className="hidden md:inline">Rol: </span>{userData.rol}
                </span>
              </div>
            </div>
          </div>

          {/* ✨ CONTENIDO DEL PERFIL (Columnas apilables) ✨ */}
          <div className="p-5 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 bg-slate-50/30">
            
            {/* Columna Izquierda: Info Personal */}
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-sm md:text-lg font-extrabold text-gray-800 border-b border-gray-100 pb-2 md:pb-3 flex items-center gap-2"><User size={18} className="text-gray-400 md:w-5 md:h-5"/> Información Personal</h3>
              
              <div>
                <label className="text-[10px] md:text-[11px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1 md:gap-1.5 mb-1.5"><CreditCard size={12} className="md:w-3.5 md:h-3.5"/> Documento (DNI)</label>
                <div className="bg-white p-3 md:p-3.5 rounded-xl border border-gray-100 text-gray-700 font-bold shadow-sm text-sm">{userData.dni || 'No registrado'}</div>
              </div>
              
              <div>
                <label className="text-[10px] md:text-[11px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1 md:gap-1.5 mb-1.5"><Phone size={12} className="md:w-3.5 md:h-3.5"/> Teléfono</label>
                <div className="bg-white p-3 md:p-3.5 rounded-xl border border-gray-100 text-gray-700 font-bold shadow-sm text-sm">{userData.telefono || 'No registrado'}</div>
              </div>
              
              <div>
                <label className="text-[10px] md:text-[11px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1 md:gap-1.5 mb-1.5"><Mail size={12} className="md:w-3.5 md:h-3.5"/> Correo Personal</label>
                <div className="bg-white p-3 md:p-3.5 rounded-xl border border-gray-100 text-gray-700 font-bold shadow-sm text-sm truncate">{userData.correo_personal || 'No registrado'}</div>
              </div>
            </div>

            {/* Columna Derecha: Accesos */}
            <div className="space-y-4 md:space-y-6">
              <h3 className="text-sm md:text-lg font-extrabold text-gray-800 border-b border-gray-100 pb-2 md:pb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-gray-400 md:w-5 md:h-5"/> Accesos Corporativos</h3>
              
              <div>
                <label className="text-[10px] md:text-[11px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1 md:gap-1.5 mb-1.5"><Mail size={12} className="md:w-3.5 md:h-3.5"/> Correo Login (Sistema)</label>
                <div className="bg-blue-50 p-3 md:p-3.5 rounded-xl border border-blue-100 text-blue-800 font-bold shadow-sm text-sm truncate">{userData.email}</div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm">
                <p className="text-[10px] md:text-xs text-gray-500 font-extrabold uppercase tracking-widest mb-2 md:mb-3 flex items-center gap-1 md:gap-1.5"><Eye size={14} className="text-blue-500 md:w-4 md:h-4"/> Módulos de Visualización</p>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {permisosVista.length > 0 ? permisosVista.map(mod => <span key={mod} className="bg-blue-50 text-blue-700 border border-blue-200 px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold">{mod}</span>) : <span className="text-[10px] md:text-xs text-gray-400 italic font-medium">No tiene accesos.</span>}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm">
                <p className="text-[10px] md:text-xs text-gray-500 font-extrabold uppercase tracking-widest mb-2 md:mb-3 flex items-center gap-1 md:gap-1.5"><Zap size={14} className="text-yellow-500 md:w-4 md:h-4"/> Módulos Editables</p>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {permisosEdicion.length > 0 ? permisosEdicion.map(mod => <span key={mod} className="bg-yellow-50 text-yellow-700 border border-yellow-300 px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold">{mod}</span>) : <span className="text-[10px] md:text-xs text-gray-400 italic font-medium">Solo lectura.</span>}
                </div>
              </div>
              
              <p className="text-[9px] md:text-[11px] text-gray-400 mt-4 text-center bg-gray-50 p-2 md:p-3 rounded-lg font-medium border border-gray-100">* Para modificar tus datos o accesos, comunícate con el Administrador principal.</p>
            </div>
            
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Perfil;