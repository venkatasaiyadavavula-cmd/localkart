'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Store,
  Package,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAdminDashboard } from '@/hooks/use-admin-dashboard';
import { RevenueChart } from '@/components/admin/revenue-chart';
import { RecentActivity } from '@/components/admin/recent-activity';
import { formatPrice, formatNumber } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const { data, isLoading } = useAdminDashboard(period);

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
      title: 'Active Shops',
      value: formatNumber(data?.activeShops || 0),
      change: data?.shopsChange || 0,
      icon: Store,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Customers',
      value: formatNumber(data?.totalCustomers || 0),
      change: data?.customersChange || 0,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const pendingItems = [
    {
      title: 'Pending Shops',
      count: data?.pendingShops || 0,
      icon: Store,
      href: '/admin/sellers',
      color: 'text-yellow-600',
    },
    {
      title: 'Pending Products',
      count: data?.pendingProducts || 0,
      icon: Package,
      href: '/admin/products',
      color: 'text-blue-600',
    },
    {
      title: 'Open Disputes',
      count: data?.openDisputes || 0,
      icon: AlertTriangle,
      href: '/admin/disputes',
      color: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Platform overview and key metrics</p>
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
                <Card>
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

      {/* Pending Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        {pendingItems.map((item) => (
          <Card key={item.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full bg-muted p-2`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-2xl font-bold">{item.count}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={item.href}>Review →</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts & Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Platform revenue and commission trends</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <RevenueChart data={data?.revenueChart || []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <RecentActivity activities={data?.recentActivity || []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
