'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  DollarSign,
  Users,
  ArrowUp,
  ArrowDown,
  Clock,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useSellerDashboard } from '@/hooks/use-seller-dashboard';
import { SalesChart } from '@/components/seller/sales-chart';
import { RecentOrders } from '@/components/seller/recent-orders';
import { TopProducts } from '@/components/seller/top-products';
import { formatPrice, formatNumber } from '@/lib/utils';

export default function SellerDashboardPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const { data, isLoading } = useSellerDashboard(period);

  const stats = [
    {
      title: 'Total Revenue',
      value: formatPrice(data?.totalRevenue || 0),
      change: data?.revenueChange || 0,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Orders',
      value: formatNumber(data?.totalOrders || 0),
      change: data?.ordersChange || 0,
      icon: ShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Products Sold',
      value: formatNumber(data?.productsSold || 0),
      change: data?.productsSoldChange || 0,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Active Products',
      value: formatNumber(data?.activeProducts || 0),
      change: data?.activeProductsChange || 0,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Welcome back, {data?.shopName}!
          </h1>
          <p className="text-muted-foreground">Here's what's happening with your store today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-2 h-8 w-32" />
                </CardContent>
              </Card>
            ))
          : stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="mt-2 font-heading text-3xl font-bold">{stat.value}</p>
                        {stat.change !== 0 && (
                          <div className="mt-2 flex items-center gap-1">
                            {stat.change > 0 ? (
                              <ArrowUp className="h-3 w-3 text-green-600" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-red-600" />
                            )}
                            <span
                              className={`text-xs font-medium ${
                                stat.change > 0 ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {Math.abs(stat.change)}% from last period
                            </span>
                          </div>
                        )}
                      </div>
                      <div className={`rounded-full ${stat.bgColor} p-3`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Charts & Tables */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Your sales performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <SalesChart data={data?.salesChart || []} />
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to manage your shop</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/seller/dashboard/products/new">
                <Package className="mr-2 h-4 w-4" />
                Add New Product
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/seller/dashboard/orders">
                <ShoppingBag className="mr-2 h-4 w-4" />
                View Orders ({data?.pendingOrders || 0} pending)
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/seller/dashboard/ads">
                <TrendingUp className="mr-2 h-4 w-4" />
                Promote Products
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/seller/dashboard/subscription">
                <DollarSign className="mr-2 h-4 w-4" />
                Manage Subscription
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from your shop</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/seller/dashboard/orders">
                View all <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <RecentOrders orders={data?.recentOrders || []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best selling products this period</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/seller/dashboard/products">
                View all <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <TopProducts products={data?.topProducts || []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
