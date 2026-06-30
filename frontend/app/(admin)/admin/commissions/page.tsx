'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
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

  // ✅ Dummy data (deploy success kosam)
  const data = {
    totalCommission: 12500,
    totalRevenue: 85000,
    pendingSettlements: 5000,
    currentRates: {
      groceries: 5,
      fashion: 8,
      electronics: 10,
      home_essentials: 6,
      beauty: 7,
      accessories: 9,
    },
    shopEarnings: [
      {
        id: '1',
        name: 'Sai Kirana Store',
        totalEarnings: 20000,
        pendingSettlement: 3000,
        lastSettlement: new Date(),
      },
      {
        id: '2',
        name: 'Trendy Fashion Hub',
        totalEarnings: 35000,
        pendingSettlement: 2000,
        lastSettlement: null,
      },
    ],
  };

  const isLoading = false;

  const updateCommissionRate = async () => {
    toast.success('Commission rate updated (dummy)');
    setShowRateDialog(false);
    setSelectedCategory('');
    setNewRate('');
  };

  const settleShopEarnings = async () => {
    toast.success('Earnings settled (dummy)');
  };

  const currentRates = data.currentRates;

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
                          {cat.label} ({currentRates[cat.value]}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>New Rate (%)</Label>
                  <Input
                    type="number"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={updateCommissionRate}>
                  Update Rate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Total Commission</CardTitle></CardHeader>
          <CardContent>{formatPrice(data.totalCommission)}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Total Revenue</CardTitle></CardHeader>
          <CardContent>{formatPrice(data.totalRevenue)}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pending</CardTitle></CardHeader>
          <CardContent>{formatPrice(data.pendingSettlements)}</CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Shop Earnings</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Last</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.shopEarnings.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell>{shop.name}</TableCell>
                  <TableCell>{formatPrice(shop.totalEarnings)}</TableCell>
                  <TableCell>{formatPrice(shop.pendingSettlement)}</TableCell>
                  <TableCell>
                    {shop.lastSettlement
                      ? formatDate(shop.lastSettlement)
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Button onClick={settleShopEarnings}>
                      Settle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
