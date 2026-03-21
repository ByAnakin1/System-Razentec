import React, { useState } from 'react';
import { X, UserPlus, FileText, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const ClienteQuickRegisterModal = ({ open, onClose, onSave }) => {
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setDni(''); setNombre(''); setDireccion(''); setError('');
  };

  const handleClose = () => {
    reset(); onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const n = nombre.trim();
    if (!n) { setError('El nombre es obligatorio.'); return; }
    setLoading(true); setError('');
    try {
      const usuarioLocal = JSON.parse(localStorage.getItem('usuario') || '{}');
      const response = await api.post('/clientes', {
        nombre_completo: n,
        documento_identidad: dni.trim() || null,
        direccion: direccion.trim() || null,
        empresa_id: usuarioLocal.empresa_id || null
      });
      onSave({
        id: response.data.id, 
        nombre: response.data.nombre_completo,
        dni: response.data.documento_identidad
      });
      reset(); onClose();
    } catch (err) {
      setError('Hubo un error al guardar el cliente en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md transition-colors animate-fade-in" onClick={handleClose}>
      <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-3xl sm:rounded-[2.5rem] shadow-2xl border border-white/50 dark:border-white/10 w-full sm:max-w-sm flex flex-col animate-fade-in-up overflow-hidden max-h-[95vh] pb-6 sm:pb-0 transition-colors" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mt-4 mb-2 sm:hidden shrink-0"></div>

        <div className="px-6 py-4 border-b border-gray-100/50 dark:border-white/5 flex justify-between items-center bg-transparent shrink-0 transition-colors">
          <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2 tracking-tight">
            <UserPlus size={20} className="text-blue-600 dark:text-blue-400"/> Nuevo Cliente
          </h3>
          <button type="button" onClick={handleClose} className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors border border-transparent dark:border-white/5">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 transition-colors"><FileText size={12}/> DNI / RUC</label>
            <input type="text" value={dni} onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="Ej. 12345678" className="w-full px-4 py-3 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/80 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none text-sm font-bold text-gray-800 dark:text-white transition-all shadow-sm" />
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block transition-colors">Nombre Completo *</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''))} placeholder="Nombres y Apellidos" className="w-full px-4 py-3 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/80 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none text-sm font-bold text-gray-800 dark:text-white transition-all shadow-sm" required />
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block transition-colors">Dirección (Opcional)</label>
            <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Ej. Av. Principal 123" className="w-full px-4 py-3 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/80 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none text-sm font-bold text-gray-800 dark:text-white transition-all shadow-sm" />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50/80 dark:bg-red-900/30 backdrop-blur-md text-red-600 dark:text-red-400 rounded-xl text-[11px] font-bold flex items-center justify-center text-center animate-fade-in border border-red-100/50 dark:border-red-500/20 shadow-sm transition-colors">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={handleClose} className="flex-1 py-3.5 border border-gray-200/80 dark:border-white/5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl font-extrabold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm shadow-sm">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3.5 bg-blue-600/90 dark:bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-600/20 dark:shadow-blue-900/40 text-sm flex justify-center items-center gap-2 border border-transparent dark:border-white/10 backdrop-blur-md disabled:opacity-50">
              {loading ? <span className="animate-pulse">Guardando...</span> : <><CheckCircle size={16} /> Guardar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteQuickRegisterModal;