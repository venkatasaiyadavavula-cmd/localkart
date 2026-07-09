'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Phone, Mail, MapPin, LogOut,
  Loader2, Shield, Plus, Trash2,
  Home, Briefcase, MoreHorizontal, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { unwrapApiData } from '@/lib/utils';

import { API_URL as API } from '@/lib/api-config';
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

const profileSchema = z.object({
  name:    z.string().min(2),
  email:   z.string().email().optional().or(z.literal('')),
  phone:   z.string().min(10),
  address: z.string().optional(),
});
type ProfileFormData = z.infer<typeof profileSchema>;

type AddressType = 'home' | 'work' | 'other';
interface Address {
  id:        string;
  type:      AddressType;
  label:     string;
  fullAddress: string;
  pincode:   string;
  isDefault: boolean;
}

const ADDRESS_ICONS: Record<AddressType, { icon: React.ElementType; color: string; bg: string }> = {
  home:  { icon: Home,          color: '#3D5AF1', bg: '#EEF0FE' },
  work:  { icon: Briefcase,     color: '#059669', bg: '#ECFDF5' },
  other: { icon: MoreHorizontal, color: '#F59E0B', bg: '#FFFBEB' },
};

function AddressCard({ addr, onDelete, onSetDefault }: {
  addr:         Address;
  onDelete:     (id: string) => void;
  onSetDefault: (id: string) => void;
}) {
  const cfg  = ADDRESS_ICONS[addr.type] ?? ADDRESS_ICONS.other;
  const Icon = cfg.icon;

  return (
    <div
      className="rounded-2xl border p-4 flex items-start gap-3 transition-all"
      style={{
        borderColor: addr.isDefault ? 'rgba(61,90,241,0.30)' : '#E5E9F2',
        background:  addr.isDefault ? '#F8F9FF' : 'white',
        boxShadow:   '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0" style={{ background: cfg.bg }}>
        <Icon className="h-5 w-5" style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-extrabold text-gray-800 capitalize">{addr.type || addr.label}</p>
          {addr.isDefault && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: '#EEF0FE', color: '#3D5AF1' }}>
              <CheckCircle2 className="h-3 w-3" /> Default
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-0.5 leading-snug">{addr.fullAddress}</p>
        {addr.pincode && <p className="text-xs text-gray-400 mt-0.5">Pincode: {addr.pincode}</p>}

        <div className="flex items-center gap-2 mt-2.5">
          {!addr.isDefault && (
            <button
              onClick={() => onSetDefault(addr.id)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors hover:bg-primary/5"
              style={{ color: '#3D5AF1', borderColor: 'rgba(61,90,241,0.25)' }}
            >
              Set as Default
            </button>
          )}
          <button
            onClick={() => onDelete(addr.id)}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors"
            style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.20)', background: '#FEF2F2' }}
          >
            <Trash2 className="h-3 w-3" /> Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function AddAddressForm({ onSaved }: { onSaved: () => void }) {
  const qc   = useQueryClient();
  const [form, setForm] = useState({ label: 'home' as AddressType, fullAddress: '', pincode: '' });

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post(`${API}/addresses`, {
        type: form.label,
        label: form.label,
        fullAddress: form.fullAddress,
        pincode: form.pincode,
      }, { headers: auth() });
      return unwrapApiData(data);
    },
    onSuccess: () => {
      toast.success('Address saved!');
      qc.invalidateQueries({ queryKey: ['addresses'] });
      onSaved();
    },
    onError: () => toast.error('Failed to save address'),
  });

  return (
    <div className="rounded-2xl border border-gray-100 p-4 space-y-3 bg-gray-50">
      <p className="text-sm font-extrabold text-gray-700">New Address</p>

      {/* Type */}
      <div className="grid grid-cols-3 gap-2">
        {(['home', 'work', 'other'] as AddressType[]).map(t => {
          const cfg  = ADDRESS_ICONS[t];
          const Icon = cfg.icon;
          return (
            <button key={t} type="button" onClick={() => setForm(p => ({ ...p, label: t }))}
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border-2 transition-all text-center"
              style={{ borderColor: form.label === t ? cfg.color : '#E5E9F2', background: form.label === t ? cfg.bg : 'white' }}>
              <Icon className="h-4 w-4" style={{ color: form.label === t ? cfg.color : '#9CA3AF' }} />
              <span className="text-[11px] font-extrabold capitalize" style={{ color: form.label === t ? cfg.color : '#9CA3AF' }}>{t}</span>
            </button>
          );
        })}
      </div>

      <input value={form.fullAddress} onChange={e => setForm(p => ({ ...p, fullAddress: e.target.value }))}
        placeholder="Flat, House No., Street, Area *" className="input-base" />
      <input value={form.pincode} onChange={e => setForm(p => ({ ...p, pincode: e.target.value }))}
        placeholder="Pincode *" className="input-base" maxLength={6} />

      <div className="flex gap-2">
        <button onClick={onSaved}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={!form.fullAddress || !form.pincode || mutation.isPending}
          className="flex-1 py-2.5 rounded-xl text-sm font-extrabold text-white transition-all disabled:opacity-50 active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg,#3D5AF1,#6D28D9)', boxShadow: '0 4px 16px rgba(61,90,241,0.28)' }}>
          {mutation.isPending ? 'Saving...' : 'Save Address'}
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router         = useRouter();
  const { user, logout } = useAuth();
  const { updateProfile, isLoading } = useProfile();
  const qc             = useQueryClient();
  const [isLoggingOut, setIsLoggingOut]   = useState(false);
  const [showAddForm,  setShowAddForm]    = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', email: user?.email || '', phone: user?.phone || '', address: user?.address || '' },
  });

  /* Addresses */
  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/addresses`, { headers: auth() });
      return unwrapApiData<Address[]>(data) ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => axios.delete(`${API}/addresses/${id}`, { headers: auth() }),
    onSuccess: () => { toast.success('Address removed'); qc.invalidateQueries({ queryKey: ['addresses'] }); },
  });

  const defaultMutation = useMutation({
    mutationFn: async (id: string) => axios.put(`${API}/addresses/${id}/default`, {}, { headers: auth() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });

  const onSubmit = async (data: ProfileFormData) => {
    try { await updateProfile(data); toast.success('Profile updated!'); reset(data); }
    catch { toast.error('Failed to update profile'); }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await logout(); router.push('/'); }
    catch { toast.error('Failed to logout'); }
    finally { setIsLoggingOut(false); }
  };

  return (
    <div className="min-h-screen py-6 px-4 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-sans)' }}>
      <h1 className="text-2xl font-black text-gray-900 mb-6" style={{ fontFamily: 'var(--font-display)' }}>My Profile</h1>

      <div className="space-y-4">
        {/* Avatar card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 flex items-center gap-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.profileImage} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-black">
              {user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-base font-extrabold text-gray-900 truncate">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.phone}</p>
            <Badge className="mt-1.5" variant="outline">
              {user?.role === 'admin' ? 'Admin' : user?.role === 'seller' ? 'Seller' : 'Customer'}
            </Badge>
          </div>
          <button onClick={handleLogout} disabled={isLoggingOut}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-colors"
            style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.20)', background: '#FEF2F2' }}>
            {isLoggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
            Logout
          </button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile">
          <TabsList className="w-full bg-white rounded-2xl border border-gray-100 p-1 h-auto"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <TabsTrigger value="profile"   className="flex-1 rounded-xl text-xs font-bold py-2">Profile</TabsTrigger>
            <TabsTrigger value="addresses" className="flex-1 rounded-xl text-xs font-bold py-2">Addresses</TabsTrigger>
            <TabsTrigger value="security"  className="flex-1 rounded-xl text-xs font-bold py-2">Security</TabsTrigger>
          </TabsList>

          {/* Profile tab */}
          <TabsContent value="profile">
            <div className="bg-white rounded-3xl border border-gray-100 p-5 mt-3 space-y-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <p className="text-sm font-extrabold text-gray-700">Personal Information</p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input className="pl-10 input-base" {...register('name')} />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input className="pl-10 input-base" {...register('phone')} disabled />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Phone cannot be changed</p>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Email (Optional)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input type="email" className="pl-10 input-base" {...register('email')} />
                  </div>
                </div>
                <button type="submit" disabled={!isDirty || isLoading}
                  className="w-full py-3 rounded-2xl text-sm font-extrabold text-white transition-all disabled:opacity-50 active:scale-[0.97]"
                  style={{ background: 'linear-gradient(135deg,#3D5AF1,#6D28D9)', boxShadow: '0 4px 16px rgba(61,90,241,0.28)' }}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </TabsContent>

          {/* Addresses tab — fully working! */}
          <TabsContent value="addresses">
            <div className="mt-3 space-y-3">
              {addresses.map(addr => (
                <AddressCard key={addr.id} addr={addr}
                  onDelete={id => deleteMutation.mutate(id)}
                  onSetDefault={id => defaultMutation.mutate(id)} />
              ))}

              {addresses.length === 0 && !showAddForm && (
                <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div className="w-14 h-14 rounded-3xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#EEF0FE' }}>
                    <MapPin className="h-7 w-7" style={{ color: '#3D5AF1' }} />
                  </div>
                  <p className="font-extrabold text-gray-700">No saved addresses</p>
                  <p className="text-sm text-gray-400 mt-1">Add Home, Work or Other addresses for faster checkout</p>
                </div>
              )}

              {showAddForm
                ? <AddAddressForm onSaved={() => setShowAddForm(false)} />
                : (
                  <button onClick={() => setShowAddForm(true)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-extrabold border-2 border-dashed transition-all hover:border-primary/40 hover:bg-primary/5"
                    style={{ borderColor: '#E5E9F2', color: '#3D5AF1' }}>
                    <Plus className="h-4 w-4" /> Add New Address
                  </button>
                )
              }
            </div>
          </TabsContent>

          {/* Security tab */}
          <TabsContent value="security">
            <div className="bg-white rounded-3xl border border-gray-100 p-5 mt-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#EEF0FE' }}>
                  <Shield className="h-5 w-5" style={{ color: '#3D5AF1' }} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-gray-800">Account Security</p>
                  <p className="text-xs text-gray-400">Your account is secured with OTP login</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-green-50 rounded-2xl p-3">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-700 font-semibold">Phone number verified — {user?.phone}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
