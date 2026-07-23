'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock, IndianRupee, RefreshCw, Wrench } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import {
  useAdminCommissions,
  type AdminBillStatusFilter,
} from '@/hooks/use-admin-commissions';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { formatPrice, formatDate } from '@/lib/utils';
import type { AdminCommissionBill } from '@/types/api';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  overdue: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
};

export default function AdminCommissionsPage() {
  const [statusFilter, setStatusFilter] = useState<AdminBillStatusFilter>('all');
  const [page, setPage] = useState(1);
  const [selectedBill, setSelectedBill] = useState<AdminCommissionBill | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);
  const [confirmGenerate, setConfirmGenerate] = useState(false);
  const [confirmFines, setConfirmFines] = useState(false);

  const billParams = useMemo(
    () => ({ status: statusFilter, page, limit: 20 }),
    [statusFilter, page],
  );

  const {
    summary,
    bills,
    billsMeta,
    isLoading,
    isError,
    refetch,
    markBillPaid,
    generateWeeklyBills,
    applyOverdueFines,
    isMarkingPaid,
    isGeneratingBills,
    isApplyingFines,
  } = useAdminCommissions(billParams);

  const openMarkPaid = (bill: AdminCommissionBill) => {
    setSelectedBill(bill);
    setPaymentRef('');
    setPaymentNote('');
    setShowMarkPaidDialog(true);
  };

  const handleMarkPaid = async () => {
    if (!selectedBill) return;
    try {
      await markBillPaid(selectedBill.id, paymentRef || undefined, paymentNote || undefined);
      toast.success('Bill marked as paid');
      setShowMarkPaidDialog(false);
      setSelectedBill(null);
    } catch {
      toast.error('Failed to mark bill as paid');
    }
  };

  const handleGenerateBills = async () => {
    try {
      await generateWeeklyBills();
      toast.success('Weekly bills generated for the current Sat–Fri week');
      setConfirmGenerate(false);
    } catch {
      toast.error('Failed to generate weekly bills');
    }
  };

  const handleApplyFines = async () => {
    try {
      const result = await applyOverdueFines();
      toast.success(
        `Overdue fines applied (${(result as { overdueBillCount?: number })?.overdueBillCount ?? 0} overdue bills)`,
      );
      setConfirmFines(false);
    } catch {
      toast.error('Failed to apply overdue fines');
    }
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Commission Billing</h1>
          <p className="text-muted-foreground">
            Weekly Sat–Fri commission bills · Due Friday · ₹25/day fine from Saturday
          </p>
        </div>
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Commission Billing</h1>
          <p className="text-muted-foreground">
            Weekly Sat–Fri commission bills · Due Friday · ₹25/day fine from Saturday
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmGenerate(true)}
            disabled={isGeneratingBills}
          >
            <CalendarClock className="mr-2 h-4 w-4" />
            {isGeneratingBills ? 'Generating…' : 'Generate bills'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmFines(true)}
            disabled={isApplyingFines}
          >
            <Wrench className="mr-2 h-4 w-4" />
            {isApplyingFines ? 'Running…' : 'Apply fines'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total outstanding
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-2xl font-bold">
                <IndianRupee className="h-5 w-5 text-red-600" />
                {formatPrice(summary?.totalOutstanding ?? 0)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overdue (shops / bills)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-2xl font-bold">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                {summary?.overdueShopCount ?? 0} / {summary?.overdueBillCount ?? 0}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Collected (week / month)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-lg font-bold leading-tight">
                {formatPrice(summary?.collectedThisWeek ?? 0)}
                <span className="mx-1 text-muted-foreground">/</span>
                {formatPrice(summary?.collectedThisMonth ?? 0)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bills this week
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {summary?.billsGeneratedThisWeek ?? 0}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as AdminBillStatusFilter);
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly commission bills</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop</TableHead>
                <TableHead>Week</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Fine</TableHead>
                <TableHead className="text-right">Total due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Paid at</TableHead>
                <TableHead>Payment ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={11}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : bills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-32 text-center text-muted-foreground">
                    No commission bills found for this filter
                  </TableCell>
                </TableRow>
              ) : (
                bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.shop?.name ?? '—'}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{bill.weekLabel}</TableCell>
                    <TableCell className="text-right">{bill.orderCount}</TableCell>
                    <TableCell className="text-right">{formatPrice(bill.commissionAmount)}</TableCell>
                    <TableCell className="text-right">
                      {bill.fineAmount > 0 ? formatPrice(bill.fineAmount) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {bill.status === 'paid' ? '—' : formatPrice(bill.totalDue)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[bill.status] ?? ''}>{bill.status}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(bill.billDate)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {bill.paidAt ? formatDate(bill.paidAt) : '—'}
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground">
                      {bill.razorpayPaymentId || bill.adminPaymentRef || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {bill.status !== 'paid' && (
                        <Button size="sm" variant="outline" onClick={() => openMarkPaid(bill)}>
                          Mark paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {billsMeta && (
            <AdminPagination
              page={billsMeta.page}
              totalPages={billsMeta.totalPages}
              total={billsMeta.total}
              limit={billsMeta.limit}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={showMarkPaidDialog} onOpenChange={setShowMarkPaidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark bill as paid</DialogTitle>
            <DialogDescription>
              Record manual reconciliation for{' '}
              <strong>{selectedBill?.shop?.name}</strong> ({selectedBill?.weekLabel}). Total due:{' '}
              {formatPrice(selectedBill?.totalDue ?? 0)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="paymentRef">Payment reference (optional)</Label>
              <Input
                id="paymentRef"
                placeholder="UPI ref, Razorpay pay_…, bank txn id"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentNote">Note (optional)</Label>
              <Textarea
                id="paymentNote"
                placeholder="How/when payment was received"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkPaidDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkPaid} disabled={isMarkingPaid}>
              {isMarkingPaid ? 'Saving…' : 'Confirm paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmGenerate} onOpenChange={setConfirmGenerate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate weekly bills?</AlertDialogTitle>
            <AlertDialogDescription>
              This runs the same job as the Friday 10 PM cron: one bill per shop with delivered
              orders in the current Sat–Fri week. Existing bills for this week are not duplicated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerateBills} disabled={isGeneratingBills}>
              {isGeneratingBills ? 'Generating…' : 'Generate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmFines} onOpenChange={setConfirmFines}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply overdue fines now?</AlertDialogTitle>
            <AlertDialogDescription>
              This runs the daily fines job: unpaid bills past Friday due date get ₹25/day added and
              move to overdue status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApplyFines} disabled={isApplyingFines}>
              {isApplyingFines ? 'Running…' : 'Apply fines'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
