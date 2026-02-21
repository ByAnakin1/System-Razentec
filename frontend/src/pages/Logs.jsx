import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Activity, User, Filter } from 'lucide-react';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [accesoDenegado, setAccesoDenegado] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = filtroUsuario ? { usuario_id: filtroUsuario } : {};
      const res = await api.get('/logs', { params });
      setLogs(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setAccesoDenegado(true);
        setLogs([]);
      } else {
        setAccesoDenegado(false);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const res = await api.get('/usuarios');
      setUsuarios(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filtroUsuario]);

  const formatearFecha = (d) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleString('es-PE');
  };

  const badgeAccion = (a) => {
    const col = a === 'GET' ? 'bg-gray-100 text-gray-700' : a === 'POST' ? 'bg-green-100 text-green-700' : a === 'PUT' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700';
    return <span className={`px-2 py-0.5 rounded text-xs font-bold ${col}`}>{a}</span>;
  };

  if (accesoDenegado) {
    return (
      <Layout>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800 font-medium">Solo el Administrador puede ver la auditoría.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Activity size={24} className="text-blue-600" /> Auditoría
        </h1>
        <div className="relative">
          <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <select
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white outline-none cursor-pointer"
            value={filtroUsuario}
            onChange={(e) => setFiltroUsuario(e.target.value)}
          >
            <option value="">Todos los usuarios</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>{u.nombre_completo} ({u.rol})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Usuario</th>
                <th className="px-6 py-3">Rol</th>
                <th className="px-6 py-3">Acción</th>
                <th className="px-6 py-3">Módulo</th>
                <th className="px-6 py-3">Tabla</th>
                <th className="px-6 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center">Cargando...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center">No hay registros.</td></tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{l.nombre_completo}</span>
                      <span className="block text-xs text-gray-500">{l.email}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{l.rol}</td>
                    <td className="px-6 py-4">{badgeAccion(l.accion)}</td>
                    <td className="px-6 py-4 text-gray-600">{l.modulo || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{l.tabla_afectada || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{formatearFecha(l.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Logs;
