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

  if (loading) return <Layout><div className="flex justify-center items-center h-full text-gray-500 font-medium">Cargando perfil...</div></Layout>;
  if (!userData) return <Layout><div className="text-center text-red-500 mt-10">Error al cargar datos.</div></Layout>;

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
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <User className="text-blue-600" /> Mi Perfil
        </h1>

        <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
          
          <div className="bg-slate-900 px-10 py-10 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

            <div className="relative group cursor-pointer z-10">
              <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleImageUpload} title="Cambiar foto de perfil" />
              <div className="h-32 w-32 bg-blue-600 rounded-full border-4 border-slate-800 shadow-xl flex items-center justify-center text-white text-5xl font-bold overflow-hidden relative transition-transform group-hover:scale-105">
                {userData.avatar ? <img src={userData.avatar} alt="Avatar" className="w-full h-full object-cover" /> : userData.nombre?.charAt(0)?.toUpperCase()}
                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={32} className="text-white drop-shadow-md" />
                </div>
              </div>
            </div>
            
            <div className="text-center md:text-left text-white z-10">
              <h2 className="text-3xl font-extrabold tracking-tight">{userData.nombre}</h2>
              <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-3">
                {userData.area_cargo && (
                  <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide flex items-center gap-1.5">
                    <Briefcase size={16}/> {userData.area_cargo}
                  </span>
                )}
                <span className="bg-blue-500/20 border border-blue-400/30 text-blue-200 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide">
                  Rol: {userData.rol}
                </span>
              </div>
            </div>
          </div>

          <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-lg font-extrabold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2"><User size={20} className="text-gray-400"/> Información Personal</h3>
              <div><label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><CreditCard size={14}/> Documento de Identidad (DNI)</label><div className="bg-slate-50 p-3.5 rounded-xl border border-gray-100 text-gray-700 font-medium shadow-sm">{userData.dni || 'No registrado'}</div></div>
              <div><label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Phone size={14}/> Número de Teléfono</label><div className="bg-slate-50 p-3.5 rounded-xl border border-gray-100 text-gray-700 font-medium shadow-sm">{userData.telefono || 'No registrado'}</div></div>
              <div><label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Mail size={14}/> Correo Electrónico Personal</label><div className="bg-slate-50 p-3.5 rounded-xl border border-gray-100 text-gray-700 font-medium shadow-sm">{userData.correo_personal || 'No registrado'}</div></div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-extrabold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2"><ShieldCheck size={20} className="text-gray-400"/> Accesos Corporativos</h3>
              <div><label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Mail size={14}/> Correo Login (Sistema)</label><div className="bg-blue-50 p-3.5 rounded-xl border border-blue-100 text-blue-800 font-medium shadow-sm">{userData.email}</div></div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"><Eye size={16} className="text-blue-500"/> Módulos de Visualización</p>
                <div className="flex flex-wrap gap-2">
                  {permisosVista.length > 0 ? permisosVista.map(mod => <span key={mod} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold">{mod}</span>) : <span className="text-xs text-gray-400 italic">No tiene accesos.</span>}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"><Zap size={16} className="text-yellow-500"/> Módulos Editables</p>
                <div className="flex flex-wrap gap-2">
                  {permisosEdicion.length > 0 ? permisosEdicion.map(mod => <span key={mod} className="bg-yellow-50 text-yellow-700 border border-yellow-300 px-3 py-1.5 rounded-lg text-xs font-bold">{mod}</span>) : <span className="text-xs text-gray-400 italic">Solo lectura.</span>}
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-4 text-center bg-gray-50 p-2 rounded-lg">* Para modificar tus datos o accesos, comunícate con el Administrador principal.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default Perfil;