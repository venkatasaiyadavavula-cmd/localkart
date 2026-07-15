'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAdminCommissions } from '@/hooks/use-admin-commissions';

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
      await updateCommissionRate(selectedCategory, Number(newRate));
      toast.success('Commission rate updated');
      setShowRateDialog(false);
      setSelectedCategory('');
      setNewRate('');
    } catch {
      toast.error('Failed to update commission rate');
    }
  };

  const handleSettle = async (shopId: string) => {
    try {
      await settleShopEarnings(shopId);
      toast.success('Settlement processed');
    } catch {
      toast.error('Failed to settle earnings');
    }
  };

  const currentRates: Record<string, number> = data?.currentRates ?? {};
  const shopEarnings = data?.shopEarnings ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Commission Management</h1>
          <p className="text-muted-foreground">
            Platform commissions · Sellers billed weekly (Sat–Fri), due Friday, ₹25/day fine from Saturday
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month' | 'year')}>
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
                          {cat.label} ({currentRates[cat.value] ?? 0}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>New Rate (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
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

      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card>
              <CardHeader><CardTitle>Total Commission</CardTitle></CardHeader>
              <CardContent>{formatPrice(Number(data?.totalCommission ?? 0))}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader>
              <CardContent>{formatPrice(Number(data?.totalRevenue ?? 0))}</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Pending Settlements</CardTitle></CardHeader>
              <CardContent>{formatPrice(Number(data?.pendingSettlements ?? 0))}</CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shop Earnings</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop</TableHead>
                <TableHead>Total Earnings</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Last Settlement</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : shopEarnings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No shop earnings data yet
                  </TableCell>
                </TableRow>
              ) : (
                shopEarnings.map((shop: {
                  id: string;
                  name: string;
                  totalEarnings: number;
                  pendingSettlement: number;
                  lastSettlement: string | null;
                }) => (
                  <TableRow key={shop.id}>
                    <TableCell>{shop.name}</TableCell>
                    <TableCell>{formatPrice(Number(shop.totalEarnings))}</TableCell>
                    <TableCell>{formatPrice(Number(shop.pendingSettlement))}</TableCell>
                    <TableCell>
                      {shop.lastSettlement ? formatDate(shop.lastSettlement) : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        disabled={Number(shop.pendingSettlement) <= 0}
                        onClick={() => handleSettle(shop.id)}
                      >
                        Settle
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
