'use client';

import { useMemo, useState } from 'react';
import { Eye, MoreHorizontal, RefreshCw, Search, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { AdminOrderDetailContent } from '@/components/admin/admin-order-detail-content';
import { useAdminOrders, useAdminOrderDetail } from '@/hooks/use-admin-orders';
import { formatPrice, formatDate } from '@/lib/utils';
import { getAdminSelectableStatuses } from '@/lib/order-state-machine';
import {
  statusColors,
  statusLabels,
  type Order,
  type OrderStatus,
} from '@/types/order';

const ALL_STATUSES: OrderStatus[] = [
  'pending_otp',
  'confirmed',
  'processing',
  'ready_for_pickup',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'return_requested',
  'returned',
];

const paymentMethodLabels: Record<string, string> = {
  cod: 'COD',
  razorpay: 'Razorpay',
  wallet: 'Wallet',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-blue-100 text-blue-800',
};

export default function AdminOrdersPage() {
  const [statusTab, setStatusTab] = useState('all');
  const [page, setPage] = useState(1);
  const [shopSearch, setShopSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    shopSearch: '',
    customerSearch: '',
    dateFrom: '',
    dateTo: '',
  });

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{
    order: Order;
    status: OrderStatus;
  } | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 20,
      status: statusTab !== 'all' ? statusTab : undefined,
      shopSearch: appliedFilters.shopSearch || undefined,
      customerSearch: appliedFilters.customerSearch || undefined,
      dateFrom: appliedFilters.dateFrom || undefined,
      dateTo: appliedFilters.dateTo || undefined,
    }),
    [page, statusTab, appliedFilters],
  );

  const {
    orders,
    meta,
    isLoading,
    isError,
    refetch,
    updateOrderStatus,
    isUpdatingStatus,
  } = useAdminOrders(queryParams);

  const { data: orderDetail, isLoading: detailLoading } =
    useAdminOrderDetail(selectedOrderId);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters({
      shopSearch: shopSearch.trim(),
      customerSearch: customerSearch.trim(),
      dateFrom,
      dateTo,
    });
  };

  const openDetails = (order: Order) => {
    setSelectedOrderId(order.id);
    setShowDetails(true);
  };

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    try {
      await updateOrderStatus(statusTarget.order.id, statusTarget.status);
      toast.success(
        `Order #${statusTarget.order.orderNumber} updated to ${statusLabels[statusTarget.status]}`,
      );
      setStatusTarget(null);
    } catch {
      toast.error('Failed to update order status');
    }
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">View and manage platform orders</p>
        </div>
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">View and manage platform orders</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs
        value={statusTab}
        onValueChange={(value) => {
          setStatusTab(value);
          setPage(1);
        }}
      >
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          {ALL_STATUSES.map((status) => (
            <TabsTrigger key={status} value={status}>
              {statusLabels[status]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="shopSearch">Shop</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="shopSearch"
                className="pl-9"
                placeholder="Shop name"
                value={shopSearch}
                onChange={(e) => setShopSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerSearch">Customer</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="customerSearch"
                className="pl-9"
                placeholder="Name, phone, email"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateFrom">From</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo">To</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={applyFilters}>
              Apply filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Items / Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Pay status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const nextStatuses = getAdminSelectableStatuses(order.status);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{order.customer?.name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.customer?.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{order.shop?.name ?? '—'}</TableCell>
                      <TableCell>
                        <p className="text-sm">{order.items?.length ?? 0} items</p>
                        <p className="text-xs font-medium">{formatPrice(order.totalAmount)}</p>
                      </TableCell>
                      <TableCell>
                        {paymentMethodLabels[order.paymentMethod] ?? order.paymentMethod}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            paymentStatusColors[order.paymentStatus] ?? 'bg-muted'
                          }
                        >
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openDetails(order)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View details
                            </DropdownMenuItem>
                            {nextStatuses.map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => setStatusTarget({ order, status })}
                              >
                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                Mark {statusLabels[status]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {meta && (
            <AdminPagination
              page={meta.page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={meta.limit}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Order #{orderDetail?.orderNumber ?? '…'}
            </DialogTitle>
            <DialogDescription>Full order details and delivery progress</DialogDescription>
          </DialogHeader>
          <AdminOrderDetailContent order={orderDetail} isLoading={detailLoading} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(statusTarget)} onOpenChange={() => setStatusTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update order status?</AlertDialogTitle>
            <AlertDialogDescription>
              {statusTarget && (
                <>
                  Change order #{statusTarget.order.orderNumber} from{' '}
                  <strong>{statusLabels[statusTarget.order.status]}</strong> to{' '}
                  <strong>{statusLabels[statusTarget.status]}</strong>?
                  {statusTarget.status === 'out_for_delivery' && (
                    <> A delivery OTP will be generated for the customer.</>
                  )}
                  {statusTarget.order.status === 'out_for_delivery' &&
                    statusTarget.status === 'return_requested' && (
                      <> Delivered status still requires customer OTP verification.</>
                    )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange} disabled={isUpdatingStatus}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
