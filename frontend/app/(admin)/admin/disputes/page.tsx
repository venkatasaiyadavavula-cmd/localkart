'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, Eye, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminDisputes } from '@/hooks/use-admin-disputes';
import { formatPrice, formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  refunded: 'bg-blue-100 text-blue-800',
};

export default function AdminDisputesPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { data, isLoading, resolveDispute } = useAdminDisputes({
    status: activeTab !== 'all' ? activeTab : undefined,
  });

  const handleResolve = async (disputeId: string, action: 'approve' | 'reject' | 'refund') => {
    try {
      await resolveDispute(disputeId, action);
      toast.success(`Dispute ${action}ed successfully`);
    } catch (error) {
      toast.error('Failed to resolve dispute');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Dispute Resolution</h1>
        <p className="text-muted-foreground">Manage customer return and refund disputes</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Amount</TableHead>
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
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No disputes found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-medium">{dispute.order?.orderNumber}</TableCell>
                    <TableCell>{dispute.customer?.name}</TableCell>
                    <TableCell>{dispute.shop?.name}</TableCell>
                    <TableCell className="capitalize">{dispute.reason.replace(/_/g, ' ')}</TableCell>
                    <TableCell>{formatPrice(dispute.refundAmount)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[dispute.status]}>
                        {dispute.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(dispute.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          {dispute.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleResolve(dispute.id, 'approve')}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Approve Return
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResolve(dispute.id, 'reject')}>
                                <XCircle className="mr-2 h-4 w-4 text-red-600" /> Reject Return
                              </DropdownMenuItem>
                            </>
                          )}
                          {dispute.status === 'approved' && !dispute.refunded && (
                            <DropdownMenuItem onClick={() => handleResolve(dispute.id, 'refund')}>
                              <CheckCircle className="mr-2 h-4 w-4 text-blue-600" /> Process Refund
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

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dispute Details</DialogTitle>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Order Number</p>
                  <p>{selectedDispute.order?.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Customer</p>
                  <p>{selectedDispute.customer?.name} ({selectedDispute.customer?.phone})</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Shop</p>
                  <p>{selectedDispute.shop?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Reason</p>
                  <p className="capitalize">{selectedDispute.reason.replace(/_/g, ' ')}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm text-muted-foreground">{selectedDispute.description || 'No description'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Refund Amount</p>
                  <p className="font-semibold">{formatPrice(selectedDispute.refundAmount)}</p>
                </div>
              </div>
              {selectedDispute.evidenceImages?.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Evidence</p>
                  <div className="mt-2 flex gap-2">
                    {selectedDispute.evidenceImages.map((img: string, i: number) => (
                      <div key={i} className="relative h-20 w-20 overflow-hidden rounded-md border">
                        <Image src={img} alt="" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
