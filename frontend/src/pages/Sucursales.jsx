import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { MapPin, Plus, Trash2, Package, Search, X, Store, AlertOctagon, CheckCircle, TrendingUp, Navigation } from 'lucide-react';

const Sucursales = () => {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  
  // ✨ AÑADIMOS LATITUD Y LONGITUD AL ESTADO
  const [formData, setFormData] = useState({ nombre: '', direccion: '', latitud: '', longitud: '' });
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  const fetchSucursales = async () => {
    try {
      const res = await api.get('/sucursales');
      setSucursales(res.data);
    } catch (err) { console.error("Error al cargar sucursales:", err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchSucursales(); }, []);

  // ✨ FUNCIÓN PARA CAPTURAR COORDENADAS AL CREAR SUCURSAL
  const obtenerCoordenadas = () => {
    setGpsLoading(true);
    if (!navigator.geolocation) {
      setErrorMsg("Tu navegador no soporta GPS.");
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData({ ...formData, latitud: pos.coords.latitude, longitud: pos.coords.longitude });
        setGpsLoading(false);
      },
      (err) => {
        setErrorMsg("Permite el acceso a la ubicación en tu navegador.");
        setGpsLoading(false);
      }
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg(''); 
    try {
      await api.post('/sucursales', formData);
      setModalOpen(false);
      setFormData({ nombre: '', direccion: '', latitud: '', longitud: '' });
      setSuccessMsg('¡Sucursal registrada con éxito!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchSucursales();
    } catch (err) { 
      setErrorMsg(err.response?.data?.error || 'Error de conexión con el servidor.');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('¿Seguro que deseas eliminar esta sucursal?')) {
      try {
        await api.delete(`/sucursales/${id}`);
        setSuccessMsg('Sucursal eliminada');
        setTimeout(() => setSuccessMsg(''), 3000);
        fetchSucursales();
      } catch (err) { alert(err.response?.data?.error || 'Error al eliminar. Verifica si hay productos vinculados.'); }
    }
  };

  const totales = { sucursales: sucursales.length, stock: sucursales.reduce((acc, s) => acc + parseInt(s.total_stock || 0), 0) };
  const filtradas = sucursales.filter(s => s.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold flex items-center gap-2 text-gray-800"><Store className="text-blue-600"/> Gestión de Sucursales</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Administra tus puntos de venta y almacenes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-100 text-blue-600 p-4 rounded-xl"><MapPin size={24}/></div>
          <div><p className="text-sm text-gray-500 font-extrabold uppercase">Total Sucursales</p><p className="text-2xl font-black text-gray-800">{totales.sucursales}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-emerald-100 text-emerald-600 p-4 rounded-xl"><Package size={24}/></div>
          <div><p className="text-sm text-gray-500 font-extrabold uppercase">Stock Global Distribuido</p><p className="text-2xl font-black text-gray-800">{totales.stock}</p></div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
          <input type="text" placeholder="Buscar sucursal..." className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-sm" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all flex-shrink-0">
          <Plus size={18}/> Nueva Sucursal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? <p className="text-gray-500 font-medium col-span-full">Cargando ubicaciones...</p> : 
         filtradas.length === 0 ? <p className="text-gray-400 font-medium col-span-full bg-white p-8 rounded-2xl text-center border border-gray-200 shadow-sm">No hay sucursales registradas.</p> : 
         filtradas.map(suc => (
          <div key={suc.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-all hover:-translate-y-1 relative group">
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 border border-blue-100 text-blue-600 p-3 rounded-2xl"><Store size={28}/></div>
              <div className="flex-1 pr-8">
                <h3 className="text-lg font-extrabold text-gray-800 leading-tight">{suc.nombre}</h3>
                <p className="text-xs text-gray-500 font-medium mt-1 h-8 line-clamp-2">{suc.direccion || 'Sin dirección registrada'}</p>
                <div className="mt-4 flex flex-col gap-1 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1"><Package size={14} className="text-gray-400"/> {suc.total_productos} prod. en catálogo</span>
                  <span className="flex items-center gap-1"><TrendingUp size={14} className="text-emerald-500"/> {suc.total_stock} un. stock físico</span>
                </div>
              </div>
            </div>
            <button onClick={() => handleDelete(suc.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Eliminar Sucursal"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/50 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2"><MapPin className="text-blue-600"/> Registrar Sucursal</h2>
              <button onClick={() => { setModalOpen(false); setErrorMsg(''); }} className="text-gray-400 hover:text-gray-800 bg-gray-100 p-2 rounded-full transition-colors"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nombre de Sucursal *</label>
                <input required autoFocus type="text" className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none font-bold text-gray-800 mt-1 transition-colors" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. Sede Norte"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dirección Completa</label>
                <input type="text" className="w-full border-2 border-gray-200 p-3 rounded-xl focus:border-blue-500 outline-none font-medium text-gray-600 mt-1 transition-colors" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} placeholder="Av. Principal 123..."/>
              </div>

              {/* ✨ CAPTURA DE COORDENADAS */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-bold text-blue-700 uppercase tracking-widest flex items-center gap-1"><Navigation size={12}/> Ubicación GPS</label>
                  <button type="button" onClick={obtenerCoordenadas} disabled={gpsLoading} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-1">
                    {gpsLoading ? 'Ubicando...' : '📍 Autodetectar'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Latitud" className="w-full border border-blue-200 p-2 rounded-lg outline-none text-xs font-mono text-gray-600" value={formData.latitud} onChange={e => setFormData({...formData, latitud: e.target.value})} />
                  <input type="text" placeholder="Longitud" className="w-full border border-blue-200 p-2 rounded-lg outline-none text-xs font-mono text-gray-600" value={formData.longitud} onChange={e => setFormData({...formData, longitud: e.target.value})} />
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl border border-red-100 flex items-center gap-2 mt-4">
                  <AlertOctagon size={16} className="flex-shrink-0"/> <span>{errorMsg}</span>
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 text-white font-black text-lg py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors mt-6 active:scale-95">
                Guardar Sucursal
              </button>
            </form>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="fixed bottom-10 right-10 z-[70] bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 font-bold animate-fade-in-up">
           <CheckCircle className="text-emerald-400" size={24}/> {successMsg}
        </div>
      )}
    </Layout>
  );
};
export default Sucursales;