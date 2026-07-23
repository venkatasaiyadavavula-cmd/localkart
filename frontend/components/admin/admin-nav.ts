import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  Users,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

export const adminNavItems: AdminNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Store, label: 'Sellers', href: '/admin/sellers' },
  { icon: Package, label: 'Products', href: '/admin/products' },
  { icon: ShoppingBag, label: 'Orders', href: '/admin/orders' },
  { icon: DollarSign, label: 'Commissions', href: '/admin/commissions' },
  { icon: AlertTriangle, label: 'Disputes', href: '/admin/disputes' },
  { icon: Users, label: 'Customers', href: '/admin/customers' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];
