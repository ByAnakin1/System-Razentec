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
      setProductos(Array.isArray(prodRes.data) ? prodRes.data : []);
      setCategorias(Array.isArray(catRes.data) ? catRes.data : []);
    } catch (error) {
      console.error(error);
      setProductos([]); 
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filtroEstado]);

  const openModal = (producto = null) => {
    if (producto) {
      setIsEditing(true);
      setFormData({ 
        id: producto.id, nombre: producto.nombre, codigo: producto.codigo || '', 
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
      alert("Error al guardar el producto");
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
          <select className="border p-2 rounded outline-none cursor-pointer font-medium" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="activos">Activos</option>
            <option value="inactivos">Papelera</option>
            <option value="todos">Todos</option>
          </select>
          {puedeModificar && (
            <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"><Plus size={20} /> Nuevo Producto</button>
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
                <th className="px-4 py-3 w-[12%]">SKU / Código</th>
                <th className="px-4 py-3 w-[10%]">Precio</th>
                <th className="px-4 py-3 w-[10%]">Stock</th>
                <th className="px-4 py-3 w-[10%]">Estado</th>
                <th className="px-4 py-3 text-center w-[18%]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? <tr><td colSpan="7" className="text-center p-8">Cargando datos...</td></tr> : 
               productos.length === 0 ? <tr><td colSpan="7" className="text-center p-8 text-gray-400">No hay productos registrados en esta vista.</td></tr> :
               productos.map((prod) => (
                <tr key={prod.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 truncate" title={prod.nombre}>{prod.nombre}</td>
                  <td className="px-4 py-3 max-w-[120px]">
                    {prod.categoria_nombre ? (
                      <span className="inline-block bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-xs font-bold truncate w-full" title={prod.categoria_nombre}>
                        {prod.categoria_nombre}
                      </span>
                    ) : <span className="text-gray-400 text-xs italic">Sin Categoría</span>}
                  </td>
                  <td className="px-4 py-3 truncate">{prod.codigo || '-'}</td>
                  
                  {/* SOLUCIÓN AL NaN: Si el precio no es un número válido, muestra 0.00 */}
                  <td className="px-4 py-3 text-emerald-600 font-bold">
                    S/ {prod.precio && !isNaN(parseFloat(prod.precio)) ? parseFloat(prod.precio).toFixed(2) : '0.00'}
                  </td>

                  <td className="px-4 py-3"><span className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded-full text-xs font-bold">{prod.stock || 0} un.</span></td>
                  <td className="px-4 py-3">{prod.estado ? <span className="text-emerald-600 text-xs font-bold">Activo</span> : <span className="text-red-500 text-xs font-bold">Inactivo</span>}</td>
                  <td className="px-4 py-3 flex justify-center gap-3">
                    {puedeModificar ? (
                      <>
                        <button onClick={() => openModal(prod)} className="text-yellow-600 hover:bg-yellow-50 p-1.5 rounded transition-colors"><Edit size={18} /></button>
                        {prod.estado && <button onClick={() => {setProductToDelete(prod); setDeleteModalOpen(true);}} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"><Trash2 size={18} /></button>}
                      </>
                    ) : <span className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mt-1">Solo Lectura</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR/EDITAR PRODUCTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-fade-in-up">
            <div className="flex justify-between mb-6 border-b pb-3">
               <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">{isEditing ? <Edit className="text-yellow-500"/> : <Plus className="text-blue-600"/>} {isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full"><X/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
                <select className="w-full border p-3 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.categoria_id} onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}>
                  <option value="">-- Sin categoría --</option>
                  {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Nombre del Producto</label>
                <input placeholder="Ej: Laptop Lenovo..." className="w-full border p-3 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500" required value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                   <label className="text-xs font-bold text-gray-500 uppercase">SKU / Código</label>
                   <input placeholder="PROD-001" className="w-full border p-3 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500" value={formData.codigo} onChange={(e) => setFormData({...formData, codigo: e.target.value})} />
                </div>
                <div className="w-1/2">
                   <label className="text-xs font-bold text-gray-500 uppercase">Precio (S/)</label>
                   <input type="number" step="0.01" placeholder="0.00" className="w-full border p-3 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500" required value={formData.precio} onChange={(e) => setFormData({...formData, precio: e.target.value})} />
                </div>
              </div>
              {!isEditing && (
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Stock Inicial</label>
                    <input type="number" placeholder="Ej: 10" className="w-full border p-3 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
                 </div>
              )}
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {deleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-fade-in-up">
              <div className="mx-auto w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={32}/></div>
              <h3 className="text-xl font-extrabold mb-2 text-gray-800">¿Eliminar Producto?</h3>
              <p className="text-sm text-gray-500 mb-6">Se enviará a la papelera el producto <strong>"{productToDelete.nombre}"</strong>.</p>
              <div className="flex gap-3">
                 <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-3 border rounded-xl font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
                 <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700">Sí, Eliminar</button>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};
export default Productos;