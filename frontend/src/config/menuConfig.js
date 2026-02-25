import { LayoutDashboard, Package, Tags, ShoppingCart, ShoppingBag, Users, Truck, ShieldAlert, History } from 'lucide-react';

export const CATEGORIA_A_RUTA = {
  'Dashboard': { path: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  'Inventario': { path: '/inventario', label: 'Inventario', Icon: Package },
  'Categorias': { path: '/categorias', label: 'Categorías', Icon: Tags },
  
  'Ventas': { path: '/ventas', label: 'POS / Ventas', Icon: ShoppingCart },
  // ✨ AQUÍ AGREGAMOS EL HISTORIAL OFICIALMENTE
  'Historial': { path: '/historial-ventas', label: 'Historial Ventas', Icon: History }, 
  
  'Compras': { path: '/compras', label: 'Compras', Icon: ShoppingBag },
  'Clientes': { path: '/clientes', label: 'Clientes', Icon: Users },
  'Proveedores': { path: '/proveedores', label: 'Proveedores', Icon: Truck },
  'Usuarios': { path: '/usuarios', label: 'Usuarios', Icon: ShieldAlert }
};