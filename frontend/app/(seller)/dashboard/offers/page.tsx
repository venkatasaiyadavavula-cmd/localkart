'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Trash2, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SellerOffersPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [offerPrice, setOfferPrice] = useState('');

  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ['seller-daily-offers'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const { data } = await axios.get(`${API_URL}/seller/daily-offers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ['seller-products-for-offer'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const { data } = await axios.get(`${API_URL}/catalog/seller/products?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { productId: string; offerPrice: number }) => {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_URL}/seller/daily-offers`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-daily-offers'] });
      setOpen(false);
      setSelectedProduct('');
      setOfferPrice('');
      toast.success('Offer created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create offer');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_URL}/seller/daily-offers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-daily-offers'] });
      toast.success('Offer removed');
    },
  });

  const selectedProductData = products?.find((p: any) => p.id === selectedProduct);
  const maxOfferPrice = selectedProductData?.price ? selectedProductData.price * 0.99 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Today's Offers</h1>
          <p className="text-sm text-muted-foreground">
            Create limited-time offers that expire in 24 hours. Max 5 active offers.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={offers?.length >= 5}>
              <Plus className="mr-2 h-4 w-4" />
              New Offer ({offers?.length || 0}/5)
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Daily Offer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({formatPrice(p.price)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedProductData && (
                <div className="space-y-2">
                  <Label>Offer Price (₹)</Label>
                  <Input
                    type="number"
                    placeholder={`Max: ${formatPrice(maxOfferPrice)}`}
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Original price: {formatPrice(selectedProductData.price)}. Offer must be lower.
                  </p>
                </div>
              )}
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="text-sm">
                  <Clock className="mr-1 inline h-4 w-4" />
                  This offer will automatically expire in 24 hours.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate({ productId: selectedProduct, offerPrice: parseFloat(offerPrice) })}
                disabled={!selectedProduct || !offerPrice || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Offer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {offers?.map((offer: any) => (
          <Card key={offer.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">{offer.product.name}</CardTitle>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary">-{offer.discountPercentage}%</Badge>
                  <span className="text-xs text-muted-foreground">
                    Expires {new Date(offer.expiresAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(offer.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(offer.offerPrice)}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(offer.originalPrice)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        {offers?.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-muted-foreground">No active offers. Create your first offer!</p>
          </div>
        )}
      </div>
    </div>
  );
}
