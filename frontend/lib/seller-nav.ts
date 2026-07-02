import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Settings,
  Zap,
  Users,
  BarChart2,
  IndianRupee,
  Upload,
} from 'lucide-react';

export const sellerNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Package, label: 'Products', href: '/dashboard/products' },
  { icon: ShoppingBag, label: 'Orders', href: '/dashboard/orders' },
  { icon: Zap, label: "Today's Offers", href: '/dashboard/offers' },
  { icon: TrendingUp, label: 'Ads', href: '/dashboard/ads' },
  { icon: IndianRupee, label: 'Commission', href: '/dashboard/commission' },
  { icon: BarChart2, label: 'Earnings', href: '/dashboard/earnings' },
  { icon: Users, label: 'Staff', href: '/dashboard/staff' },
  { icon: Upload, label: 'Bulk Upload', href: '/dashboard/products/bulk-upload' },
  { icon: CreditCard, label: 'Subscription', href: '/dashboard/subscription' },
  { icon: Settings, label: 'Shop Settings', href: '/dashboard/shop-settings' },
] as const;
