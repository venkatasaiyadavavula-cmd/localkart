'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  MapPin, Plus, Trash2, Star, Home, Briefcase,
  MoreHorizontal, Loader2, ChevronLeft, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, unwrapApiData } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL;
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

const ADDRESS_TYPES = [
  { value: 'home', label: 'Home', icon: Home, color: 'text-blue-600', bg: 'bg-blue-50' },
  { value: 'work', label: 'Work', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
  { value: 'other', label: 'Other', icon: MapPin, color: 'text-gray-600', bg: 'bg-gray-100' },
];

export default function AddressesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'home', label: 'Home',
    fullAddress: '', landmark: '', pincode: '', isDefault: false,
  });

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/addresses`, { headers: auth() });
      return unwrapApiData<any[]>(data) ?? [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`${API}/addresses`, form, { headers: auth() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setAddOpen(false);
      setForm({ type: 'home', label: 'Home', fullAddress: '', landmark: '', pincode: '', isDefault: false });
      toast.success('Address saved!');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`${API}/addresses/${id}`, { headers: auth() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Address deleted');
    },
  });

  const defaultMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.put(`${API}/addresses/${id}/default`, {}, { headers: auth() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Default address updated');
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="p-1.5 hover:bg-gray-100 rounded-full">
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Saved Addresses</h1>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)} className="rounded-xl gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 h-24 animate-pulse" />
          ))
        ) : addresses?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <MapPin className="h-16 w-16 text-gray-200 mb-4" />
            <p className="text-lg font-bold text-gray-600">No saved addresses</p>
            <p className="text-sm text-gray-400 mt-1">Add your home, work or other addresses</p>
            <Button onClick={() => setAddOpen(true)} className="mt-4 rounded-xl">
              <Plus className="h-4 w-4 mr-1.5" /> Add Address
            </Button>
          </div>
        ) : (
          addresses?.map((address: any) => {
            const typeConfig = ADDRESS_TYPES.find(t => t.value === address.type) || ADDRESS_TYPES[2];
            const Icon = typeConfig.icon;

            return (
              <div key={address.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className={`${typeConfig.bg} p-2.5 rounded-xl flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${typeConfig.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900 text-sm">{address.label}</p>
                      {address.isDefault && (
                        <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{address.fullAddress}</p>
                    {address.landmark && (
                      <p className="text-xs text-gray-400 mt-0.5">Near: {address.landmark}</p>
                    )}
                    {address.pincode && (
                      <p className="text-xs text-gray-400">PIN: {address.pincode}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t">
                  {!address.isDefault && (
                    <button
                      onClick={() => defaultMutation.mutate(address.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors"
                    >
                      <Star className="h-3.5 w-3.5" /> Set Default
                    </button>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(address.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Address Sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8 max-h-[90vh] overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-xl font-bold">Add New Address</SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            {/* Type selector */}
            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-2 block">Address Type</Label>
              <div className="flex gap-2">
                {ADDRESS_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setForm(f => ({ ...f, type: type.value, label: type.label }))}
                      className={cn(
                        'flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all',
                        form.type === type.value ? 'border-primary bg-primary/5' : 'border-gray-100'
                      )}
                    >
                      <Icon className={`h-5 w-5 ${form.type === type.value ? 'text-primary' : 'text-gray-400'}`} />
                      <span className={`text-xs font-semibold ${form.type === type.value ? 'text-primary' : 'text-gray-500'}`}>
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                Full Address <span className="text-red-500">*</span>
              </Label>
              <textarea
                rows={3}
                placeholder="House/Flat no, Street, Area, City..."
                value={form.fullAddress}
                onChange={e => setForm(f => ({ ...f, fullAddress: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Landmark</Label>
              <Input
                placeholder="Near school, temple, hospital..."
                value={form.landmark}
                onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">PIN Code</Label>
              <Input
                placeholder="516001"
                value={form.pincode}
                maxLength={6}
                onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>

            <button
              onClick={() => setForm(f => ({ ...f, isDefault: !f.isDefault }))}
              className="flex items-center gap-2 w-full"
            >
              <div className={cn(
                'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors',
                form.isDefault ? 'bg-primary border-primary' : 'border-gray-300'
              )}>
                {form.isDefault && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm font-medium text-gray-700">Set as default address</span>
            </button>

            <Button
              onClick={() => addMutation.mutate()}
              disabled={!form.fullAddress || addMutation.isPending}
              className="w-full h-12 rounded-xl font-bold text-base"
            >
              {addMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : 'Save Address'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
