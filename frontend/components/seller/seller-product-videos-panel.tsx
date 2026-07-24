'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Video } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MAX_VIDEOS_DEFAULT,
  ProductVideosUploadSection,
} from '@/components/forms/product-media-upload';
import { useUpdateProduct } from '@/hooks/use-update-product';
import { API_URL } from '@/lib/api-config';
import { normalizeList } from '@/lib/utils';
import { uploadMediaFiles } from '@/lib/utils/media';
import type { Product } from '@/types/product';

const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '');

export function SellerProductVideosPanel() {
  const [productId, setProductId] = useState('');
  const [existingVideos, setExistingVideos] = useState<string[]>([]);
  const [newVideos, setNewVideos] = useState<File[]>([]);
  const [newVideoUrls, setNewVideoUrls] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { updateProduct } = useUpdateProduct();

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['seller-products-for-videos'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/catalog/seller/products?limit=100`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return normalizeList<Product>(data);
    },
  });

  const approvedProducts = useMemo(
    () => products.filter((p) => p.status === 'approved'),
    [products],
  );

  const selectedProduct = approvedProducts.find((p) => p.id === productId);

  const resetNewUploads = () => {
    newVideoUrls.forEach((url) => URL.revokeObjectURL(url));
    setNewVideos([]);
    setNewVideoUrls([]);
  };

  const onSelectProduct = (id: string) => {
    setProductId(id);
    const product = approvedProducts.find((p) => p.id === id);
    setExistingVideos(product?.videos ?? []);
    resetNewUploads();
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const total = existingVideos.length + newVideos.length + files.length;
    if (total > MAX_VIDEOS_DEFAULT) {
      toast.error(`Maximum ${MAX_VIDEOS_DEFAULT} videos allowed`);
      return;
    }
    setNewVideos((prev) => [...prev, ...files]);
    setNewVideoUrls((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeExistingVideo = (index: number) => {
    setExistingVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewVideo = (index: number) => {
    URL.revokeObjectURL(newVideoUrls[index]);
    setNewVideos((prev) => prev.filter((_, i) => i !== index));
    setNewVideoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const hasChanges =
    newVideos.length > 0 ||
    (!!selectedProduct &&
      JSON.stringify(existingVideos) !== JSON.stringify(selectedProduct.videos ?? []));

  const handleSave = async () => {
    if (!productId) {
      toast.error('Select a product first');
      return;
    }

    setIsSaving(true);
    try {
      let uploaded: string[] = [];
      if (newVideos.length > 0) {
        uploaded = await uploadMediaFiles(newVideos);
      }

      const allVideos = [...existingVideos, ...uploaded];
      await updateProduct({
        productId,
        data: { videos: allVideos },
      });

      toast.success('Product videos saved');
      setExistingVideos(allVideos);
      resetNewUploads();
    } catch {
      toast.error('Video upload failed. Use mp4, mov, or webm and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mx-4 mt-5 border-violet-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
          <Video className="h-4 w-4 text-violet-600" />
          Product Videos
          <span className="text-xs font-semibold text-violet-600">(optional, max {MAX_VIDEOS_DEFAULT})</span>
        </CardTitle>
        <CardDescription className="text-xs">
          Add short product clips here or from Add Product — videos show on the product page and Videos feed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={productId} onValueChange={onSelectProduct}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select approved product..." />
          </SelectTrigger>
          <SelectContent>
            {approvedProducts.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {productId ? (
          <>
            <ProductVideosUploadSection
              variant="plain"
              layout="grid"
              existingUrls={existingVideos}
              newPreviewUrls={newVideoUrls}
              onUpload={handleVideoUpload}
              onRemoveExisting={removeExistingVideo}
              onRemoveNew={removeNewVideo}
            />
            <Button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="w-full rounded-xl bg-violet-600 font-bold hover:bg-violet-700"
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save videos to product
            </Button>
          </>
        ) : (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Pick a product to upload or manage videos
          </p>
        )}
      </CardContent>
    </Card>
  );
}
