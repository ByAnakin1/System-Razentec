import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';

/**
 * Modal de registro rápido: DNI, Nombre, Dirección.
 * Al guardar devuelve el nuevo cliente y cierra.
 */
const ClienteQuickRegisterModal = ({ open, onClose, onSave }) => {
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setDni('');
    setNombre('');
    setDireccion('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const n = nombre.trim();
    if (!n) {
      setError('El nombre es obligatorio.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // 1. Obtenemos el ID de tu empresa
      const usuarioLocal = JSON.parse(localStorage.getItem('usuario') || '{}');
      
      // 2. Lo guardamos en la Base de Datos REAL
      const response = await api.post('/clientes', {
        nombre: n,
        dni: dni.trim() || null,
        empresa_id: usuarioLocal.empresa_id || null
      });

      // 3. Pasamos el ID real que nos devuelve la base de datos
      onSave({
        id: response.data.id, 
        nombre: response.data.nombre,
        dni: response.data.dni
      });
      
      reset();
      onClose();
    } catch (err) {
      console.error("Error al guardar cliente:", err);
      setError('Hubo un error al guardar el cliente en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={handleClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Registro rápido de cliente</h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
            <input
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ej. 12345678"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej. Av. Principal 123"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteQuickRegisterModal;
