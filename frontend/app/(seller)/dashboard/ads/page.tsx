'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Video, Calendar, DollarSign, Play, Pause, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSellerProducts } from '@/hooks/use-seller-products';
import { useAdCampaigns } from '@/hooks/use-ad-campaigns';
import { formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function SellerAdsPage() {
  const [showNewAdDialog, setShowNewAdDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [adType, setAdType] = useState<'sponsored' | 'video'>('sponsored');
  const [duration, setDuration] = useState('7');

  const { data: products } = useSellerProducts({ limit: 100 });
  const { data: campaigns, isLoading, createCampaign, updateCampaign } = useAdCampaigns();

  const handleCreateCampaign = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(duration));

    try {
      await createCampaign({
        productId: selectedProduct,
        adType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      toast.success('Ad campaign created successfully');
      setShowNewAdDialog(false);
      setSelectedProduct('');
    } catch (error) {
      toast.error('Failed to create campaign');
    }
  };

  const handleToggleStatus = async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await updateCampaign(campaignId, { status: newStatus });
      toast.success(`Campaign ${newStatus === 'active' ? 'resumed' : 'paused'}`);
    } catch (error) {
      toast.error('Failed to update campaign');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Ad Campaigns</h1>
          <p className="text-muted-foreground">Promote your products to reach more customers</p>
        </div>
        <Dialog open={showNewAdDialog} onOpenChange={setShowNewAdDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Ad Campaign</DialogTitle>
              <DialogDescription>
                Promote your product to appear at the top of search results.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.data.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ad Type</Label>
                <Select value={adType} onValueChange={(v) => setAdType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sponsored">Sponsored Product (₹100/day)</SelectItem>
                    <SelectItem value="video">Video Product (₹10/video)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {adType === 'sponsored' && (
                <div className="space-y-2">
                  <Label>Duration (Days)</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days - ₹700</SelectItem>
                      <SelectItem value="14">14 days - ₹1,400</SelectItem>
                      <SelectItem value="30">30 days - ₹3,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-sm font-medium">Cost Summary</p>
                <p className="font-heading text-2xl font-bold text-primary">
                  {adType === 'sponsored'
                    ? formatPrice(parseInt(duration) * 100)
                    : '₹10 per video'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewAdDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCampaign}>Create Campaign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Campaigns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sponsored Products</CardTitle>
            <CardDescription>Products currently being promoted</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : campaigns?.sponsored?.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No active sponsored campaigns</p>
            ) : (
              <div className="space-y-4">
                {campaigns?.sponsored?.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{campaign.product.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Ends {format(new Date(campaign.endDate), 'dd MMM')}
                          </span>
                          <span>Impressions: {campaign.impressions}</span>
                          <span>Clicks: {campaign.clicks}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(campaign.id, campaign.status)}
                      >
                        {campaign.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Video Ads */}
        <Card>
          <CardHeader>
            <CardTitle>Video Products</CardTitle>
            <CardDescription>Products with video promotions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : campaigns?.video?.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No video campaigns</p>
            ) : (
              <div className="space-y-4">
                {campaigns?.video?.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-medium">{campaign.product.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Views: {campaign.impressions}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function
function format(date: Date, formatStr: string): string {
  return new Intl.DateTimeFormat('en-IN').format(date);
}
