import React, { useState, useEffect } from 'react';
import { UserPlus, X, CheckCircle } from 'lucide-react';
import api from '../../services/api'; 

const ClienteQuickRegisterModal = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombre_completo: '',
    documento_identidad: '',
    telefono: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFormData({ nombre_completo: '', documento_identidad: '', telefono: '' });
      setError('');
    }
  }, [open]);

  // ✨ FIX: Cerrar con Escape
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  // ✨ FIX: Cerrar al dar clic afuera
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre_completo) {
      setError('El nombre es obligatorio');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Tomar la sucursal actual del localStorage
      const sucursalActiva = JSON.parse(localStorage.getItem('sucursalActiva'));
      const sucursalId = sucursalActiva?.id && sucursalActiva.id !== 'ALL' ? sucursalActiva.id : null;

      const response = await api.post('/clientes', {
        ...formData,
        sucursal_id: sucursalId
      });
      
      onSave(response.data);
    } catch (err) {
      console.error(err);
      setError('Error al registrar el cliente. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onMouseDown={handleOverlayClick} className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in transition-colors duration-300">
      {/* ✨ FIX: Reducido a max-w-md para que no sea gigante */}
      <div className="bg-white/95 dark:bg-blue-950/90 backdrop-blur-3xl rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full sm:max-w-sm shadow-2xl flex flex-col animate-fade-in-up overflow-hidden border border-white/50 dark:border-white/10 transition-colors duration-300">
        
        <div className="px-5 py-4 border-b border-gray-100/50 dark:border-white/5 flex justify-between items-center bg-transparent shrink-0">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mt-2 sm:hidden z-20 absolute top-2 left-1/2 -translate-x-1/2"></div>
          <h2 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2 mt-3 sm:mt-0">
            <UserPlus className="text-blue-600 dark:text-blue-400" size={20}/> Nuevo Cliente
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-white bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-full transition-colors border border-transparent dark:border-white/5"><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[11px] font-bold p-3 rounded-xl border border-red-200 dark:border-red-500/30 text-center">
              {error}
            </div>
          )}

          <div>
            <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block">Nombre Completo *</label>
            <input
              type="text"
              required
              autoFocus
              value={formData.nombre_completo}
              onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
              className="w-full border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-blue-950/30 p-3 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-bold text-gray-800 dark:text-white transition-all shadow-sm"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block">DNI / RUC (Opcional)</label>
            <input
              type="text"
              value={formData.documento_identidad}
              onChange={(e) => setFormData({ ...formData, documento_identidad: e.target.value })}
              className="w-full border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-blue-950/30 p-3 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-bold text-gray-800 dark:text-white transition-all shadow-sm"
              placeholder="Documento para la boleta"
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-gray-500 dark:text-blue-300/70 uppercase tracking-widest mb-1.5 block">Teléfono (Opcional)</label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-blue-950/30 p-3 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-bold text-gray-800 dark:text-white transition-all shadow-sm"
              placeholder="Ej: 987654321"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 font-extrabold text-gray-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 border border-gray-200/80 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-sm shadow-sm backdrop-blur-md">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-3.5 font-black text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-slate-300 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm border border-transparent dark:border-white/10"
            >
              {loading ? 'Guardando...' : <><CheckCircle size={16}/> Guardar</>}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ClienteQuickRegisterModal;