'use client';

import { useState } from 'react';
import { TrendingUp, Video, Calendar, DollarSign, Play, Pause, Plus, Sparkles, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSellerProducts } from '@/hooks/use-seller-products';
import { useAdCampaigns } from '@/hooks/use-ad-campaigns';
import { useFeaturedVideos } from '@/hooks/use-featured-videos';
import { formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const AD_PACKAGES = [
  { id: 'day', label: '1 Day', price: 50, days: 1 },
  { id: 'week', label: '1 Week', price: 200, days: 7 },
  { id: 'month', label: '1 Month', price: 1000, days: 30 },
] as const;

export default function SellerAdsPage() {
  const [showNewAdDialog, setShowNewAdDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [videoProductId, setVideoProductId] = useState('');
  const [adPackage, setAdPackage] = useState<'day' | 'week' | 'month'>('week');

  const { data: productsList } = useSellerProducts({ limit: 100 });
  const { data: campaigns, isLoading, createCampaign, updateCampaign } = useAdCampaigns();
  const { featuredVideos, isLoading: videosLoading, promoteVideo, isPromoting } = useFeaturedVideos();

  const products = (productsList || []).filter((p: { status?: string }) => p.status === 'approved');
  const productsWithVideo = products.filter((p: { videos?: string[] }) => p.videos?.length);
  const selectedPkg = AD_PACKAGES.find(p => p.id === adPackage)!;

  const handleCreateCampaign = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    const startDate = new Date();

    try {
      await createCampaign({
        productId: selectedProduct,
        adType: 'sponsored',
        package: adPackage,
        startDate: startDate.toISOString(),
      });
      toast.success('Ad campaign submitted — pending approval');
      setShowNewAdDialog(false);
      setSelectedProduct('');
    } catch {
      toast.error('Failed to create campaign');
    }
  };

  const handlePromoteVideo = async () => {
    if (!videoProductId) {
      toast.error('Please select a product with video');
      return;
    }

    try {
      const result = await promoteVideo(videoProductId);
      toast.success(result?.message || 'Video featured on homepage for 24 hours (₹29)');
      setShowVideoDialog(false);
      setVideoProductId('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to promote video');
    }
  };

  const handleToggleStatus = async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await updateCampaign(campaignId, { status: newStatus });
      toast.success(`Campaign ${newStatus === 'active' ? 'resumed' : 'paused'}`);
    } catch {
      toast.error('Failed to update campaign');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Ad Campaigns</h1>
          <p className="text-muted-foreground">Promote products & feature videos on homepage</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                Feature Video (₹29)
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Homepage Video Suggestion</DialogTitle>
                <DialogDescription>
                  Show your product video on everyone&apos;s homepage for 24 hours. Regular video upload is ₹10; homepage suggestion is ₹29.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Product with Video</Label>
                  <Select value={videoProductId} onValueChange={setVideoProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {productsWithVideo.map((product: { id: string; name: string }) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {productsWithVideo.length === 0 && (
                    <p className="text-xs text-muted-foreground">Upload a video on a product first (₹10 per video).</p>
                  )}
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-100 p-4">
                  <p className="text-sm font-medium text-amber-900">₹29 for 24 hours</p>
                  <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Visible to all customers on homepage until expiry
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowVideoDialog(false)}>Cancel</Button>
                <Button onClick={handlePromoteVideo} disabled={isPromoting || !videoProductId}>
                  Promote for ₹29
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewAdDialog} onOpenChange={setShowNewAdDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Product Ad</DialogTitle>
                <DialogDescription>
                  Boost your product visibility on homepage and search results.
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
                      {products.map((product: { id: string; name: string }) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ad Package</Label>
                  <Select value={adPackage} onValueChange={(v) => setAdPackage(v as typeof adPackage)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AD_PACKAGES.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.label} — {formatPrice(pkg.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-sm font-medium">Cost Summary</p>
                  <p className="font-heading text-2xl font-bold text-primary">
                    {formatPrice(selectedPkg.price)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedPkg.days} day{selectedPkg.days > 1 ? 's' : ''} of sponsored placement
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewAdDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateCampaign}>Create Campaign</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {AD_PACKAGES.map((pkg) => (
          <Card key={pkg.id} className={adPackage === pkg.id ? 'border-primary' : ''}>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-muted-foreground">{pkg.label}</p>
              <p className="text-2xl font-bold text-primary">{formatPrice(pkg.price)}</p>
              <p className="text-xs text-muted-foreground">Sponsored product ads</p>
            </CardContent>
          </Card>
        ))}
      </div>

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
                {campaigns?.sponsored?.map((campaign: {
                  id: string;
                  status: string;
                  endDate: string;
                  impressions: number;
                  clicks: number;
                  product: { name: string };
                }) => (
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Homepage Video Suggestions
            </CardTitle>
            <CardDescription>₹29 per video · 24 hour homepage visibility</CardDescription>
          </CardHeader>
          <CardContent>
            {videosLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : !featuredVideos?.length ? (
              <p className="py-8 text-center text-muted-foreground">No featured videos yet</p>
            ) : (
              <div className="space-y-4">
                {featuredVideos.map((fv: {
                  id: string;
                  status: string;
                  expiresAt: string;
                  amount: number;
                  product?: { name: string };
                }) => (
                  <div key={fv.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-medium">{fv.product?.name || 'Product'}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{formatPrice(fv.amount)}</span>
                          <span>Expires {format(new Date(fv.expiresAt), 'dd MMM HH:mm')}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={fv.status === 'active' ? 'default' : 'secondary'}>
                      {fv.status}
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

