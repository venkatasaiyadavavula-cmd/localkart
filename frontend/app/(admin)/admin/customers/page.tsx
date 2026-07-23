'use client';

import { useMemo, useState } from 'react';
import { Eye, MoreHorizontal, RefreshCw, Search } from 'lucide-react';

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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { useAdminCustomers, type AdminCustomer } from '@/hooks/use-admin-customers';
import { useAdminOrders } from '@/hooks/use-admin-orders';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  statusColors,
  statusLabels,
  type Order,
} from '@/types/order';

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [applied, setApplied] = useState({
    search: '',
    statusFilter: 'all' as 'all' | 'active' | 'inactive',
    dateFrom: '',
    dateTo: '',
  });

  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [showOrders, setShowOrders] = useState(false);

  const customerParams = useMemo(
    () => ({
      page,
      limit: 20,
      search: applied.search || undefined,
      isActive: applied.statusFilter,
      dateFrom: applied.dateFrom || undefined,
      dateTo: applied.dateTo || undefined,
    }),
    [page, applied],
  );

  const { customers, meta, isLoading, isError, refetch } =
    useAdminCustomers(customerParams);

  const orderHistoryParams = useMemo(
    () => ({
      page: 1,
      limit: 50,
      customerId: selectedCustomer?.id,
    }),
    [selectedCustomer?.id],
  );

  const { orders: customerOrders, isLoading: ordersLoading } = useAdminOrders(
    orderHistoryParams,
    { enabled: showOrders && Boolean(selectedCustomer?.id) },
  );

  const applyFilters = () => {
    setPage(1);
    setApplied({
      search: search.trim(),
      statusFilter,
      dateFrom,
      dateTo,
    });
  };

  const openOrderHistory = (customer: AdminCustomer) => {
    setSelectedCustomer(customer);
    setShowOrders(true);
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">
            View customer accounts and order history
          </p>
        </div>
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">
            View customer accounts and order history
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="customerSearch">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="customerSearch"
                className="pl-9"
                placeholder="Name, phone, or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Tabs
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">
                  All
                </TabsTrigger>
                <TabsTrigger value="active" className="flex-1">
                  Active
                </TabsTrigger>
                <TabsTrigger value="inactive" className="flex-1">
                  Inactive
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="space-y-2">
            <Label htmlFor="custDateFrom">From</Label>
            <Input
              id="custDateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custDateTo">To</Label>
            <Input
              id="custDateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="flex items-end lg:col-span-5">
            <Button onClick={applyFilters}>Apply filters</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Signup</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total spent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.email || '—'}</TableCell>
                    <TableCell>{formatDate(customer.createdAt)}</TableCell>
                    <TableCell>{customer.totalOrders}</TableCell>
                    <TableCell>{formatPrice(customer.totalSpent)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          customer.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openOrderHistory(customer)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View order history
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
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

      <Dialog open={showOrders} onOpenChange={setShowOrders}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCustomer?.name}&apos;s orders</DialogTitle>
            <DialogDescription>
              {selectedCustomer?.phone}
              {selectedCustomer?.email ? ` · ${selectedCustomer.email}` : ''}
            </DialogDescription>
          </DialogHeader>
          {ordersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : customerOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No orders yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Placed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerOrders.map((order: Order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.shop?.name ?? '—'}</TableCell>
                    <TableCell>{formatPrice(order.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
