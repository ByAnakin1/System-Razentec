import { Package, ShoppingCart, ShoppingBag, Users, Truck, UserCog } from 'lucide-react';

/**
 * Mapeo: nombre de categoría (BD) → ruta, etiqueta e icono del menú
 * El menú lateral se construye dinámicamente según las categorías del usuario
 * Modificador NO es un dashboard, es un permiso.
 */
export const CATEGORIA_A_RUTA = {
  Inventario: { path: '/productos', label: 'Inventario', Icon: Package },
  Ventas: { path: '/ventas', label: 'Ventas', Icon: ShoppingCart },
  Compras: { path: '/compras', label: 'Compras', Icon: ShoppingBag },
  Clientes: { path: '/clientes', label: 'Clientes', Icon: Users },
  Proveedores: { path: '/proveedores', label: 'Proveedores', Icon: Truck },
  Usuarios: { path: '/usuarios', label: 'Usuarios', Icon: UserCog },
};
