'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Package, ShoppingBag, DollarSign,
  ArrowUp, ArrowDown, Clock, ChevronRight, Plus,
  Zap, Bell, BarChart3, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useSellerDashboard } from '@/hooks/use-seller-dashboard';
import { useShop } from '@/hooks/use-shop';
import { SalesChart } from '@/components/seller/sales-chart';
import { RecentOrders } from '@/components/seller/recent-orders';
import { TopProducts } from '@/components/seller/top-products';
import { ShopOpenBadge } from '@/components/shop/shop-open-badge';
import { formatPrice, formatNumber } from '@/lib/utils';
import type { ManualOverride } from '@/types/shop-hours';
import { WeeklyEarningsPopup } from '@/components/seller/weekly-earnings-popup';

export default function SellerDashboardPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const { data, isLoading, isError, refetch } = useSellerDashboard(period);
  const { data: shop, toggleShop, isToggling } = useShop(undefined, { sellerShop: true });

  const pendingOrders = data?.pendingOrders || 0;
  const lowStockProducts = data?.lowStockProducts || 0;
  const isCurrentlyOpen = shop?.isCurrentlyOpen ?? data?.isCurrentlyOpen ?? false;
  const statusMessage = shop?.statusMessage ?? data?.statusMessage ?? '';

  const handleShopToggle = async (open: boolean) => {
    const manualOverride: ManualOverride = open ? 'force_open' : 'force_closed';
    try {
      await toggleShop(manualOverride);
      toast.success(open ? 'Shop is now open' : 'Shop is now closed');
    } catch {
      toast.error('Failed to update shop status');
    }
  };

  const stats = [
    {
      title: 'Revenue',
      value: formatPrice(data?.totalRevenue || 0),
      change: data?.revenueChange || 0,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Orders',
      value: formatNumber(data?.totalOrders || 0),
      change: data?.ordersChange || 0,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Sold',
      value: formatNumber(data?.productsSold || 0),
      change: data?.productsSoldChange || 0,
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Products',
      value: formatNumber(data?.activeProducts || 0),
      change: data?.activeProductsChange || 0,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <WeeklyEarningsPopup />

      <Link
        href="/dashboard/staff"
        className="mx-4 mt-4 block overflow-hidden rounded-2xl border-0 text-white transition-transform hover:scale-[1.01]"
        style={{ background: 'linear-gradient(135deg,#7C3AED,#4F46E5)', boxShadow: '0 8px 32px rgba(124,58,237,0.30)' }}
      >
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Team Management</p>
            <p className="mt-0.5 text-lg font-black" style={{ fontFamily: 'var(--font-display)' }}>
              Add Employees
            </p>
            <p className="mt-1 text-xs text-white/80">Up to 5 team members · custom login IDs</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl">
            👥
          </div>
        </div>
      </Link>

      <div className="bg-white border-b px-4 pt-4 pb-3 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              👋 {data?.shopName || shop?.name || 'My Shop'}
            </h1>
            <p className="text-xs text-gray-500">Here&apos;s your store overview</p>
          </div>
          <Link href="/dashboard/products/new">
            <button className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-3 py-2 rounded-xl">
              <Plus className="h-3.5 w-3.5" /> Add Product
            </button>
          </Link>
        </div>

        <Tabs value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month' | 'year')}>
          <TabsList className="w-full h-9 rounded-xl">
            <TabsTrigger value="week" className="flex-1 rounded-lg text-xs">This Week</TabsTrigger>
            <TabsTrigger value="month" className="flex-1 rounded-lg text-xs">This Month</TabsTrigger>
            <TabsTrigger value="year" className="flex-1 rounded-lg text-xs">This Year</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            isCurrentlyOpen
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Clock className={`h-4 w-4 ${isCurrentlyOpen ? 'text-green-600' : 'text-red-600'}`} />
                <p className={`text-sm font-bold ${isCurrentlyOpen ? 'text-green-800' : 'text-red-800'}`}>
                  {isCurrentlyOpen ? 'Shop is Open' : 'Shop is Closed'}
                </p>
                <ShopOpenBadge isOpen={isCurrentlyOpen} />
              </div>
              <p className={`text-xs ${isCurrentlyOpen ? 'text-green-700' : 'text-red-700'}`}>
                {statusMessage || (isCurrentlyOpen ? 'Accepting orders now' : 'Tap to reopen your shop')}
              </p>
            </div>
            <Switch
              checked={isCurrentlyOpen}
              onCheckedChange={handleShopToggle}
              disabled={isToggling}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
          {shop?.manualOverride && shop.manualOverride !== 'none' && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Manual override active —{' '}
              <Link href="/dashboard/shop-settings" className="underline">
                edit weekly schedule
              </Link>
            </p>
          )}
        </div>

        {(pendingOrders > 0 || lowStockProducts > 0) && (
          <div className="space-y-2">
            {pendingOrders > 0 && (
              <Link href="/dashboard/orders">
                <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl p-3.5">
                  <div className="bg-orange-500 text-white w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-orange-800">
                      🔔 {pendingOrders} order{pendingOrders > 1 ? 's' : ''} need attention!
                    </p>
                    <p className="text-xs text-orange-600">OTP confirm or accept new orders</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-orange-400" />
                </div>
              </Link>
            )}
            {lowStockProducts > 0 && (
              <Link href="/dashboard/products">
                <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-3.5">
                  <div className="bg-red-500 text-white w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-800">
                      ⚠️ {lowStockProducts} products low stock
                    </p>
                    <p className="text-xs text-red-600">Update stock before running out</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-red-400" />
                </div>
              </Link>
            )}
          </div>
        )}

        <Link href="/dashboard/offers">
          <div
            className="relative overflow-hidden rounded-2xl p-4 text-white"
            style={{
              background: 'linear-gradient(135deg,#EA580C,#FF6B35)',
              boxShadow: '0 12px 32px -12px rgba(234,88,12,0.45)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-orange-100">Boost Sales</p>
                <p className="text-xl font-black leading-tight" style={{ fontFamily: 'var(--font-display,Syne,sans-serif)' }}>
                  DAILY OFFERS
                </p>
                <p className="mt-1 text-xs text-orange-50">24h homepage spotlight · 1 product/day</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                <Zap className="h-6 w-6 fill-white text-white" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-bold text-white/90">
              Create offer <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))
            : isError
              ? (
                <div className="col-span-2">
                  <ErrorState onRetry={() => refetch()} />
                </div>
              )
              : stats.map((stat) => (
                <div key={stat.title} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`${stat.bg} p-2 rounded-xl`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    {stat.change !== 0 && (
                      <div className={`flex items-center gap-0.5 text-xs font-semibold ${stat.change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {stat.change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {Math.abs(stat.change)}%
                      </div>
                    )}
                  </div>
                  <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{stat.title}</p>
                </div>
              ))
          }
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="text-sm font-bold text-gray-900 px-4 pt-4 pb-2">Quick Actions</p>
          {[
            { icon: Plus, label: 'Add New Product', sub: 'List a product for sale', href: '/dashboard/products/new', color: 'bg-primary/10 text-primary' },
            { icon: ShoppingBag, label: 'View Orders', sub: `${pendingOrders} pending`, href: '/dashboard/orders', color: 'bg-blue-50 text-blue-600' },
            { icon: Zap, label: 'Create Daily Offer', sub: 'Boost sales with deals', href: '/dashboard/offers', color: 'bg-orange-50 text-orange-500' },
            { icon: BarChart3, label: 'View Earnings', sub: 'Sales & performance', href: '/dashboard/earnings', color: 'bg-purple-50 text-purple-600' },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-t first:border-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${action.color}`}>
                  <action.icon className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{action.label}</p>
                  <p className="text-xs text-gray-400">{action.sub}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-900">Sales Overview</p>
            <span className="text-xs text-gray-400 capitalize">{period}</span>
          </div>
          {isLoading
            ? <Skeleton className="h-48 w-full rounded-xl" />
            : isError
              ? <ErrorState compact onRetry={() => refetch()} />
              : <SalesChart data={data?.salesChart || []} />
          }
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="text-sm font-bold text-gray-900">Recent Orders</p>
            <Link href="/dashboard/orders" className="text-xs text-primary font-semibold flex items-center gap-0.5">
              See all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {isLoading
            ? <div className="px-4 pb-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
              </div>
            : isError
              ? <div className="px-4 pb-4"><ErrorState compact onRetry={() => refetch()} /></div>
              : <div className="px-4 pb-4">
                <RecentOrders orders={data?.recentOrders || []} />
              </div>
          }
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="text-sm font-bold text-gray-900">Top Products</p>
            <Link href="/dashboard/products" className="text-xs text-primary font-semibold flex items-center gap-0.5">
              See all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {isLoading
            ? <div className="px-4 pb-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
              </div>
            : isError
              ? <div className="px-4 pb-4"><ErrorState compact onRetry={() => refetch()} /></div>
              : <div className="px-4 pb-4">
                <TopProducts products={data?.topProducts || []} />
              </div>
          }
        </div>
      </div>
    </div>
  );
}
