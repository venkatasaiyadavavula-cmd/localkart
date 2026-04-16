'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Download, Settings } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrice, formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const categoryOptions = [
  { value: 'groceries', label: 'Groceries' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'home_essentials', label: 'Home Essentials' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'accessories', label: 'Accessories' },
];

export default function AdminCommissionsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newRate, setNewRate] = useState<string>('');
  const [showRateDialog, setShowRateDialog] = useState(false);

  const { data, isLoading, updateCommissionRate, settleShopEarnings } = useAdminCommissions(period);

  const handleUpdateRate = async () => {
    if (!selectedCategory || !newRate) return;
    try {
      await updateCommissionRate(selectedCategory, parseFloat(newRate));
      toast.success('Commission rate updated');
      setShowRateDialog(false);
      setSelectedCategory('');
      setNewRate('');
    } catch (error) {
      toast.error('Failed to update commission rate');
    }
  };

  const handleSettleEarnings = async (shopId: string) => {
    try {
      await settleShopEarnings(shopId);
      toast.success('Earnings settled successfully');
    } catch (error) {
      toast.error('Failed to settle earnings');
    }
  };

  const currentRates = data?.currentRates || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Commission Management</h1>
          <p className="text-muted-foreground">Track and manage platform commissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          <Dialog open={showRateDialog} onOpenChange={setShowRateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Configure Rates
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Commission Rates</DialogTitle>
                <DialogDescription>
                  Set commission percentage for each category.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label} (Current: {currentRates[cat.value] || 0}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>New Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="e.g., 5"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateRate} disabled={!selectedCategory || !newRate}>
                  Update Rate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatPrice(data?.totalCommission || 0)}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatPrice(data?.totalRevenue || 0)}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Settlements</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatPrice(data?.pendingSettlements || 0)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Current Commission Rates</CardTitle>
          <CardDescription>Commission percentage by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {categoryOptions.map((cat) => (
              <div key={cat.value} className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">{cat.label}</p>
                <p className="text-xl font-bold text-primary">{currentRates[cat.value] || 0}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shop Earnings & Settlements */}
      <Card>
        <CardHeader>
          <CardTitle>Shop Earnings & Pending Settlements</CardTitle>
          <CardDescription>Manage seller payouts</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop</TableHead>
                <TableHead>Total Earnings</TableHead>
                <TableHead>Pending Settlement</TableHead>
                <TableHead>Last Settlement</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.shopEarnings?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No pending settlements
                  </TableCell>
                </TableRow>
              ) : (
                data?.shopEarnings?.map((shop: any) => (
                  <TableRow key={shop.id}>
                    <TableCell className="font-medium">{shop.name}</TableCell>
                    <TableCell>{formatPrice(shop.totalEarnings)}</TableCell>
                    <TableCell>{formatPrice(shop.pendingSettlement)}</TableCell>
                    <TableCell>{shop.lastSettlement ? formatDate(shop.lastSettlement) : 'Never'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleSettleEarnings(shop.id)}
                        disabled={shop.pendingSettlement === 0}
                      >
                        Settle Now
                      </Button>
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
