'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus, Search, Edit, Trash2, Eye, Package,
  Loader2, TrendingUp, TrendingDown, AlertCircle,
  MoreVertical, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { useSellerProducts } from '@/hooks/use-seller-products';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft:        { label: 'Draft',        color: 'bg-gray-100 text-gray-700',   icon: Clock },
  pending:      { label: 'In Review',    color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved:     { label: 'Live',         color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected:     { label: 'Rejected',     color: 'bg-red-100 text-red-700',     icon: XCircle },
  out_of_stock: { label: 'Out of Stock', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
};

export default function SellerProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [quickStock, setQuickStock] = useState('');
  const [quickPrice, setQuickPrice] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [savingQuick, setSavingQuick] = useState(false);

  const { data: productsList, isLoading, deleteProduct, updateProduct } = useSellerProducts({ search: searchQuery });

  const products = productsList || [];
  const filtered = activeFilter === 'all' ? products : products.filter((p: any) => p.status === activeFilter);

  const stats = {
    total: products.length,
    live: products.filter((p: any) => p.status === 'approved').length,
    outOfStock: products.filter((p: any) => p.status === 'out_of_stock').length,
    pending: products.filter((p: any) => p.status === 'pending').length,
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteProduct(deleteId);
      toast.success('Product deleted');
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const openQuickEdit = (product: any) => {
    setEditProduct(product);
    setQuickStock(String(product.stock));
    setQuickPrice(String(product.price));
  };

  const saveQuickEdit = async () => {
    if (!editProduct) return;
    setSavingQuick(true);
    try {
      await updateProduct(editProduct.id, {
        stock: Number(quickStock),
        price: Number(quickPrice),
      });
      toast.success('Product updated!');
      setEditProduct(null);
    } catch {
      toast.error('Failed to update');
    } finally {
      setSavingQuick(false);
    }
  };

  const filters = [
    { label: 'All', value: 'all', count: stats.total },
    { label: '🟢 Live', value: 'approved', count: stats.live },
    { label: '🟡 Review', value: 'pending', count: stats.pending },
    { label: '🔴 No Stock', value: 'out_of_stock', count: stats.outOfStock },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Products</h1>
            <p className="text-xs text-gray-500">{stats.total} products · {stats.live} live</p>
          </div>
          <Link href="/dashboard/products/new">
            <Button size="sm" className="h-9 rounded-xl gap-1.5">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search your products..."
            className="pl-10 h-10 rounded-xl bg-gray-50 border-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                activeFilter === f.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {f.label} {f.count > 0 && `(${f.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3">
        {[
          { label: 'Live', value: stats.live, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'No Stock', value: stats.outOfStock, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Products list */}
      <div className="px-4 space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 flex gap-3 items-center">
                <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-6 w-1/3" />
                </div>
              </div>
            ))
          : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Package className="h-16 w-16 mb-3 text-gray-200" />
                <p className="font-semibold text-gray-600">No products found</p>
                <Link href="/dashboard/products/new" className="mt-3">
                  <Button size="sm" className="rounded-xl">Add First Product</Button>
                </Link>
              </div>
            )
          : filtered.map((product: any) => {
              const status = statusConfig[product.status] || statusConfig.draft;
              const StatusIcon = status.icon;
              const discount = product.mrp && product.mrp > product.price
                ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                : 0;

              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex gap-3 p-4">
                    {/* Image */}
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {product.images?.[0]
                        ? <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                        : <Package className="absolute inset-0 m-auto h-7 w-7 text-gray-300" />
                      }
                      {discount > 0 && (
                        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-[9px] font-bold text-center py-0.5">
                          -{discount}%
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-base font-bold text-gray-900">{formatPrice(product.price)}</span>
                        {product.mrp > product.price && (
                          <span className="text-xs text-gray-400 line-through">{formatPrice(product.mrp)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.color}`}>
                          <StatusIcon className="h-2.5 w-2.5" />
                          {status.label}
                        </span>
                        <span className={cn(
                          'text-xs font-medium',
                          product.stock === 0 ? 'text-red-500' :
                          product.stock < 5 ? 'text-orange-500' : 'text-gray-500'
                        )}>
                          {product.stock === 0 ? '❌ Out of stock' :
                           product.stock < 5 ? `⚠️ ${product.stock} left` :
                           `${product.stock} in stock`}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => openQuickEdit(product)}
                        className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
                        title="Quick Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <Link href={`/dashboard/products/${product.id}`}>
                        <button className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </Link>
                    </div>
                  </div>

                  {/* Sales bar */}
                  {product.orderCount > 0 && (
                    <div className="px-4 pb-3 flex items-center gap-2">
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs text-gray-500">{product.orderCount} orders</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                        <div
                          className="h-full bg-green-400 rounded-full"
                          style={{ width: `${Math.min(100, (product.orderCount / 50) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Quick actions bar */}
                  <div className="flex border-t divide-x">
                    <button
                      onClick={() => openQuickEdit(product)}
                      className="flex-1 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit className="h-3.5 w-3.5" /> Quick Edit
                    </button>
                    <Link href={`/browse/${product.categoryType}/product/${product.slug}`} target="_blank" className="flex-1">
                      <button className="w-full py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </button>
                    </Link>
                    <button
                      onClick={() => setDeleteId(product.id)}
                      className="flex-1 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* Quick Edit Sheet */}
      <Sheet open={!!editProduct} onOpenChange={(o) => !o && setEditProduct(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-lg font-bold">Quick Edit</SheetTitle>
            <p className="text-sm text-gray-500 truncate">{editProduct?.name}</p>
          </SheetHeader>

          <div className="space-y-4">
            {/* Price */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Selling Price (₹)</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuickPrice(p => String(Math.max(0, Number(p) - 10)))}
                  className="w-11 h-11 rounded-xl border-2 border-gray-200 text-lg font-bold flex items-center justify-center hover:border-primary"
                >−</button>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <Input
                    type="number"
                    value={quickPrice}
                    onChange={(e) => setQuickPrice(e.target.value)}
                    className="pl-7 h-11 rounded-xl text-center text-lg font-bold"
                  />
                </div>
                <button
                  onClick={() => setQuickPrice(p => String(Number(p) + 10))}
                  className="w-11 h-11 rounded-xl border-2 border-gray-200 text-lg font-bold flex items-center justify-center hover:border-primary"
                >+</button>
              </div>
            </div>

            {/* Stock */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Stock Quantity</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuickStock(s => String(Math.max(0, Number(s) - 1)))}
                  className="w-11 h-11 rounded-xl border-2 border-gray-200 text-lg font-bold flex items-center justify-center hover:border-primary"
                >−</button>
                <Input
                  type="number"
                  value={quickStock}
                  onChange={(e) => setQuickStock(e.target.value)}
                  className="flex-1 h-11 rounded-xl text-center text-lg font-bold"
                />
                <button
                  onClick={() => setQuickStock(s => String(Number(s) + 1))}
                  className="w-11 h-11 rounded-xl border-2 border-gray-200 text-lg font-bold flex items-center justify-center hover:border-primary"
                >+</button>
              </div>
              {/* Quick stock buttons */}
              <div className="flex gap-2 mt-2">
                {[10, 25, 50, 100].map(n => (
                  <button
                    key={n}
                    onClick={() => setQuickStock(String(n))}
                    className="flex-1 py-1.5 text-xs font-semibold bg-gray-100 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={saveQuickEdit}
              disabled={savingQuick}
              className="w-full h-12 rounded-xl font-bold text-base"
            >
              {savingQuick ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the product. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
