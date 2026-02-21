import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Plus, Edit, Trash2, X, AlertTriangle, Filter, Tag } from 'lucide-react';

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [puedeModificar, setPuedeModificar] = useState(true);
  const [categorias, setCategorias] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('activos');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ id: null, nombre: '', codigo: '', precio: '', stock: '', categoria_id: '' });
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await api.get('/auth/me');
        const u = res.data;
        const cat = u.categorias || [];
        const puede = u.rol === 'Administrador' || (Array.isArray(cat) && (cat.includes('Modificador') || cat.includes('Modificador_Inventario')));
        setPuedeModificar(puede);
      } catch {
        setPuedeModificar(true);
      }
    };
    loadMe();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get(`/productos?estado=${filtroEstado}`),
        api.get('/categorias?estado=activos') 
      ]);
      setProductos(prodRes.data);
      setCategorias(catRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filtroEstado]);

  const openModal = (producto = null) => {
    if (producto) {
      setIsEditing(true);
      setFormData({ 
        id: producto.id, nombre: producto.nombre, codigo: producto.codigo, 
        precio: producto.precio, stock: producto.stock, categoria_id: producto.categoria_id || '' 
      });
    } else {
      setIsEditing(false);
      setFormData({ id: null, nombre: '', codigo: '', precio: '', stock: '', categoria_id: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) await api.put(`/productos/${formData.id}`, formData);
      else await api.post('/productos', formData);
      setIsModalOpen(false);
      fetchData(); 
    } catch (error) {
      alert("Error al guardar");
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/productos/${productToDelete.id}`);
      setDeleteModalOpen(false);
      fetchData();
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
        <div className="flex gap-3">
          <select className="border p-2 rounded" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="activos">Activos</option>
            <option value="inactivos">Papelera</option>
            <option value="todos">Todos</option>
          </select>
          {puedeModificar && (
            <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"><Plus size={20} /> Nuevo</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
          <table className="w-full text-left text-sm text-gray-600 table-fixed">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold sticky top-0">
              <tr>
                <th className="px-4 py-3 w-[25%] max-w-[200px]">Nombre</th>
                <th className="px-4 py-3 w-[15%] max-w-[120px]">Categoría</th>
                <th className="px-4 py-3 w-[12%]">SKU</th>
                <th className="px-4 py-3 w-[10%]">Precio</th>
                <th className="px-4 py-3 w-[10%]">Stock</th>
                <th className="px-4 py-3 w-[10%]">Estado</th>
                <th className="px-4 py-3 text-center w-[18%]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? <tr><td colSpan="7" className="text-center p-8">Cargando...</td></tr> : 
               productos.map((prod) => (
                <tr key={prod.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 truncate">{prod.nombre}</td>
                  <td className="px-4 py-3 max-w-[120px]">
                    {prod.categoria_nombre ? (
                      <span className="inline-block bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold truncate w-full" title={prod.categoria_nombre}>
                        {prod.categoria_nombre}
                      </span>
                    ) : <span className="text-gray-400 text-xs">Sin Cat.</span>}
                  </td>
                  <td className="px-4 py-3 truncate">{prod.codigo || '-'}</td>
                  <td className="px-4 py-3 text-green-600 font-bold">S/ {parseFloat(prod.precio).toFixed(2)}</td>
                  <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{prod.stock} un.</span></td>
                  <td className="px-4 py-3">{prod.estado ? <span className="text-green-600 text-xs font-bold">Activo</span> : <span className="text-red-500 text-xs font-bold">Inactivo</span>}</td>
                  <td className="px-4 py-3 flex justify-center gap-3">
                    {puedeModificar ? (
                      <>
                        <button onClick={() => openModal(prod)} className="text-blue-600"><Edit size={18} /></button>
                        {prod.estado && <button onClick={() => {setProductToDelete(prod); setDeleteModalOpen(true);}} className="text-red-500"><Trash2 size={18} /></button>}
                      </>
                    ) : <span className="text-gray-400 text-xs">Lectura</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR/EDITAR PRODUCTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select className="w-full border p-2 rounded" value={formData.categoria_id} onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}>
                <option value="">Seleccione una categoría...</option>
                {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
              </select>
              <input placeholder="Nombre" className="w-full border p-2 rounded" required value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
              <div className="flex gap-4">
                <input placeholder="SKU" className="w-1/2 border p-2 rounded" value={formData.codigo} onChange={(e) => setFormData({...formData, codigo: e.target.value})} />
                <input type="number" step="0.01" placeholder="Precio" className="w-1/2 border p-2 rounded" required value={formData.precio} onChange={(e) => setFormData({...formData, precio: e.target.value})} />
              </div>
              {!isEditing && <input type="number" placeholder="Stock Inicial" className="w-full border p-2 rounded" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />}
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border p-2 rounded">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {deleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
           <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
              <h3 className="text-lg font-bold mb-4">¿Eliminar {productToDelete.nombre}?</h3>
              <div className="flex gap-3">
                 <button onClick={() => setDeleteModalOpen(false)} className="flex-1 border px-4 py-2 rounded">No</button>
                 <button onClick={handleDelete} className="flex-1 bg-red-600 text-white px-4 py-2 rounded">Sí</button>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};
export default Productos;