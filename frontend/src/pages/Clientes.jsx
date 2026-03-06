import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Users, Search, Plus, Edit, Trash2, X, AlertTriangle } from 'lucide-react';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDelete, setModalDelete] = useState(null);
  const [formData, setFormData] = useState({ id: null, nombre_completo: '', documento_identidad: '', email: '', telefono: '', direccion: '' });
  
  // Estado para manejo de errores visuales
  const [errores, setErrores] = useState({});

  const fetchClientes = async () => {
    try {
      const res = await api.get('/clientes');
      setClientes(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClientes(); }, []);

  // ✨ VALIDACIÓN LÓGICA ESTRICTA
  const validarFormulario = () => {
    let nuevosErrores = {};

    if (!formData.nombre_completo.trim()) {
      nuevosErrores.nombre_completo = "El nombre es obligatorio.";
    }
    
    // Validación estricta de DNI (Exactamente 8 dígitos)
    if (formData.documento_identidad && formData.documento_identidad.length !== 8) {
      nuevosErrores.documento_identidad = "El DNI debe tener exactamente 8 dígitos.";
    }

    // Validación estricta de Teléfono (Exactamente 9 dígitos)
    if (formData.telefono && formData.telefono.length !== 9) {
      nuevosErrores.telefono = "El número de teléfono debe tener exactamente 9 dígitos.";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0; // Si no hay errores, retorna true
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Detenemos el guardado si no pasa las validaciones
    if (!validarFormulario()) return;

    try {
      if (formData.id) {
        await api.put(`/clientes/${formData.id}`, formData);
      } else {
        await api.post('/clientes', formData);
      }
      setModalOpen(false);
      fetchClientes();
    } catch (error) {
      alert("Error al guardar el cliente.");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/clientes/${modalDelete.id}`);
      setModalDelete(null);
      fetchClientes();
    } catch (error) {
      alert(error.response?.data?.error || "Error al eliminar");
      setModalDelete(null);
    }
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) || 
    (c.documento_identidad || '').includes(busqueda)
  );

  const openModal = (cliente = null) => {
    if (cliente) {
      setFormData(cliente);
    } else {
      setFormData({ id: null, nombre_completo: '', documento_identidad: '', email: '', telefono: '', direccion: '' });
    }
    setErrores({}); // Limpiamos errores pasados al abrir
    setModalOpen(true);
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2 text-gray-800"><Users className="text-blue-600"/> Cartera de Clientes</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Administra tu base de datos de compradores.</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
            <input type="text" placeholder="Buscar por nombre o DNI..." className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <button onClick={() => openModal()} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 transition-all flex-shrink-0">
            <Plus size={18}/> Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase font-extrabold tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4 border-b border-gray-100">Nombre / Razón Social</th>
              <th className="px-6 py-4 border-b border-gray-100">Documento (DNI)</th>
              <th className="px-6 py-4 border-b border-gray-100">Contacto</th>
              <th className="px-6 py-4 border-b border-gray-100 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <tr><td colSpan="4" className="text-center py-10 text-gray-500 font-medium">Cargando...</td></tr> : 
             clientesFiltrados.length === 0 ? <tr><td colSpan="4" className="text-center py-10 text-gray-400 italic">No hay clientes registrados.</td></tr> :
             clientesFiltrados.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-800">{c.nombre_completo}</td>
                <td className="px-6 py-4 text-slate-600 font-medium">{c.documento_identidad || '---'}</td>
                <td className="px-6 py-4">
                  <p className="text-xs text-slate-600 mb-0.5">{c.telefono || 'Sin teléfono'}</p>
                  <p className="text-[10px] text-slate-400">{c.email || 'Sin correo'}</p>
                </td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => openModal(c)} className="p-2 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors mr-2"><Edit size={16}/></button>
                  <button onClick={() => setModalDelete(c)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Crear/Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/50 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-gray-800">{formData.id ? 'Editar Cliente' : 'Registrar Cliente'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-800 bg-gray-100 p-2 rounded-full"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Nombre Completo *</label>
                <input 
                  type="text" 
                  required 
                  className={`w-full border p-3 rounded-xl focus:ring-2 outline-none font-medium mt-1 ${errores.nombre_completo ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'}`} 
                  value={formData.nombre_completo} 
                  onChange={e => {
                    // BLOQUEO FÍSICO: Solo permite letras, acentos y espacios
                    setFormData({...formData, nombre_completo: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')});
                    if (errores.nombre_completo) setErrores({...errores, nombre_completo: null});
                  }} 
                />
                {errores.nombre_completo && <p className="text-[10px] text-red-500 mt-1 font-bold">{errores.nombre_completo}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  {/* ✨ ETIQUETA CORREGIDA A SOLO DNI */}
                  <label className="text-[10px] font-bold text-gray-500 uppercase">DNI</label>
                  <input 
                    type="text" 
                    className={`w-full border p-3 rounded-xl focus:ring-2 outline-none font-medium mt-1 tracking-wider ${errores.documento_identidad ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'}`} 
                    value={formData.documento_identidad} 
                    onChange={e => {
                      // ✨ BLOQUEO FÍSICO: Solo números y CORTA EXACTAMENTE EN 8 CARACTERES
                      setFormData({...formData, documento_identidad: e.target.value.replace(/\D/g, '').slice(0, 8)});
                      if (errores.documento_identidad) setErrores({...errores, documento_identidad: null});
                    }} 
                  />
                  {errores.documento_identidad && <p className="text-[10px] text-red-500 mt-1 font-bold leading-tight">{errores.documento_identidad}</p>}
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Teléfono</label>
                  <input 
                    type="text" 
                    className={`w-full border p-3 rounded-xl focus:ring-2 outline-none font-medium mt-1 tracking-wider ${errores.telefono ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'}`} 
                    value={formData.telefono} 
                    onChange={e => {
                      // ✨ BLOQUEO FÍSICO: Solo números y CORTA EXACTAMENTE EN 9 CARACTERES
                      setFormData({...formData, telefono: e.target.value.replace(/\D/g, '').slice(0, 9)});
                      if (errores.telefono) setErrores({...errores, telefono: null});
                    }} 
                  />
                  {errores.telefono && <p className="text-[10px] text-red-500 mt-1 font-bold leading-tight">{errores.telefono}</p>}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase">Dirección</label>
                <input 
                  type="text" 
                  className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium mt-1" 
                  value={formData.direccion} 
                  onChange={e => setFormData({...formData, direccion: e.target.value})} 
                />
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors mt-6">
                Guardar Cliente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {modalDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-fade-in-up">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 border-4 border-red-100 mb-6 text-red-500"><AlertTriangle size={32}/></div>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">¿Eliminar Cliente?</h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Borrarás a <b>{modalDelete.nombre_completo}</b>. Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setModalDelete(null)} className="flex-1 border-2 border-gray-200 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/30">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Clientes;