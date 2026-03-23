import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { MapPin, Plus, Trash2, Package, Search, X, Store, AlertTriangle, CheckCircle, TrendingUp, Navigation } from 'lucide-react';

const hideScrollbar = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

const Sucursales = () => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  const [formData, setFormData] = useState({ nombre: '', direccion: '', latitud: '', longitud: '' });
  
  const [toast, setToast] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [sucursalActiva, setSucursalActiva] = useState(JSON.parse(localStorage.getItem('sucursalActiva')) || null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchSucursales = async () => {
    try {
      const res = await api.get('/sucursales');
      setSucursales(res.data);
    } catch (err) { 
      console.error("Error al cargar sucursales:", err);
      showToast('error', 'Error al conectar con el servidor.');
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchSucursales(); 
    
    const handleSucursalCambiada = () => {
      setSucursalActiva(JSON.parse(localStorage.getItem('sucursalActiva')));
    };
    window.addEventListener('sucursalCambiada', handleSucursalCambiada);
    return () => window.removeEventListener('sucursalCambiada', handleSucursalCambiada);
  }, []);

  const obtenerCoordenadas = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      showToast('error', "Tu navegador no soporta GPS.");
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData({ ...formData, latitud: pos.coords.latitude, longitud: pos.coords.longitude });
        setGpsLoading(false);
        showToast('success', 'Coordenadas obtenidas correctamente');
      },
      (err) => {
        showToast('error', "Permite el acceso a la ubicación en tu navegador.");
        setGpsLoading(false);
      }
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return showToast('error', 'El nombre es obligatorio');

    try {
      await api.post('/sucursales', formData);
      setModalOpen(false);
      setFormData({ nombre: '', direccion: '', latitud: '', longitud: '' });
      showToast('success', '¡Sucursal registrada con éxito!');
      fetchSucursales();
    } catch (err) { 
      showToast('error', err.response?.data?.error || 'Error al guardar la sucursal.');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('¿Seguro que deseas eliminar esta sucursal?')) {
      try {
        await api.delete(`/sucursales/${id}`);
        showToast('success', 'Sucursal eliminada correctamente');
        fetchSucursales();
      } catch (err) { 
        showToast('error', err.response?.data?.error || 'Error al eliminar. Verifica si hay productos vinculados.'); 
      }
    }
  };

  const totales = { 
    sucursales: sucursales.length, 
    stock: sucursales.reduce((acc, s) => acc + parseInt(s.total_stock || 0), 0) 
  };
  
  const filtradas = sucursales.filter(s => s.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <Layout title="Sucursales" moduleIcon={<Store/>}>
      
      {/* ✨ TOAST NOTIFICATIONS (LIQUID GLASS) ✨ */}
      {toast && (
        <div className={`fixed top-4 right-4 md:top-auto md:bottom-10 md:right-10 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-white animate-fade-in-down md:animate-fade-in-up backdrop-blur-xl border border-white/20 transition-colors ${toast.type === 'success' ? 'bg-emerald-600/95' : 'bg-red-600/95'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <p className="font-bold text-xs md:text-sm tracking-wide">{toast.message}</p>
        </div>
      )}

      {/* ✨ INDICADORES GLOBALES (LIQUID GLASS) ✨ */}
      <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6">
        <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/80 dark:border-white/5 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 transition-colors duration-300">
          <div className="bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-3 md:p-4 rounded-xl border border-blue-100/50 dark:border-blue-500/20 backdrop-blur-md shrink-0 transition-colors"><MapPin size={20} className="md:w-6 md:h-6"/></div>
          <div>
            <p className="text-[9px] md:text-[10px] text-gray-500 dark:text-blue-300/70 font-extrabold uppercase tracking-widest mb-0.5 transition-colors">Sedes Activas</p>
            <p className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white leading-none transition-colors">{totales.sucursales}</p>
          </div>
        </div>
        <div className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/80 dark:border-white/5 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 transition-colors duration-300">
          <div className="bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-3 md:p-4 rounded-xl border border-emerald-100/50 dark:border-emerald-500/20 backdrop-blur-md shrink-0 transition-colors"><Package size={20} className="md:w-6 md:h-6"/></div>
          <div>
            <p className="text-[9px] md:text-[10px] text-gray-500 dark:text-blue-300/70 font-extrabold uppercase tracking-widest mb-0.5 transition-colors">Stock Físico Global</p>
            <p className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white leading-none transition-colors">{totales.stock}</p>
          </div>
        </div>
      </div>

      {/* ✨ BUSCADOR Y BOTÓN NUEVO (LIQUID GLASS) ✨ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-blue-400/70 transition-colors" size={16}/>
          <input 
            type="text" 
            placeholder="Buscar sucursal..." 
            className="w-full bg-white/80 dark:bg-blue-950/50 backdrop-blur-md border border-gray-200/80 dark:border-white/10 pl-9 pr-3 py-2.5 md:py-3 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-blue-950 focus:border-blue-500 dark:focus:border-blue-400 font-bold text-gray-800 dark:text-white shadow-sm transition-all" 
            value={busqueda} 
            onChange={e => setBusqueda(e.target.value)} 
          />
        </div>
        <button onClick={() => setModalOpen(true)} className="w-full sm:w-auto bg-blue-600/90 dark:bg-blue-600 text-white px-5 py-3 sm:py-2.5 rounded-xl font-black flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 hover:bg-blue-700 transition-all active:scale-95 text-xs md:text-sm border border-transparent dark:border-white/10 backdrop-blur-md">
          <Plus size={16}/> <span className="sm:hidden lg:inline">Nueva Sucursal</span><span className="hidden sm:inline lg:hidden">Nueva</span>
        </button>
      </div>

      {/* ✨ TARJETAS DE SUCURSALES (LIQUID GLASS) ✨ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400 dark:text-blue-300/70 transition-colors">
             <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
             <p className="text-[10px] font-extrabold uppercase tracking-widest transition-colors">Cargando mapa de sucursales...</p>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white/60 dark:bg-blue-950/20 backdrop-blur-2xl rounded-[2rem] border border-gray-100/50 dark:border-white/5 shadow-sm flex flex-col items-center transition-colors">
             <Store size={48} className="text-gray-300 dark:text-slate-600 mb-3" strokeWidth={1.5}/>
             <p className="text-sm font-black text-gray-600 dark:text-white transition-colors">No hay sucursales registradas</p>
             <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium transition-colors">Crea tu primera sede para empezar a operar.</p>
          </div>
        ) : (
          filtradas.map(suc => (
            <div key={suc.id} className="bg-white/60 dark:bg-blue-950/20 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] border border-gray-200/50 dark:border-white/5 p-4 md:p-5 hover:shadow-lg dark:hover:shadow-[0_8px_30px_rgb(29,78,216,0.15)] hover:border-blue-300 dark:hover:border-blue-500/50 transition-all hover:-translate-y-1 relative group overflow-hidden flex flex-col h-full duration-300">
              <div className="flex items-start gap-3 md:gap-4 mb-4">
                <div className="bg-blue-50/80 dark:bg-blue-900/30 border border-blue-100/50 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 p-2.5 md:p-3 rounded-xl md:rounded-2xl shrink-0 backdrop-blur-md transition-colors"><Store size={20} className="md:w-6 md:h-6"/></div>
                <div className="flex-1 pr-8">
                  <h3 className="text-sm md:text-lg font-black text-gray-800 dark:text-white leading-tight line-clamp-1 transition-colors">{suc.nombre}</h3>
                  <p className="text-[10px] md:text-xs text-gray-500 dark:text-slate-400 font-bold mt-1 line-clamp-2 h-7 md:h-8 leading-snug transition-colors">{suc.direccion || 'Dirección no especificada'}</p>
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-dashed border-gray-200/80 dark:border-slate-700 flex flex-col gap-2 transition-colors">
                <div className="flex items-center justify-between text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-2 md:p-2.5 rounded-lg md:rounded-xl border border-gray-100/50 dark:border-white/5 transition-colors">
                  <span className="flex items-center gap-1.5"><Package size={14} className="text-slate-400 dark:text-slate-500 shrink-0"/> Catálogo Asignado</span>
                  <span className="text-slate-800 dark:text-white bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded shadow-sm border border-slate-100 dark:border-white/10 transition-colors">{suc.total_productos} prod.</span>
                </div>
                <div className="flex items-center justify-between text-[10px] md:text-xs font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/20 backdrop-blur-md p-2 md:p-2.5 rounded-lg md:rounded-xl border border-emerald-100/50 dark:border-emerald-500/20 transition-colors">
                  <span className="flex items-center gap-1.5"><TrendingUp size={14} className="text-emerald-500 dark:text-emerald-400 shrink-0"/> Inventario Físico</span>
                  <span className="text-emerald-700 dark:text-emerald-300 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded shadow-sm border border-emerald-100 dark:border-emerald-500/30 transition-colors">{suc.total_stock} un.</span>
                </div>
              </div>

              <button 
                onClick={() => handleDelete(suc.id)} 
                className="absolute top-4 right-4 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 bg-white/80 dark:bg-slate-800/80 border border-transparent dark:border-white/10 hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-100 dark:hover:border-red-500/20 p-2 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100 shadow-sm backdrop-blur-md active:scale-95" 
                title="Eliminar Sede"
              >
                <Trash2 size={14}/>
              </button>
            </div>
          ))
        )}
      </div>

      {/* ✨ MODAL CREAR SUCURSAL (Bottom Sheet en Móvil - LIQUID GLASS) ✨ */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-md transition-colors animate-fade-in">
          <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-3xl sm:rounded-[2.5rem] p-6 md:p-8 w-full sm:max-w-md shadow-2xl border border-white/50 dark:border-white/10 animate-fade-in-up flex flex-col max-h-[90vh] transition-colors">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>
            
            <div className="flex justify-between items-center mb-5 border-b border-gray-100/50 dark:border-white/5 pb-4 shrink-0 transition-colors">
              <h2 className="text-lg md:text-xl font-black text-gray-800 dark:text-white flex items-center gap-2"><MapPin className="text-blue-600 dark:text-blue-400" size={20}/> Registrar Sucursal</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors border border-transparent dark:border-white/5"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSave} className={`space-y-4 overflow-y-auto ${hideScrollbar} pb-4 px-1`}>
              <div>
                <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest block mb-1.5 transition-colors">Nombre Comercial *</label>
                <input required autoFocus type="text" className="w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border border-gray-200/80 dark:border-white/10 p-3.5 rounded-xl focus:bg-white dark:focus:bg-blue-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none font-bold text-gray-800 dark:text-white text-xs md:text-sm transition-all shadow-sm" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. Tienda Norte"/>
              </div>
              
              <div>
                <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest block mb-1.5 transition-colors">Dirección Completa</label>
                <input type="text" className="w-full bg-white/70 dark:bg-blue-950/30 backdrop-blur-md border border-gray-200/80 dark:border-white/10 p-3.5 rounded-xl focus:bg-white dark:focus:bg-blue-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none font-bold text-gray-700 dark:text-white text-xs md:text-sm transition-all shadow-sm" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} placeholder="Av. Principal 123..."/>
              </div>

              {/* CAPTURA DE COORDENADAS */}
              <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-500/20 mt-2 backdrop-blur-md transition-colors relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
                <div className="flex justify-between items-center mb-3 relative z-10">
                  <label className="text-[10px] font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 transition-colors"><Navigation size={12}/> Geolocalización</label>
                  <button type="button" onClick={obtenerCoordenadas} disabled={gpsLoading} className="text-[9px] md:text-[10px] uppercase tracking-wider bg-blue-600/90 dark:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-black hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:active:scale-100 border border-transparent dark:border-white/10 backdrop-blur-md">
                    {gpsLoading ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Ubicando...</> : '📍 Autodetectar'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2.5 relative z-10">
                  <input type="text" placeholder="Latitud (-12.043...)" className="w-full bg-white/80 dark:bg-blue-950/50 backdrop-blur-md border border-blue-200/80 dark:border-blue-500/30 p-2.5 rounded-xl outline-none text-[10px] md:text-xs font-mono font-bold text-gray-700 dark:text-blue-100 focus:bg-white dark:focus:bg-blue-950 focus:border-blue-400 dark:focus:border-blue-400 transition-colors shadow-sm" value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} />
                  <input type="text" placeholder="Longitud (-77.028...)" className="w-full bg-white/80 dark:bg-blue-950/50 backdrop-blur-md border border-blue-200/80 dark:border-blue-500/30 p-2.5 rounded-xl outline-none text-[10px] md:text-xs font-mono font-bold text-gray-700 dark:text-blue-100 focus:bg-white dark:focus:bg-blue-950 focus:border-blue-400 dark:focus:border-blue-400 transition-colors shadow-sm" value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-100/50 dark:border-white/5 mt-6 transition-colors">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3.5 border border-gray-200/80 dark:border-white/5 bg-white/50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-300 rounded-xl font-extrabold hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm backdrop-blur-md shadow-sm active:scale-95">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600/90 dark:bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 text-sm flex items-center justify-center gap-1.5 border border-transparent dark:border-white/10 backdrop-blur-md"><CheckCircle size={16}/> Guardar</button>
              </div>
            </form>

          </div>
        </div>
      )}
    </Layout>
  );
};

export default Sucursales;