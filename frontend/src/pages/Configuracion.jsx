import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { User, Palette, Building2, Receipt, Save, UploadCloud, Moon, Sun, Monitor, CheckCircle, AlertTriangle, ShieldCheck, Printer, CreditCard } from 'lucide-react';

const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const Configuracion = () => {
  const [activeTab, setActiveTab] = useState('perfil');
  const [usuario, setUsuario] = useState(JSON.parse(localStorage.getItem('usuario') || '{}'));
  const [toast, setToast] = useState(null);

  const [themePref, setThemePref] = useState(localStorage.getItem('theme') || 'dark');
  const [accentColor, setAccentColor] = useState(localStorage.getItem('accent') || 'blue');
  const [papelImpresion, setPapelImpresion] = useState('80mm');
  
  const [avatarPreview, setAvatarPreview] = useState(usuario?.avatar || null);
  const [avatarBase64, setAvatarBase64] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const esAdmin = usuario?.rol === 'Administrador' || usuario?.rol === 'SuperAdmin';

  const [perfilForm, setPerfilForm] = useState({
    nombre: usuario?.nombre || '',
    nuevaPassword: '',
    confirmarPassword: ''
  });

  const showToast = (type, message) => { 
    setToast({ type, message }); 
    setTimeout(() => setToast(null), 3000); 
  };

  const handleThemeChange = (modo) => {
    const htmlElement = document.documentElement;
    setThemePref(modo);
    localStorage.setItem('theme', modo);

    if (modo === 'dark') {
      htmlElement.classList.add('dark');
      htmlElement.classList.remove('light');
    } else if (modo === 'light') {
      htmlElement.classList.remove('dark');
      htmlElement.classList.add('light');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        htmlElement.classList.add('dark');
        htmlElement.classList.remove('light');
      } else {
        htmlElement.classList.remove('dark');
        htmlElement.classList.add('light');
      }
    }
    window.dispatchEvent(new Event('themeChanged'));
    showToast('success', 'Apariencia actualizada');
  };

  const handleAccentChange = (color) => {
    setAccentColor(color);
    localStorage.setItem('accent', color);
    
    // Actualizamos las variables CSS en la raíz del documento
    document.documentElement.setAttribute('data-theme-color', color);
    showToast('success', `Color de acento cambiado a ${color}`);
  };

  useEffect(() => {
    // Al cargar el componente, aplicamos el color guardado
    const savedAccent = localStorage.getItem('accent') || 'blue';
    document.documentElement.setAttribute('data-theme-color', savedAccent);
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return showToast('error', 'La imagen es muy grande (Máx 2MB)');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setAvatarBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
      showToast('success', 'Logo cargado localmente');
    }
  };

  const handleSavePerfil = async (e) => {
    e.preventDefault();
    if (perfilForm.nuevaPassword && perfilForm.nuevaPassword !== perfilForm.confirmarPassword) {
      return showToast('error', 'Las contraseñas no coinciden');
    }
    try {
      const payload = {
        nombre_completo: perfilForm.nombre,
        nueva_password: perfilForm.nuevaPassword
      };
      if (avatarBase64) payload.avatar = avatarBase64;

      await api.put('/usuarios/perfil', payload);
      
      const userUpdate = { 
        ...usuario, 
        nombre: perfilForm.nombre,
        ...(avatarBase64 && { avatar: avatarBase64 }) 
      };
      
      localStorage.setItem('usuario', JSON.stringify(userUpdate));
      setUsuario(userUpdate);
      setPerfilForm({...perfilForm, nuevaPassword: '', confirmarPassword: ''});
      setAvatarBase64(null);
      window.dispatchEvent(new Event('storage'));

      showToast('success', '¡Perfil actualizado en la base de datos!');
    } catch (error) {
      console.error(error);
      showToast('error', 'Error al actualizar el perfil');
    }
  };

  const handleSaveNegocio = (e) => {
    e.preventDefault();
    showToast('success', '¡Datos del negocio guardados (Simulado)!');
  };

  const handleSaveTickets = (e) => {
    e.preventDefault();
    showToast('success', '¡Configuración de tickets guardada (Simulado)!');
  };

  const TABS = [
    { id: 'perfil', label: 'Mi Perfil', icon: User, desc: 'Datos y seguridad' },
    { id: 'apariencia', label: 'Apariencia', icon: Palette, desc: 'Temas y colores' },
    { id: 'negocio', label: 'Negocio', icon: Building2, desc: 'Datos Fiscales', adminOnly: true },
    { id: 'tickets', label: 'Impresión', icon: Receipt, desc: 'Hardware', adminOnly: true }
  ];

  const tabsToRender = TABS.filter(tab => !tab.adminOnly || esAdmin);

  // Mapeo de colores para el CSS dinámico
  const colorMap = {
    blue: { main: '#2563eb', hover: '#1d4ed8', light: '#eff6ff', dark: '#1e3a8a' },
    emerald: { main: '#10b981', hover: '#047857', light: '#ecfdf5', dark: '#064e3b' },
    purple: { main: '#9333ea', hover: '#7e22ce', light: '#faf5ff', dark: '#581c87' },
    rose: { main: '#f43f5e', hover: '#be123c', light: '#fff1f2', dark: '#881337' },
    amber: { main: '#f59e0b', hover: '#b45309', light: '#fffbeb', dark: '#78350f' }
  };

  const currentColors = colorMap[accentColor] || colorMap.blue;

  return (
    <Layout title="Ajustes" moduleIcon={<Palette />}>
      
      {/* ESTILO DINÁMICO PARA EL COLOR DE ACENTO */}
      <style>{`
        :root[data-theme-color="${accentColor}"] .btn-primary { background-color: ${currentColors.main}; }
        :root[data-theme-color="${accentColor}"] .btn-primary:hover { background-color: ${currentColors.hover}; }
        :root[data-theme-color="${accentColor}"] .text-primary { color: ${currentColors.main}; }
        :root[data-theme-color="${accentColor}"] .border-primary { border-color: ${currentColors.main}; }
        :root[data-theme-color="${accentColor}"] .ring-primary { --tw-ring-color: ${currentColors.main}40; }
        :root[data-theme-color="${accentColor}"] .bg-primary-light { background-color: ${currentColors.light}; }
        :root[data-theme-color="${accentColor}"] .dark .bg-primary-light { background-color: ${currentColors.dark}; }
      `}</style>

      {toast && (
        <div className={`fixed top-4 right-4 md:top-auto md:bottom-10 md:right-10 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-white animate-fade-in-down md:animate-fade-in-up backdrop-blur-xl border border-white/20 ${toast.type === 'success' ? 'bg-emerald-600/95' : 'bg-red-600/95'}`}>
          {toast.type === 'success' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
          <p className="font-bold text-xs tracking-wide">{toast.message}</p>
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL CENTRADO */}
      <div className="flex flex-col lg:flex-row gap-6 pb-20 md:pb-0 items-start justify-center max-w-5xl mx-auto w-full">
        
        {/* MENÚ LATERAL */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-3 z-10 sticky top-0 md:relative pt-1 md:pt-0">
          <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[1.5rem] p-2 shadow-sm border border-gray-200/50 dark:border-white/5">
            <nav className={`flex flex-row lg:flex-col gap-1.5 overflow-x-auto ${hideScrollbar}`}>
              {tabsToRender.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col lg:flex-row items-center lg:items-start gap-2 lg:gap-3 px-4 py-3 rounded-xl transition-all duration-300 flex-1 lg:flex-none justify-center lg:justify-start group ${
                      isActive 
                        ? 'btn-primary text-white shadow-lg' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-white'
                    }`}
                  >
                    <Icon size={18} className={`shrink-0 ${isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                    <div className="text-center lg:text-left">
                      <p className={`text-[11px] md:text-xs font-black leading-tight ${isActive ? 'text-white' : ''}`}>{tab.label}</p>
                      <p className={`text-[9px] font-bold tracking-widest uppercase hidden lg:block mt-0.5 ${isActive ? 'text-white/70' : 'text-slate-400'}`}>{tab.desc}</p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* CONTENIDO (Formularios) - MÁS ESTILIZADO Y CENTRADO */}
        <div className={`flex-1 w-full bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-white/80 dark:border-white/5 p-6 md:p-10 transition-colors duration-300`}>
          
          {/* --- TAB: MI PERFIL --- */}
          {activeTab === 'perfil' && (
            <div className="animate-fade-in w-full">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">Mi Perfil</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-8">Administra tu identidad y seguridad.</p>
              
              <div className="flex items-center gap-5 mb-8 p-5 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-gray-200/50 dark:border-white/5 shadow-sm">
                <input type="file" id="avatarUpload" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                <label htmlFor="avatarUpload" className="w-20 h-20 md:w-24 md:h-24 rounded-[1.25rem] btn-primary text-white flex items-center justify-center font-black text-3xl shadow-xl border-4 border-white dark:border-slate-800 shrink-0 relative group cursor-pointer overflow-hidden transition-all hover:scale-105">
                  {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover"/> : (usuario?.nombre || 'U').charAt(0).toUpperCase()}
                  <div className="absolute inset-0 bg-black/60 hidden group-hover:flex flex-col items-center justify-center transition-all">
                    <UploadCloud size={20} className="text-white mb-1"/>
                  </div>
                </label>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white leading-tight mb-1">{usuario?.nombre}</h3>
                  <p className="text-primary font-bold text-[10px] uppercase tracking-widest bg-primary-light px-2.5 py-1 rounded-md inline-block">{usuario?.rol}</p>
                </div>
              </div>

              <form id="perfilForm" onSubmit={handleSavePerfil} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-2 block">Nombre Completo</label>
                    <input type="text" value={perfilForm.nombre} onChange={(e) => setPerfilForm({...perfilForm, nombre: e.target.value})} required className="w-full border border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-blue-950/30 p-3.5 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 ring-primary outline-none text-sm transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-2 block">Correo (Login)</label>
                    <input type="email" defaultValue={usuario?.email} disabled className="w-full border border-gray-200/50 dark:border-white/5 bg-gray-50/50 dark:bg-slate-900/30 p-3.5 rounded-xl font-bold text-slate-400 outline-none cursor-not-allowed text-sm" />
                  </div>
                  <div className="md:col-span-2 pt-4">
                    <h4 className="text-sm font-black text-slate-800 dark:text-white mb-4 border-b border-dashed border-gray-200 dark:border-slate-700 pb-2.5 flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-500"/> Seguridad</h4>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-2 block">Nueva Contraseña</label>
                    <input type="password" value={perfilForm.nuevaPassword} onChange={(e) => setPerfilForm({...perfilForm, nuevaPassword: e.target.value})} placeholder="Mínimo 6 caracteres" className="w-full border border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-blue-950/30 p-3.5 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 ring-primary outline-none text-sm transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-2 block">Confirmar Contraseña</label>
                    <input type="password" value={perfilForm.confirmarPassword} onChange={(e) => setPerfilForm({...perfilForm, confirmarPassword: e.target.value})} placeholder="Repite la contraseña" className="w-full border border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-blue-950/30 p-3.5 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 ring-primary outline-none text-sm transition-all" />
                  </div>
                </div>

                <div className="flex justify-end pt-8 mt-8 border-t border-gray-100/50 dark:border-white/5">
                  <button type="submit" className="w-full md:w-auto btn-primary text-white font-black px-10 py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-sm hover:-translate-y-0.5">
                    <Save size={18}/> Actualizar Perfil
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* --- TAB: APARIENCIA --- */}
          {activeTab === 'apariencia' && (
            <div className="animate-fade-in w-full">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">Apariencia</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-8">Personaliza la iluminación del sistema.</p>
              
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Modo de Iluminación</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
                <button onClick={() => handleThemeChange('light')} className={`relative flex flex-row sm:flex-col items-center justify-start sm:justify-center p-5 sm:p-8 rounded-3xl border-2 transition-all bg-white/80 dark:bg-slate-900/50 backdrop-blur-md ${themePref === 'light' ? 'border-primary shadow-xl scale-[1.02]' : 'border-transparent shadow-sm hover:border-gray-200 dark:hover:border-slate-700'}`}>
                  {themePref === 'light' && <div className="absolute top-4 right-4 text-primary"><CheckCircle size={18} className="bg-white rounded-full"/></div>}
                  <div className="w-14 h-14 bg-blue-50/50 rounded-full flex items-center justify-center mr-4 sm:mr-0 sm:mb-4 shrink-0"><Sun size={24} className="text-amber-500"/></div>
                  <div className="text-left sm:text-center">
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white leading-tight">Claro</h3>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Día</p>
                  </div>
                </button>

                <button onClick={() => handleThemeChange('dark')} className={`relative flex flex-row sm:flex-col items-center justify-start sm:justify-center p-5 sm:p-8 rounded-3xl border-2 transition-all bg-slate-900 dark:bg-slate-950 backdrop-blur-md ${themePref === 'dark' ? 'border-primary shadow-xl scale-[1.02]' : 'border-transparent shadow-sm hover:border-slate-700'}`}>
                  {themePref === 'dark' && <div className="absolute top-4 right-4 text-primary"><CheckCircle size={18} className="bg-slate-900 rounded-full"/></div>}
                  <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center shadow-inner mr-4 sm:mr-0 sm:mb-4 border border-white/5 shrink-0"><Moon size={24} className="text-blue-400"/></div>
                  <div className="text-left sm:text-center">
                    <h3 className="text-base font-extrabold text-white leading-tight">Oscuro</h3>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Noche</p>
                  </div>
                </button>

                <button onClick={() => handleThemeChange('system')} className={`relative flex flex-row sm:flex-col items-center justify-start sm:justify-center p-5 sm:p-8 rounded-3xl border-2 transition-all bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 backdrop-blur-md ${themePref === 'system' ? 'border-primary shadow-xl scale-[1.02]' : 'border-transparent shadow-sm hover:border-slate-300 dark:hover:border-slate-700'}`}>
                  {themePref === 'system' && <div className="absolute top-4 right-4 text-primary"><CheckCircle size={18} className="bg-white dark:bg-slate-900 rounded-full"/></div>}
                  <div className="w-14 h-14 bg-white/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center shadow-sm mr-4 sm:mr-0 sm:mb-4 border border-white/20 shrink-0"><Monitor size={24} className="text-slate-600 dark:text-slate-300"/></div>
                  <div className="text-left sm:text-center">
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white leading-tight">Auto</h3>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Sistema</p>
                  </div>
                </button>
              </div>

              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Color de Acento</h3>
              <div className="flex flex-wrap justify-center sm:justify-start gap-5 p-6 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-gray-200/50 dark:border-white/5">
                {[ { id: 'blue', color: 'bg-blue-600', shadow: 'shadow-blue-500/50' }, { id: 'emerald', color: 'bg-emerald-500', shadow: 'shadow-emerald-500/50' }, { id: 'purple', color: 'bg-purple-600', shadow: 'shadow-purple-500/50' }, { id: 'rose', color: 'bg-rose-500', shadow: 'shadow-rose-500/50' }, { id: 'amber', color: 'bg-amber-500', shadow: 'shadow-amber-500/50' }].map(c => (
                  <button key={c.id} onClick={() => handleAccentChange(c.id)} className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${c.color} flex items-center justify-center transition-all duration-300 ${accentColor === c.id ? `ring-4 ring-offset-4 ring-offset-slate-50 dark:ring-offset-slate-900 ${c.shadow} scale-110` : 'hover:scale-110 hover:opacity-80'}`}>
                    {accentColor === c.id && <CheckCircle size={20} className="text-white"/>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* --- TAB: NEGOCIO --- */}
          {activeTab === 'negocio' && (
            <div className="animate-fade-in w-full">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">Datos Fiscales</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-8">Para comprobantes oficiales.</p>
              
              <form id="negocioForm" onSubmit={handleSaveNegocio} className="space-y-5 bg-white/50 dark:bg-blue-900/10 p-6 md:p-8 rounded-3xl border border-gray-200/50 dark:border-white/5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-2 block">Razón Social *</label>
                    <input type="text" placeholder="Ej: Inversiones El Remanso" className="w-full border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-blue-950/30 p-3.5 rounded-xl font-black text-sm text-slate-800 dark:text-white focus:ring-2 ring-primary outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-2 block">RUC / NIT *</label>
                    <input type="text" placeholder="11 dígitos" className="w-full border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-blue-950/30 p-3.5 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 ring-primary outline-none text-sm transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-2 block">Moneda Principal</label>
                    <select className="w-full border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-blue-950/30 p-3.5 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 ring-primary outline-none text-sm transition-all">
                      <option value="PEN">Soles (PEN - S/)</option>
                      <option value="USD">Dólares (USD - $)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-2 block">Dirección Matriz</label>
                    <input type="text" placeholder="Ej: Av. Principal 123" className="w-full border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-blue-950/30 p-3.5 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 ring-primary outline-none text-sm transition-all" />
                  </div>
                </div>

                <div className="flex justify-end pt-8 mt-8 border-t border-gray-200/50 dark:border-white/10">
                  <button type="submit" className="w-full md:w-auto btn-primary text-white font-black px-10 py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-sm hover:-translate-y-0.5">
                    <Save size={18}/> Guardar Datos Fiscales
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* --- TAB: TICKETS E IMPRESIÓN --- */}
          {activeTab === 'tickets' && (
            <div className="animate-fade-in w-full">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">Impresión</h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-8">Configura el hardware y los formatos de boletas.</p>
              
              <form id="ticketsForm" onSubmit={handleSaveTickets} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-3xl border border-gray-200/50 dark:border-white/5 shadow-sm">
                    <Printer className="text-primary mb-3 w-7 h-7"/>
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-3 block">Ancho Impresora</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setPapelImpresion('80mm')} className={`flex-1 py-2.5 rounded-xl font-bold text-xs border transition-colors ${papelImpresion === '80mm' ? 'btn-primary text-white border-transparent' : 'bg-white dark:bg-slate-800 text-slate-600 border-gray-200 dark:border-slate-700 hover:bg-gray-50'}`}>80 mm</button>
                      <button type="button" onClick={() => setPapelImpresion('58mm')} className={`flex-1 py-2.5 rounded-xl font-bold text-xs border transition-colors ${papelImpresion === '58mm' ? 'btn-primary text-white border-transparent' : 'bg-white dark:bg-slate-800 text-slate-600 border-gray-200 dark:border-slate-700 hover:bg-gray-50'}`}>58 mm</button>
                    </div>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-900/50 p-6 rounded-3xl border border-gray-200/50 dark:border-white/5 shadow-sm">
                    <CreditCard className="text-emerald-500 mb-3 w-7 h-7"/>
                    <label className="text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-3 block">Impuesto (IGV) %</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-base">%</span>
                      <input type="number" defaultValue="18" min="0" max="100" className="w-full border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 pl-11 pr-4 py-3 rounded-xl font-black text-sm text-slate-800 dark:text-white outline-none focus:ring-2 ring-emerald-500/50 transition-all" />
                    </div>
                  </div>
                </div>

                <input type="file" id="logoUpload" className="hidden" accept="image/png, image/jpeg" onChange={handleLogoChange} />
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-primary-light rounded-3xl border border-gray-200/50 dark:border-white/5 shadow-sm relative overflow-hidden">
                  <label htmlFor="logoUpload" className="w-28 h-28 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-gray-300 dark:border-slate-700 flex flex-col items-center justify-center text-primary shrink-0 cursor-pointer hover:border-primary overflow-hidden transition-colors">
                    {logoPreview ? <img src={logoPreview} className="w-full h-full object-contain p-2"/> : (
                      <><UploadCloud size={28} className="mb-2"/><span className="text-[9px] font-bold uppercase tracking-widest text-center">Subir Logo</span></>
                    )}
                  </label>
                  <div className="relative z-10 w-full text-center sm:text-left">
                    <h3 className="text-base font-black text-slate-800 dark:text-white mb-1.5">Logo Boleta Térmica</h3>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">Sube un logo 100% blanco y negro.<br className="hidden sm:block"/> Recomendado: 384x100px.</p>
                    <label htmlFor="logoUpload" className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-slate-700 dark:text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm cursor-pointer inline-block hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      Examinar Archivos
                    </label>
                  </div>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-3xl border border-gray-200/50 dark:border-white/5 shadow-sm">
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-3 block">Pie del Ticket (Agradecimiento)</label>
                  <textarea rows="3" placeholder="¡Gracias por su compra! Vuelva pronto..." className="w-full border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 p-4 rounded-xl font-bold text-slate-800 dark:text-white outline-none resize-none text-sm focus:ring-2 ring-primary transition-all"></textarea>
                </div>

                <div className="flex justify-end pt-8 mt-8 border-t border-gray-200/50 dark:border-white/10">
                  <button type="submit" className="w-full md:w-auto btn-primary text-white font-black px-10 py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-sm hover:-translate-y-0.5">
                    <Save size={18}/> Guardar Configuración
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Configuracion;