'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { staffWorkApi } from '@/lib/api/staff-work';
import { useStaffRouteGuard } from '@/hooks/use-staff-route-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CATEGORIES = [
  { value: 'groceries', label: 'Groceries' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'home_essentials', label: 'Home Essentials' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'accessories', label: 'Accessories' },
];

export default function WorkNewProductPage() {
  const router = useRouter();
  useStaffRouteGuard('products:write');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryType: 'groceries',
    imageUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await staffWorkApi.createProduct({
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        categoryType: form.categoryType,
        images: form.imageUrl ? [form.imageUrl] : [],
      });
      toast.success('Product submitted for review');
      router.push('/work/products');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-black text-gray-900">Add Product</h1>
        <p className="text-xs text-gray-500">Product goes for admin approval before going live</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-white p-5">
        <div className="space-y-2">
          <Label>Product Name *</Label>
          <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Price (₹) *</Label>
            <Input type="number" min={0} required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Stock *</Label>
            <Input type="number" min={0} required value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Category *</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.categoryType}
            onChange={(e) => setForm((f) => ({ ...f, categoryType: e.target.value }))}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Image URL (optional)</Label>
          <Input placeholder="https://..." value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
        </div>
        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Product
        </Button>
      </form>
    </div>
  );
}
