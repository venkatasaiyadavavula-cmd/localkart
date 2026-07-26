'use client';

import { useState } from 'react';
import { Megaphone, Pause, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { AdminPagination } from '@/components/admin/admin-pagination';
import { useAdminAdCampaigns } from '@/hooks/use-admin-ad-campaigns';
import { formatPrice, formatDate } from '@/lib/utils';

export default function AdminAdCampaignsPage() {
  const [page, setPage] = useState(1);
  const { campaigns, meta, isLoading, isError, refetch, pauseCampaign, isPausing } =
    useAdminAdCampaigns(page, 30);

  const handlePause = async (id: string, kind: string) => {
    if (kind !== 'sponsored') {
      toast.message('Featured video promotions cannot be paused from this screen yet.');
      return;
    }
    try {
      await pauseCampaign(id);
      toast.success('Campaign paused and product unsponsored');
    } catch {
      toast.error('Failed to pause campaign');
    }
  };

  if (isError) {
    return <ErrorState title="Could not load ad campaigns" onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Ad campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Sponsored listings and featured homepage videos · charges accrue to weekly commission bills
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="h-5 w-5" />
            All seller campaigns
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead>Charge</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No ad campaigns yet
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((row) => (
                  <TableRow key={`${row.kind}-${row.id}`}>
                    <TableCell className="font-medium">{row.shopName}</TableCell>
                    <TableCell className="max-w-[160px] truncate">{row.productName}</TableCell>
                    <TableCell className="text-sm capitalize">
                      {row.kind === 'featured_video' ? 'Featured video' : row.adType}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(row.startDate)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(row.endDate)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(row.totalCost)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.chargeRecorded ? (
                        <span>
                          {formatPrice(row.chargeAmount ?? row.totalCost)}
                          {row.chargeBilled ? ' · billed' : ' · pending bill'}
                        </span>
                      ) : (
                        <span className="text-destructive">Missing accrual</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.kind === 'sponsored' && row.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPausing}
                          onClick={() => handlePause(row.id, row.kind)}
                        >
                          <Pause className="mr-1 h-3 w-3" />
                          Pause
                        </Button>
                      )}
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
    </div>
  );
}
