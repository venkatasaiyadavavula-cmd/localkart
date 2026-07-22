'use client';

import { useState } from 'react';
import { Percent, Settings } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useAdminCommissionRates, type CategoryCommissionRate } from '@/hooks/use-admin-commission-rates';

export default function AdminSettingsPage() {
  const { rates, isLoading, isError, refetch, updateRate, isUpdating } = useAdminCommissionRates();
  const [editing, setEditing] = useState<CategoryCommissionRate | null>(null);
  const [newRate, setNewRate] = useState('');

  const openEdit = (row: CategoryCommissionRate) => {
    setEditing(row);
    setNewRate(String(row.rate));
  };

  const handleSave = async () => {
    if (!editing) return;
    const parsed = Number(newRate);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      toast.error('Enter a rate between 0 and 100');
      return;
    }
    try {
      await updateRate(editing.categoryType, parsed);
      toast.success(`Updated ${editing.label} to ${parsed}%`);
      setEditing(null);
    } catch {
      toast.error('Failed to update commission rate');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Platform configuration — commission rates apply to new orders at checkout
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Commission rates by category
          </CardTitle>
          <CardDescription>
            Stored in the database (`categories.commissionRate`). Changes take effect on the next
            order — weekly bills use the commission recorded on each delivered order.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isError ? (
            <div className="p-6">
              <ErrorState onRetry={() => refetch()} compact />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Rate (%)</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No category rates found — run DB migration 017 or seed categories
                    </TableCell>
                  </TableRow>
                ) : (
                  rates.map((row) => (
                    <TableRow key={row.categoryType}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="text-muted-foreground">{row.slug}</TableCell>
                      <TableCell className="text-right font-semibold">{row.rate}%</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Other settings
          </CardTitle>
          <CardDescription>Notification and platform controls coming soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Contact support at{' '}
            <a href="mailto:support@localkart.com" className="text-primary hover:underline">
              support@localkart.com
            </a>{' '}
            for changes not listed here.
          </p>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update commission rate</DialogTitle>
            <DialogDescription>
              {editing?.label} — applies to new orders with products in this category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="rate">Rate (%)</Label>
            <Input
              id="rate"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
