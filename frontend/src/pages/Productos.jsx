import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { Plus, Edit, Trash2, X, AlertTriangle, Search, LayoutGrid, List, CheckCircle, Info, Image as ImageIcon, UploadCloud } from 'lucide-react';

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [puedeModificar, setPuedeModificar] = useState(true);
  const [categorias, setCategorias] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // Filtros, búsqueda y vistas
  const [filtroEstado, setFiltroEstado] = useState('activos');
  const [searchTerm, setSearchTerm] = useState('');
  const [orden, setOrden] = useState('recientes');
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'grid'

  // Notificaciones personalizadas (Toasts)
  const [toast, setToast] = useState(null);

  // Modales y formularios
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ 
    id: null, nombre: '', descripcion: '', imagen_url: '', codigo: '', precio: '', stock: '', categoria_id: '' 
  });
  const [productToDelete, setProductToDelete] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [tipoImagen, setTipoImagen] = useState('url'); // 'url' o 'archivo'
  const [archivoImagen, setArchivoImagen] = useState(null);

  // Referencia para el input de archivo JSON oculto
  const fileInputRef = useRef(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await api.get('/auth/me');
        const u = res.data;
        const cat = u.categorias || [];
        setPuedeModificar(u.rol === 'Administrador' || (Array.isArray(cat) && (cat.includes('Modificador') || cat.includes('Modificador_Inventario'))));
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
      showToast('error', 'Error al cargar los datos del servidor.');
      setProductos([]); setCategorias([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filtroEstado]);

  const productosFiltrados = productos
    .filter(prod => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return prod.nombre.toLowerCase().includes(term) || (prod.codigo && prod.codigo.toLowerCase().includes(term));
    })
    .sort((a, b) => {
      if (orden === 'alfabetico_asc') return a.nombre.localeCompare(b.nombre);
      if (orden === 'alfabetico_desc') return b.nombre.localeCompare(a.nombre);
      if (orden === 'recientes') return b.id - a.id;
      if (orden === 'antiguos') return a.id - b.id;
      return 0;
    });

  const openModal = (producto = null) => {
    setFormErrors({});
    setArchivoImagen(null);
    setTipoImagen('url'); // Por defecto
    if (producto) {
      setIsEditing(true);
      setFormData({ 
        id: producto.id, 
        nombre: producto.nombre || '', 
        descripcion: producto.descripcion || '', 
        imagen_url: producto.imagen || '', 
        codigo: producto.codigo || '', 
        precio: producto.precio || '', 
        stock: producto.stock || '', 
        categoria_id: producto.categoria_id || '' 
      });
    } else {
      setIsEditing(false);
      setFormData({ id: null, nombre: '', descripcion: '', imagen_url: '', codigo: '', precio: '', stock: '', categoria_id: '' });
    }
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (!formData.precio || isNaN(formData.precio) || Number(formData.precio) <= 0) errors.precio = 'Ingrese un precio válido';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = new FormData();
    submitData.append('nombre', formData.nombre);
    submitData.append('descripcion', formData.descripcion || '');
    submitData.append('precio', formData.precio);
    submitData.append('codigo', formData.codigo || '');
    submitData.append('categoria_id', formData.categoria_id || '');
    
    // El stock solo se envía al crear un producto nuevo
    if (!isEditing) submitData.append('stock', formData.stock || 0);

    // Archivo físico o URL
    if (tipoImagen === 'archivo' && archivoImagen) {
      submitData.append('imagen_archivo', archivoImagen);
    } else if (tipoImagen === 'url' && formData.imagen_url) {
      submitData.append('imagen_url', formData.imagen_url);
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      if (isEditing) {
        await api.put(`/productos/${formData.id}`, submitData, config);
        showToast('success', 'Producto actualizado correctamente');
      } else {
        await api.post('/productos', submitData, config);
        showToast('success', 'Producto creado con éxito');
      }
      setIsModalOpen(false);
      fetchData(); 
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Ocurrió un error inesperado";
      showToast('error', errorMsg);
    }
  };
  
  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/productos/${productToDelete.id}`);
      showToast('success', 'Producto movido a la papelera');
      setDeleteModalOpen(false);
      fetchData();
    } catch (error) {
      showToast('error', 'Error al eliminar el producto');
    }
  };

  // Función auxiliar para renderizar la imagen correctamente
  const renderizarImagen = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `http://localhost:3000${url}`;
  };

  // Lógica para leer y enviar el archivo JSON
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = JSON.parse(event.target.result);
        
        if (!Array.isArray(jsonContent)) {
          showToast('error', 'Formato incorrecto: El archivo debe contener una lista [] de productos.');
          return;
        }

        setLoading(true);
        // Enviamos el contenido validado al backend
        const res = await api.post('/productos/bulk', { productos: jsonContent });
        showToast('success', res.data.message);
        fetchData(); // Recargamos la tabla
        
      } catch (error) {
        showToast('error', error.response?.data?.error || 'Error al procesar el archivo JSON.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reseteamos el input
  };

  return (
    <Layout>
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg text-white animate-fade-in-down ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
          <p className="font-semibold">{toast.message}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Buscar..." className="w-full border p-2 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <select className="border p-2 rounded-lg outline-none cursor-pointer font-medium bg-white" value={orden} onChange={(e) => setOrden(e.target.value)}>
            <option value="recientes">Más recientes</option>
            <option value="antiguos">Más antiguos</option>
            <option value="alfabetico_asc">A - Z</option>
            <option value="alfabetico_desc">Z - A</option>
          </select>

          <select className="border p-2 rounded-lg outline-none cursor-pointer font-medium bg-white" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="activos">Activos</option>
            <option value="inactivos">Papelera</option>
            <option value="todos">Todos</option>
          </select>

          {/* Toggle de Vistas */}
          <div className="flex bg-gray-100 p-1 rounded-lg border">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}><List size={20}/></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid size={20}/></button>
          </div>

          {puedeModificar && (
            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current.click()} 
                className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-100 transition-colors"
                title="Subir archivo .json"
              >
                <UploadCloud size={20} /> Importar JSON
              </button>
              
              <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />

              <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                <Plus size={20} /> Nuevo
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12 text-gray-500 font-medium">Cargando datos del inventario...</div>
      ) : productosFiltrados.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
          <Info size={48} className="mx-auto mb-3 opacity-50" />
          No se encontraron productos en esta vista.
        </div>
      ) : viewMode === 'list' ? (
        /* VISTA LISTA (Tabla) */
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
            <table className="w-full text-left text-sm text-gray-600 table-fixed">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 w-[60px]">Img</th>
                  <th className="px-4 py-3 w-[25%]">Nombre</th>
                  <th className="px-4 py-3 w-[15%]">Categoría</th>
                  <th className="px-4 py-3 w-[12%]">Código</th>
                  <th className="px-4 py-3 w-[10%]">Precio</th>
                  <th className="px-4 py-3 w-[10%]">Stock</th>
                  <th className="px-4 py-3 text-center w-[15%]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {productosFiltrados.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 relative">
                      {prod.imagen ? (
                        <img src={renderizarImagen(prod.imagen)} alt={prod.nombre} className="w-10 h-10 object-cover rounded-md border" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 border rounded-md flex items-center justify-center text-gray-300"><ImageIcon size={20}/></div>
                      )}
                      {/* ETIQUETA AGOTADO EN LISTA */}
                      {(parseInt(prod.stock) === 0 || !prod.stock) && prod.estado && (
                         <div className="absolute top-1 -right-2 bg-orange-500 w-3 h-3 rounded-full border-2 border-white shadow-sm" title="Agotado"></div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900 truncate" title={prod.nombre}>{prod.nombre}</p>
                      <p className="text-xs text-gray-400 truncate w-full" title={prod.descripcion}>{prod.descripcion || 'Sin descripción'}</p>
                    </td>
                    <td className="px-4 py-3">{prod.categoria_nombre ? <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-xs font-bold">{prod.categoria_nombre}</span> : '-'}</td>
                    <td className="px-4 py-3 truncate">{prod.codigo || '-'}</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">S/ {parseFloat(prod.precio).toFixed(2)}</td>
                    <td className="px-4 py-3">
                       <span className={`border px-2 py-1 rounded-full text-xs font-bold ${parseInt(prod.stock) > 0 ? 'bg-gray-100 text-gray-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                         {prod.stock || 0} un.
                       </span>
                    </td>
                    <td className="px-4 py-3 flex justify-center gap-2">
                      {puedeModificar && (
                        <>
                          <button onClick={() => openModal(prod)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"><Edit size={18} /></button>
                          {prod.estado && <button onClick={() => {setProductToDelete(prod); setDeleteModalOpen(true);}} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"><Trash2 size={18} /></button>}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISTA GRID (Tarjetas) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {productosFiltrados.map((prod) => (
            <div key={prod.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group">
              <div className="h-40 bg-gray-100 relative">
                {prod.imagen ? (
                  <img src={renderizarImagen(prod.imagen)} alt={prod.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={48}/></div>
                )}
                
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {!prod.estado && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">INACTIVO</span>}
                  {(parseInt(prod.stock) === 0 || !prod.stock) && prod.estado && (
                    <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">AGOTADO</span>
                  )}
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-1">
                   <h3 className="font-bold text-gray-800 line-clamp-2 leading-tight flex-1">{prod.nombre}</h3>
                </div>
                <p className="text-xs text-gray-400 mb-2 line-clamp-2">{prod.descripcion || 'Sin descripción'}</p>
                
                <div className="mt-auto pt-3 flex justify-between items-end border-t border-dashed">
                  <div>
                     <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">{prod.codigo || 'S/C'}</p>
                     <p className="text-lg font-black text-emerald-600">S/ {parseFloat(prod.precio).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                     <span className={`text-xs font-bold px-2 py-1 rounded-lg ${parseInt(prod.stock) > 0 ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'}`}>
                       {prod.stock || 0} un.
                     </span>
                  </div>
                </div>
              </div>
              
              {/* Overlay de acciones on Hover */}
              {puedeModificar && (
                <div className="bg-gray-50 p-2 flex justify-end gap-2 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => openModal(prod)} className="p-2 bg-white text-blue-600 border rounded-lg shadow-sm hover:bg-blue-50"><Edit size={16} /></button>
                   {prod.estado && <button onClick={() => {setProductToDelete(prod); setDeleteModalOpen(true);}} className="p-2 bg-white text-red-500 border rounded-lg shadow-sm hover:bg-red-50"><Trash2 size={16} /></button>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR/EDITAR PRODUCTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl animate-fade-in-up my-auto">
            <div className="flex justify-between mb-6 border-b pb-3">
               <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">{isEditing ? <Edit className="text-blue-600"/> : <Plus className="text-blue-600"/>} {isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-1 rounded-full"><X/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-1/2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nombre *</label>
                  <input placeholder="Ej: Laptop Lenovo" className={`w-full border p-3 rounded-xl mt-1 outline-none focus:ring-2 ${formErrors.nombre ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`} value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
                  {formErrors.nombre && <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>}
                </div>
                <div className="w-full md:w-1/2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
                  <select className="w-full border p-3 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={formData.categoria_id} onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}>
                    <option value="">-- Sin categoría --</option>
                    {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
                <textarea rows="2" placeholder="Detalles del producto..." className="w-full border p-3 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500 resize-none" value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})}></textarea>
              </div>

              {/* SECCIÓN DE IMAGEN MEJORADA */}
              <div className="border p-4 rounded-xl bg-gray-50">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-3">Imagen del Producto</label>
                
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="tipo_img" checked={tipoImagen === 'url'} onChange={() => setTipoImagen('url')} className="text-blue-600 focus:ring-blue-500" />
                    Pegar Link (URL)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="tipo_img" checked={tipoImagen === 'archivo'} onChange={() => setTipoImagen('archivo')} className="text-blue-600 focus:ring-blue-500" />
                    Subir desde PC/Celular
                  </label>
                </div>

                {tipoImagen === 'url' ? (
                  <input placeholder="https://ejemplo.com/imagen.jpg" className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all" value={formData.imagen_url} onChange={(e) => setFormData({...formData, imagen_url: e.target.value})} />
                ) : (
                  <input type="file" accept="image/*" className="w-full border p-2 rounded-xl bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer transition-all" onChange={(e) => setArchivoImagen(e.target.files[0])} />
                )}
              </div>

              <div className="flex gap-4">
                <div className="w-1/3">
                   <label className="text-xs font-bold text-gray-500 uppercase">SKU / Código</label>
                   <input placeholder="PROD-001" className="w-full border p-3 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500" value={formData.codigo} onChange={(e) => setFormData({...formData, codigo: e.target.value})} />
                </div>
                <div className="w-1/3">
                   <label className="text-xs font-bold text-gray-500 uppercase">Precio (S/) *</label>
                   <input type="number" step="0.01" placeholder="0.00" className={`w-full border p-3 rounded-xl mt-1 outline-none focus:ring-2 ${formErrors.precio ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`} value={formData.precio} onChange={(e) => setFormData({...formData, precio: e.target.value})} />
                </div>
                {!isEditing && (
                  <div className="w-1/3">
                     <label className="text-xs font-bold text-gray-500 uppercase">Stock</label>
                     <input type="number" placeholder="Ej: 10" className="w-full border p-3 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-blue-500" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30">Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {deleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-fade-in-up">
              <div className="mx-auto w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={32}/></div>
              <h3 className="text-xl font-extrabold mb-2 text-gray-800">¿Eliminar Producto?</h3>
              <p className="text-sm text-gray-500 mb-6">Se enviará a la papelera el producto <strong>"{productToDelete.nombre}"</strong>.</p>
              <div className="flex gap-3">
                 <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-3 border rounded-xl font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
                 <button onClick={handleDelete} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/30">Sí, Eliminar</button>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default Productos;