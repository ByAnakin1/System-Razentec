import React, { useState } from 'react';
import Layout from '../components/Layout';
import { User, Palette, Building2, Receipt, Save, UploadCloud, Moon, Sun, Monitor, CheckCircle, AlertTriangle, ShieldCheck, Printer, CreditCard } from 'lucide-react';

// Utilidad CSS para esconder scrollbars en todos los navegadores manteniendo la funcionalidad
const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const Configuracion = () => {
  const [activeTab, setActiveTab] = useState('perfil');
  const [usuario, setUsuario] = useState(JSON.parse(localStorage.getItem('usuario') || '{}'));
  const [toast, setToast] = useState(null);

  const [themePref, setThemePref] = useState(localStorage.getItem('theme') || 'dark');
  const [accentColor, setAccentColor] = useState(localStorage.getItem('accent') || 'blue');
  const [papelImpresion, setPapelImpresion] = useState('80mm');
  
  const [avatarPreview, setAvatarPreview] = useState(usuario?.avatar || null);
  const [logoPreview, setLogoPreview] = useState(null);

  const esAdmin = usuario?.rol === 'Administrador' || usuario?.rol === 'SuperAdmin';

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
    showToast('success', `Color de acento guardado`);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      showToast('success', 'Nueva foto lista');
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
      showToast('success', 'Logo cargado');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    showToast('success', '¡Configuración guardada en la nube!');
  };

  const TABS = [
    { id: 'perfil', label: 'Mi Perfil', icon: User, desc: 'Datos y seguridad' },
    { id: 'apariencia', label: 'Apariencia', icon: Palette, desc: 'Temas y colores' },
    { id: 'negocio', label: 'Negocio', icon: Building2, desc: 'Datos Fiscales', adminOnly: true },
    { id: 'tickets', label: 'Impresión', icon: Receipt, desc: 'Hardware', adminOnly: true }
  ];

  const tabsToRender = TABS.filter(tab => !tab.adminOnly || esAdmin);

  return (
    <Layout title="Ajustes" moduleIcon={<Palette />}>
      
      {/* Toast movido arriba en móvil para no tapar los colores ni los botones de guardar */}
      {toast && (
        <div className={`fixed top-4 right-4 md:top-auto md:bottom-10 md:right-10 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-white animate-fade-in-down md:animate-fade-in-up backdrop-blur-xl border border-white/20 ${toast.type === 'success' ? 'bg-emerald-600/95' : 'bg-red-600/95'}`}>
          {toast.type === 'success' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
          <p className="font-bold text-xs tracking-wide">{toast.message}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 h-full lg:h-[calc(100vh-140px)] pb-20 md:pb-0">
        
        {/* ✨ MENÚ LATERAL TIPO APP NATIVA (Iconos en móvil, lista compacta en PC) ✨ */}
        <div className="w-full lg:w-56 shrink-0 flex flex-col gap-3 z-10 sticky top-0 md:relative pt-1 md:pt-0">
          <div className="bg-white/80 dark:bg-blue-950/40 backdrop-blur-2xl rounded-[1.25rem] md:rounded-[1.5rem] p-1.5 md:p-2 shadow-sm border border-gray-200/50 dark:border-white/5 transition-colors duration-300">
            <nav className={`flex flex-row lg:flex-col gap-1 overflow-x-auto ${hideScrollbar}`}>
              {tabsToRender.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col lg:flex-row items-center lg:items-start gap-1 lg:gap-3 px-3 py-2 md:py-3 rounded-xl transition-all duration-300 flex-1 lg:flex-none justify-center lg:justify-start group ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 lg:translate-x-1' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800/50 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    <Icon size={18} className={`shrink-0 ${isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                    <div className="text-center lg:text-left">
                      <p className={`text-[10px] md:text-xs font-black leading-tight ${isActive ? 'text-white' : ''}`}>{tab.label}</p>
                      <p className={`text-[9px] font-bold tracking-widest uppercase hidden lg:block mt-0.5 ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>{tab.desc}</p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* ✨ ÁREA DE CONTENIDO COMPACTADA ✨ */}
        <div className={`flex-1 bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-white/80 dark:border-white/5 p-4 md:p-8 transition-colors duration-300 overflow-y-auto ${hideScrollbar}`}>
          
          {/* --- TAB: MI PERFIL --- */}
          {activeTab === 'perfil' && (
            <div className="animate-fade-in w-full max-w-2xl">
              <h2 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">Mi Perfil</h2>
              <p className="text-[11px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-5">Administra tu identidad y seguridad.</p>
              
              <div className="flex items-center gap-4 mb-6 p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-gray-200/50 dark:border-white/5 shadow-sm">
                <input type="file" id="avatarUpload" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                <label htmlFor="avatarUpload" className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-600/20 border-2 border-white dark:border-slate-800 shrink-0 relative group cursor-pointer overflow-hidden">
                  {avatarPreview ? <img src={avatarPreview} className="w-full h-full rounded-full object-cover"/> : (usuario?.nombre || 'U').charAt(0).toUpperCase()}
                  <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center transition-all">
                    <UploadCloud size={16} className="text-white"/>
                  </div>
                </label>
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white leading-tight">{usuario?.nombre}</h3>
                  <p className="text-blue-600 dark:text-blue-400 font-bold text-[9px] md:text-[10px] mt-1 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded inline-block">{usuario?.rol}</p>
                </div>
              </div>

              <form id="perfilForm" onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] md:text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block">Nombre Completo</label>
                    <input type="text" defaultValue={usuario?.nombre} className="w-full border border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-blue-950/30 p-2.5 md:p-3 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none text-xs" />
                  </div>
                  <div>
                    <label className="text-[9px] md:text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block">Correo (Login)</label>
                    <input type="email" defaultValue={usuario?.email} disabled className="w-full border border-gray-200/50 dark:border-white/5 bg-gray-50/50 dark:bg-slate-900/30 p-2.5 md:p-3 rounded-xl font-bold text-slate-400 outline-none cursor-not-allowed text-xs" />
                  </div>
                  <div className="md:col-span-2 pt-2">
                    <h4 className="text-xs font-black text-slate-800 dark:text-white mb-3 border-b border-dashed border-gray-200 dark:border-slate-700 pb-2 flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500"/> Seguridad</h4>
                  </div>
                  <div>
                    <label className="text-[9px] md:text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block">Nueva Contraseña</label>
                    <input type="password" placeholder="Mínimo 6 caracteres" className="w-full border border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-blue-950/30 p-2.5 md:p-3 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none text-xs" />
                  </div>
                  <div>
                    <label className="text-[9px] md:text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block">Confirmar Contraseña</label>
                    <input type="password" placeholder="Repite la contraseña" className="w-full border border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-blue-950/30 p-2.5 md:p-3 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none text-xs" />
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* --- TAB: APARIENCIA --- */}
          {activeTab === 'apariencia' && (
            <div className="animate-fade-in max-w-3xl">
              <h2 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">Apariencia</h2>
              <p className="text-[11px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-5">Personaliza la iluminación del sistema.</p>
              
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Modo de Iluminación</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <button onClick={() => handleThemeChange('light')} className={`relative flex flex-row sm:flex-col items-center justify-start sm:justify-center p-3 sm:p-5 rounded-2xl border-2 transition-all bg-white/80 dark:bg-slate-900/50 backdrop-blur-md ${themePref === 'light' ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-transparent shadow-sm hover:border-blue-200 dark:hover:border-slate-700'}`}>
                  {themePref === 'light' && <div className="absolute top-2 right-2 sm:top-3 sm:right-3 text-blue-500"><CheckCircle size={14} className="bg-white rounded-full"/></div>}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-full flex items-center justify-center mr-3 sm:mr-0 sm:mb-2 shrink-0"><Sun size={18} className="text-amber-500 sm:w-[22px] sm:h-[22px]"/></div>
                  <div className="text-left sm:text-center">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white leading-tight">Claro</h3>
                    <p className="text-[8px] sm:text-[9px] text-slate-400 mt-0.5 uppercase tracking-widest font-bold">Día</p>
                  </div>
                </button>

                <button onClick={() => handleThemeChange('dark')} className={`relative flex flex-row sm:flex-col items-center justify-start sm:justify-center p-3 sm:p-5 rounded-2xl border-2 transition-all bg-slate-900 dark:bg-slate-950 backdrop-blur-md ${themePref === 'dark' ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-transparent shadow-sm hover:border-slate-700'}`}>
                  {themePref === 'dark' && <div className="absolute top-2 right-2 sm:top-3 sm:right-3 text-blue-500"><CheckCircle size={14} className="bg-slate-900 rounded-full"/></div>}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-800 rounded-full flex items-center justify-center shadow-inner mr-3 sm:mr-0 sm:mb-2 border border-white/5 shrink-0"><Moon size={18} className="text-blue-400 sm:w-[22px] sm:h-[22px]"/></div>
                  <div className="text-left sm:text-center">
                    <h3 className="text-xs sm:text-sm font-extrabold text-white leading-tight">Oscuro</h3>
                    <p className="text-[8px] sm:text-[9px] text-slate-400 mt-0.5 uppercase tracking-widest font-bold">Noche</p>
                  </div>
                </button>

                <button onClick={() => handleThemeChange('system')} className={`relative flex flex-row sm:flex-col items-center justify-start sm:justify-center p-3 sm:p-5 rounded-2xl border-2 transition-all bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 backdrop-blur-md ${themePref === 'system' ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-transparent shadow-sm hover:border-slate-300 dark:hover:border-slate-700'}`}>
                  {themePref === 'system' && <div className="absolute top-2 right-2 sm:top-3 sm:right-3 text-blue-500"><CheckCircle size={14} className="bg-white dark:bg-slate-900 rounded-full"/></div>}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center shadow-sm mr-3 sm:mr-0 sm:mb-2 border border-white/20 shrink-0"><Monitor size={18} className="text-slate-600 dark:text-slate-300 sm:w-[22px] sm:h-[22px]"/></div>
                  <div className="text-left sm:text-center">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-white leading-tight">Auto</h3>
                    <p className="text-[8px] sm:text-[9px] text-slate-500 mt-0.5 uppercase tracking-widest font-bold">Sistema</p>
                  </div>
                </button>
              </div>

              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Color de Acento</h3>
              <div className="flex flex-wrap gap-3 p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-gray-200/50 dark:border-white/5">
                {[ { id: 'blue', color: 'bg-blue-600', shadow: 'shadow-blue-500/50' }, { id: 'emerald', color: 'bg-emerald-500', shadow: 'shadow-emerald-500/50' }, { id: 'purple', color: 'bg-purple-600', shadow: 'shadow-purple-500/50' }, { id: 'rose', color: 'bg-rose-500', shadow: 'shadow-rose-500/50' }, { id: 'amber', color: 'bg-amber-500', shadow: 'shadow-amber-500/50' }].map(c => (
                  <button key={c.id} onClick={() => handleAccentChange(c.id)} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${c.color} flex items-center justify-center transition-all ${accentColor === c.id ? `ring-2 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950 ${c.shadow} scale-110` : 'hover:scale-110 hover:opacity-80'}`}>
                    {accentColor === c.id && <CheckCircle size={14} className="text-white"/>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* --- TAB: NEGOCIO --- */}
          {activeTab === 'negocio' && (
            <div className="animate-fade-in max-w-3xl">
              <h2 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">Datos Fiscales</h2>
              <p className="text-[11px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-5">Para comprobantes oficiales.</p>
              <form id="negocioForm" onSubmit={handleSave} className="space-y-4 bg-white/50 dark:bg-blue-900/10 p-4 md:p-6 rounded-2xl border border-gray-200/50 dark:border-white/5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[9px] md:text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block">Razón Social *</label>
                    <input type="text" placeholder="Ej: Inversiones El Remanso" className="w-full border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-blue-950/30 p-2.5 md:p-3 rounded-xl font-black text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none" />
                  </div>
                  <div>
                    <label className="text-[9px] md:text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block">RUC / NIT *</label>
                    <input type="text" placeholder="11 dígitos" className="w-full border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-blue-950/30 p-2.5 md:p-3 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none text-xs" />
                  </div>
                  <div>
                    <label className="text-[9px] md:text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block">Moneda Principal</label>
                    <select className="w-full border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-blue-950/30 p-2.5 md:p-3 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none text-xs">
                      <option value="PEN">Soles (PEN - S/)</option>
                      <option value="USD">Dólares (USD - $)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[9px] md:text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block">Dirección Matriz</label>
                    <input type="text" placeholder="Ej: Av. Principal 123" className="w-full border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-blue-950/30 p-2.5 md:p-3 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none text-xs" />
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* --- TAB: TICKETS E IMPRESIÓN --- */}
          {activeTab === 'tickets' && (
            <div className="animate-fade-in max-w-3xl">
              <h2 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">Impresión</h2>
              <p className="text-[11px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mb-5">Hardware y boletas.</p>
              <form id="ticketsForm" onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-200/50 dark:border-white/5 shadow-sm">
                    <Printer className="text-blue-500 mb-2 w-5 h-5"/>
                    <label className="text-[9px] md:text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-2 block">Ancho Impresora</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setPapelImpresion('80mm')} className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] border ${papelImpresion === '80mm' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-600 border-gray-200 dark:border-slate-700'}`}>80 mm</button>
                      <button type="button" onClick={() => setPapelImpresion('58mm')} className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] border ${papelImpresion === '58mm' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-600 border-gray-200 dark:border-slate-700'}`}>58 mm</button>
                    </div>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-gray-200/50 dark:border-white/5 shadow-sm">
                    <CreditCard className="text-emerald-500 mb-2 w-5 h-5"/>
                    <label className="text-[9px] md:text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-2 block">Impuesto (IGV) %</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">%</span>
                      <input type="number" defaultValue="18" min="0" max="100" className="w-full border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 pl-8 pr-3 py-2 rounded-xl font-black text-sm text-slate-800 dark:text-white outline-none" />
                    </div>
                  </div>
                </div>

                <input type="file" id="logoUpload" className="hidden" accept="image/png, image/jpeg" onChange={handleLogoChange} />
                <div className="flex flex-row items-center gap-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-500/20 shadow-sm relative overflow-hidden">
                  <label htmlFor="logoUpload" className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-blue-300 dark:border-blue-700/50 flex flex-col items-center justify-center text-blue-400 shrink-0 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950 overflow-hidden">
                    {logoPreview ? <img src={logoPreview} className="w-full h-full object-contain p-2"/> : (
                      <><UploadCloud size={20} className="mb-1"/><span className="text-[7px] font-bold uppercase tracking-widest text-center">Subir Logo</span></>
                    )}
                  </label>
                  <div className="relative z-10 w-full">
                    <h3 className="text-xs md:text-sm font-black text-slate-800 dark:text-blue-100 mb-1">Logo Boleta</h3>
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-blue-300/70 mb-2 leading-tight">Sube un logo 100% blanco y negro. Máx 1MB.</p>
                    <label htmlFor="logoUpload" className="bg-white dark:bg-blue-600 border border-gray-200 dark:border-transparent text-slate-700 dark:text-white px-3 py-1.5 rounded-lg font-bold text-[9px] md:text-[10px] shadow-sm cursor-pointer inline-block text-center">
                      Examinar
                    </label>
                  </div>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-2xl border border-gray-200/50 dark:border-white/5 shadow-sm">
                  <label className="text-[9px] md:text-[10px] font-extrabold text-slate-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block">Pie del Ticket</label>
                  <textarea rows="2" placeholder="¡Gracias por su compra!..." className="w-full border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl font-bold text-slate-800 dark:text-white outline-none resize-none text-xs"></textarea>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ✨ BOTÓN FLOTANTE MÓVIL TIPO APP ✨ */}
      {activeTab !== 'apariencia' && (
        <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-gray-200/80 dark:border-white/10 p-4 z-40 pb-safe">
          <button 
            type="submit" 
            form={activeTab === 'perfil' ? 'perfilForm' : activeTab === 'negocio' ? 'negocioForm' : 'ticketsForm'} 
            className="w-full bg-blue-600 text-white font-black py-3 rounded-xl shadow-lg shadow-blue-600/30 active:scale-95 flex items-center justify-center gap-2 text-xs"
          >
            <Save size={16}/> Guardar Cambios
          </button>
        </div>
      )}
      
      {/* BOTÓN GUARDAR ESCRITORIO */}
      {activeTab !== 'apariencia' && (
        <div className="hidden lg:flex justify-end mt-4">
          <button 
            type="submit" 
            form={activeTab === 'perfil' ? 'perfilForm' : activeTab === 'negocio' ? 'negocioForm' : 'ticketsForm'} 
            className="bg-blue-600 text-white font-black px-8 py-3 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 text-sm"
          >
            <Save size={18}/> Guardar Configuración
          </button>
        </div>
      )}

    </Layout>
  );
};

export default Configuracion;