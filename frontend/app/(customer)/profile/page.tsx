'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  User, Phone, Mail, MapPin, LogOut, Loader2,
  Shield, CreditCard, Heart, Package, ChevronRight,
  Settings, Bell, HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
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

const profileSchema = z.object({
  name:    z.string().min(2, 'Name is required'),
  email:   z.string().email('Invalid email').optional().or(z.literal('')),
  phone:   z.string().min(10, 'Valid phone required'),
  address: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { updateProfile, isLoading } = useProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name:    user?.name || '',
      email:   user?.email || '',
      phone:   user?.phone || '',
      address: user?.address || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      toast.success('Profile updated successfully');
      reset(data);
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/');
    } catch {
      toast.error('Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">My Account</h1>
      </div>

      {/* Profile card */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.profileImage} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.phone}</p>
            <Badge className="mt-1" variant="outline">
              {user?.role === 'customer' ? '🛒 Customer' : '🏪 Seller'}
            </Badge>
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          {[
            { icon: Package, label: 'My Orders', sub: 'Track & manage orders', href: '/orders', color: 'text-blue-500', bg: 'bg-blue-50' },
            { icon: Heart,   label: 'Wishlist',  sub: 'Saved products',        href: '/wishlist', color: 'text-red-500', bg: 'bg-red-50' },
            { icon: MapPin,  label: 'Addresses', sub: 'Saved delivery addresses', href: '/profile/addresses', color: 'text-green-500', bg: 'bg-green-50' },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b last:border-0">
                <div className={`${item.bg} p-2.5 rounded-xl flex-shrink-0`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            </Link>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile">
          <TabsList className="w-full justify-start bg-white rounded-2xl p-1 mb-4 shadow-sm">
            <TabsTrigger value="profile" className="flex-1 rounded-xl text-xs">Profile</TabsTrigger>
            <TabsTrigger value="payments" className="flex-1 rounded-xl text-xs">Payments</TabsTrigger>
            <TabsTrigger value="security" className="flex-1 rounded-xl text-xs">Security</TabsTrigger>
          </TabsList>

          {/* Profile tab */}
          <TabsContent value="profile">
            <Card className="rounded-2xl shadow-sm border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" method="post">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="name" className="pl-10 h-11 rounded-xl" {...register('name')} />
                    </div>
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm font-semibold">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="phone" className="pl-10 h-11 rounded-xl bg-gray-50" {...register('phone')} disabled />
                    </div>
                    <p className="text-xs text-muted-foreground">Phone number cannot be changed</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-semibold">Email (Optional)</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="email" type="email" className="pl-10 h-11 rounded-xl" {...register('email')} />
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>

                  <Button type="submit" disabled={!isDirty || isLoading} className="w-full h-11 rounded-xl font-bold">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments tab */}
          <TabsContent value="payments">
            <Card className="rounded-2xl shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-base">Payment Methods</CardTitle>
                <CardDescription>Manage your saved payment methods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 rounded-xl border p-4 bg-gray-50 mb-4">
                  <div className="bg-green-50 p-2.5 rounded-xl">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">Cash on Delivery</p>
                    <p className="text-xs text-gray-500">Always available — pay when delivered</p>
                  </div>
                  <span className="ml-auto text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Active</span>
                </div>
                <p className="text-sm text-gray-400 text-center">
                  Online payment methods coming soon — Razorpay, UPI, Cards
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security tab */}
          <TabsContent value="security">
            <Card className="rounded-2xl shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-base">Security</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Phone Verified</p>
                      <p className="text-xs text-gray-500">{user?.phone}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">✓ Verified</span>
                </div>

                <Separator />

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-500 font-bold text-sm rounded-xl hover:bg-red-100 transition-colors"
                >
                  {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
