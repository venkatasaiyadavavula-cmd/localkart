'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Package, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useStaffAuth } from '@/hooks/use-staff-auth';
import { useStaffRouteGuard } from '@/hooks/use-staff-route-guard';
import { staffWorkApi } from '@/lib/api/staff-work';
import { formatPrice, normalizeList } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function WorkProductsPage() {
  const { hasPermission } = useStaffAuth();
  useStaffRouteGuard('products:read');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stockVal, setStockVal] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['staff', 'products', search],
    queryFn: async () => {
      const res = await staffWorkApi.getProducts(search ? { search } : {});
      return normalizeList(res);
    },
  });

  const products = data ?? [];

  const updateStock = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      staffWorkApi.updateProduct(id, { stock }),
    onSuccess: () => {
      toast.success('Stock updated');
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ['staff', 'products'] });
    },
    onError: () => toast.error('Failed to update stock'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">Products</h1>
          <p className="text-xs text-gray-500">Add products & restock when low</p>
        </div>
        {hasPermission('products:write') && (
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/work/products/new"><Plus className="mr-1 h-4 w-4" /> Add</Link>
          </Button>
        )}
      </div>

      <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Package className="mx-auto h-12 w-12 mb-2 opacity-30" />
          <p className="font-semibold">No products yet</p>
          {hasPermission('products:write') && (
            <Button asChild className="mt-4"><Link href="/work/products/new">Add first product</Link></Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p: any) => (
            <div key={p.id} className="flex gap-3 rounded-2xl border bg-white p-3">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                {p.images?.[0] ? (
                  <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                ) : (
                  <Package className="absolute inset-0 m-auto h-6 w-6 text-gray-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-gray-900">{p.name}</p>
                <p className="text-sm text-gray-500">{formatPrice(p.price)}</p>
                <div className="mt-2 flex items-center gap-2">
                  {editingId === p.id ? (
                    <>
                      <Input
                        type="number"
                        value={stockVal}
                        onChange={(e) => setStockVal(e.target.value)}
                        className="h-8 w-20 text-sm"
                        min={0}
                      />
                      <button
                        onClick={() => updateStock.mutate({ id: p.id, stock: parseInt(stockVal, 10) })}
                        disabled={updateStock.isPending}
                        className="flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2 text-xs font-bold text-white"
                      >
                        {updateStock.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-gray-400">Cancel</button>
                    </>
                  ) : (
                    <>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                        Stock: {p.stock}
                      </span>
                      <button
                        onClick={() => { setEditingId(p.id); setStockVal(String(p.stock)); }}
                        className="text-xs font-bold text-emerald-600"
                      >
                        Update stock
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
