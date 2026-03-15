import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { MapPin, Plus, Trash2, Package, Search, X, Store, AlertTriangle, CheckCircle, TrendingUp, Navigation } from 'lucide-react';

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
      
      {/* ✨ TOAST NOTIFICATIONS ✨ */}
      {toast && (
        <div className={`fixed top-4 right-4 md:top-6 md:right-6 z-[100] flex items-center gap-3 px-5 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl shadow-2xl text-white animate-fade-in-down ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={20} className="md:w-6 md:h-6" /> : <AlertTriangle size={20} className="md:w-6 md:h-6" />}
          <p className="font-bold text-xs md:text-sm">{toast.message}</p>
        </div>
      )}

      {/* ✨ INDICADORES GLOBALES ✨ */}
      <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
          <div className="bg-blue-50 text-blue-600 p-2 md:p-4 rounded-xl shrink-0"><MapPin size={24} className="w-5 h-5 md:w-6 md:h-6"/></div>
          <div>
            <p className="text-[10px] md:text-sm text-gray-500 font-extrabold uppercase tracking-widest mb-0.5">Sedes Activas</p>
            <p className="text-2xl md:text-3xl font-black text-gray-800 leading-none">{totales.sucursales}</p>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-2 md:p-4 rounded-xl shrink-0"><Package size={24} className="w-5 h-5 md:w-6 md:h-6"/></div>
          <div>
            <p className="text-[10px] md:text-sm text-gray-500 font-extrabold uppercase tracking-widest mb-0.5">Stock Físico</p>
            <p className="text-2xl md:text-3xl font-black text-gray-800 leading-none">{totales.stock}</p>
          </div>
        </div>
      </div>

      {/* ✨ BUSCADOR Y BOTÓN NUEVO ✨ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
          <input 
            type="text" 
            placeholder="Buscar sucursal..." 
            className="w-full bg-white border border-gray-200 pl-9 pr-3 py-2.5 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-bold text-gray-800 shadow-sm transition-all" 
            value={busqueda} 
            onChange={e => setBusqueda(e.target.value)} 
          />
        </div>
        <button onClick={() => setModalOpen(true)} className="w-full sm:w-auto bg-blue-600 text-white px-5 py-3 sm:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:bg-blue-700 transition-all active:scale-95 text-xs md:text-sm">
          <Plus size={18}/> <span className="sm:hidden lg:inline">Nueva Sucursal</span><span className="hidden sm:inline lg:hidden">Nueva</span>
        </button>
      </div>

      {/* ✨ TARJETAS DE SUCURSALES ✨ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
             <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
             <p className="text-xs font-medium">Cargando mapa de sucursales...</p>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center">
             <Store size={48} className="text-gray-200 mb-3" strokeWidth={1.5}/>
             <p className="text-sm font-bold text-gray-600">No hay sucursales registradas</p>
             <p className="text-xs text-gray-400 mt-1">Crea tu primera sede para empezar a operar.</p>
          </div>
        ) : (
          filtradas.map(suc => (
            <div key={suc.id} className="bg-white rounded-3xl border border-slate-200 p-5 hover:shadow-lg transition-all hover:-translate-y-1 relative group overflow-hidden flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-blue-50 border border-blue-100 text-blue-600 p-3 rounded-2xl shrink-0"><Store size={24}/></div>
                <div className="flex-1 pr-8">
                  <h3 className="text-base md:text-lg font-extrabold text-gray-800 leading-tight line-clamp-1">{suc.nombre}</h3>
                  <p className="text-[11px] md:text-xs text-gray-500 font-medium mt-1 line-clamp-2 h-8 leading-snug">{suc.direccion || 'Dirección no especificada'}</p>
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-dashed border-slate-100 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 bg-slate-50 p-2 rounded-lg">
                  <span className="flex items-center gap-1.5"><Package size={14} className="text-slate-400"/> Catálogo Asignado</span>
                  <span className="text-slate-800 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{suc.total_productos} prod.</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 bg-emerald-50/50 p-2 rounded-lg border border-emerald-50">
                  <span className="flex items-center gap-1.5"><TrendingUp size={14} className="text-emerald-500"/> Inventario Físico</span>
                  <span className="text-emerald-700 bg-white px-2 py-0.5 rounded shadow-sm border border-emerald-100">{suc.total_stock} un.</span>
                </div>
              </div>

              <button 
                onClick={() => handleDelete(suc.id)} 
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-xl transition-colors md:opacity-0 md:group-hover:opacity-100 shadow-sm" 
                title="Eliminar Sede"
              >
                <Trash2 size={16}/>
              </button>
            </div>
          ))
        )}
      </div>

      {/* ✨ MODAL CREAR SUCURSAL (Bottom Sheet en Móvil) ✨ */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-[2rem] p-6 md:p-8 w-full sm:max-w-md shadow-2xl border border-white/50 animate-fade-in-up flex flex-col max-h-[90vh]">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden shrink-0"></div>
            
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-3 shrink-0">
              <h2 className="text-lg md:text-xl font-extrabold text-gray-800 flex items-center gap-2"><MapPin className="text-blue-600"/> Registrar Sucursal</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4 overflow-y-auto custom-scrollbar pb-4 px-1">
              <div>
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block mb-1">Nombre Comercial *</label>
                <input required autoFocus type="text" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:bg-white outline-none font-bold text-gray-800 text-sm transition-all focus:ring-2 focus:ring-blue-100 focus:border-blue-400" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. Tienda Norte"/>
              </div>
              
              <div>
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block mb-1">Dirección Completa</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl focus:bg-white outline-none font-medium text-gray-700 text-sm transition-all focus:ring-2 focus:ring-blue-100 focus:border-blue-400" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} placeholder="Av. Principal 123..."/>
              </div>

              {/* CAPTURA DE COORDENADAS */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 mt-2">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-extrabold text-blue-700 uppercase tracking-widest flex items-center gap-1.5"><Navigation size={14}/> Geolocalización</label>
                  <button type="button" onClick={obtenerCoordenadas} disabled={gpsLoading} className="text-[10px] md:text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-70 disabled:active:scale-100">
                    {gpsLoading ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Ubicando...</> : '📍 Autodetectar'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <input type="text" placeholder="Latitud (-12.043...)" className="w-full bg-white border border-blue-200 p-2.5 rounded-xl outline-none text-[10px] md:text-xs font-mono font-bold text-gray-600 focus:border-blue-400 transition-colors" value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} />
                  <input type="text" placeholder="Longitud (-77.028...)" className="w-full bg-white border border-blue-200 p-2.5 rounded-xl outline-none text-[10px] md:text-xs font-mono font-bold text-gray-600 focus:border-blue-400 transition-colors" value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3.5 border border-gray-200 bg-gray-50 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors text-sm">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 active:scale-95 transition-all text-sm flex items-center justify-center gap-1.5"><CheckCircle size={16}/> Guardar</button>
              </div>
            </form>

          </div>
        </div>
      )}
    </Layout>
  );
};

export default Sucursales;