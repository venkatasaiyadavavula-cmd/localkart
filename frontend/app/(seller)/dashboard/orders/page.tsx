'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Filter, Eye, Package, Truck, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSellerOrders } from '@/hooks/use-seller-orders';
import { formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderStatus, statusColors, statusLabels } from '@/types/order';

export default function SellerOrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, updateOrderStatus } = useSellerOrders({
    status: activeTab !== 'all' ? activeTab : undefined,
    search: searchQuery,
  });

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${statusLabels[newStatus]}`);
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground">Manage orders from your shop</p>
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="confirmed">Active</TabsTrigger>
            <TabsTrigger value="out_for_delivery">Out for Delivery</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order #..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No orders found</p>
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.customer.name}</TableCell>
                    <TableCell>{order.items.length} items</TableCell>
                    <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(order.createdAt), 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Update
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/seller/dashboard/orders/${order.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </Link>
                          </DropdownMenuItem>
                          {order.status === 'confirmed' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'processing')}>
                              <Package className="mr-2 h-4 w-4" /> Mark Processing
                            </DropdownMenuItem>
                          )}
                          {order.status === 'processing' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'ready_for_pickup')}>
                              <Package className="mr-2 h-4 w-4" /> Ready for Pickup
                            </DropdownMenuItem>
                          )}
                          {order.status === 'ready_for_pickup' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'out_for_delivery')}>
                              <Truck className="mr-2 h-4 w-4" /> Out for Delivery
                            </DropdownMenuItem>
                          )}
                          {order.status === 'out_for_delivery' && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(order.id, 'delivered')}>
                              <CheckCircle className="mr-2 h-4 w-4" /> Mark Delivered
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
