'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, CheckCircle, XCircle, Eye, MoreHorizontal } from 'lucide-react';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAdminShops } from '@/hooks/use-admin-shops';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  suspended: 'bg-orange-100 text-orange-800',
};

export default function AdminSellersPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const { data, isLoading, approveShop, rejectShop, suspendShop } = useAdminShops({
    status: activeTab !== 'all' ? activeTab : undefined,
    search: searchQuery,
  });

  const handleApprove = async (shopId: string) => {
    try {
      await approveShop(shopId);
      toast.success('Shop approved successfully');
    } catch (error) {
      toast.error('Failed to approve shop');
    }
  };

  const handleReject = async () => {
    if (!selectedShop || !rejectReason) return;
    try {
      await rejectShop(selectedShop.id, rejectReason);
      toast.success('Shop rejected');
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedShop(null);
    } catch (error) {
      toast.error('Failed to reject shop');
    }
  };

  const handleSuspend = async (shopId: string) => {
    try {
      await suspendShop(shopId);
      toast.success('Shop suspended');
    } catch (error) {
      toast.error('Failed to suspend shop');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Seller Management</h1>
        <p className="text-muted-foreground">Review and manage shop registrations</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search shops..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shop Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No shops found
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((shop) => (
                  <TableRow key={shop.id}>
                    <TableCell className="font-medium">{shop.name}</TableCell>
                    <TableCell>{shop.owner?.name}</TableCell>
                    <TableCell>{shop.contactPhone}</TableCell>
                    <TableCell>{shop.city}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[shop.status]}>
                        {shop.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(shop.createdAt)}</TableCell>
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
                              setSelectedShop(shop);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          {shop.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleApprove(shop.id)}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedShop(shop);
                                  setShowRejectDialog(true);
                                }}
                              >
                                <XCircle className="mr-2 h-4 w-4 text-red-600" /> Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {shop.status === 'approved' && (
                            <DropdownMenuItem onClick={() => handleSuspend(shop.id)}>
                              <XCircle className="mr-2 h-4 w-4 text-orange-600" /> Suspend
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

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Shop</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this shop. The seller will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                placeholder="e.g., Invalid documents, Incomplete information..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReject} disabled={!rejectReason}>
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Shop Details</DialogTitle>
          </DialogHeader>
          {selectedShop && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Shop Name</p>
                  <p>{selectedShop.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Owner</p>
                  <p>{selectedShop.owner?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p>{selectedShop.contactPhone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p>{selectedShop.contactEmail || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium">Address</p>
                  <p>{selectedShop.address}, {selectedShop.city}, {selectedShop.state} - {selectedShop.pincode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">GST</p>
                  <p>{selectedShop.gstNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">FSSAI</p>
                  <p>{selectedShop.fssaiLicense || '-'}</p>
                </div>
              </div>
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
