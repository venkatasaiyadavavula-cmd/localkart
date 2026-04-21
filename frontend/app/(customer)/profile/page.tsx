'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { User, Phone, Mail, MapPin, LogOut, Loader2, Shield, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

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
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(10, 'Valid phone required'),
  address: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { updateProfile, isLoading } = useProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      toast.success('Profile updated successfully');
      reset(data);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/');
    } catch (error) {
      toast.error('Failed to logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="container py-6 md:py-8">
      <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
        My Profile
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.profileImage} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <h3 className="mt-3 font-semibold">{user?.name}</h3>
                <p className="text-sm text-muted-foreground">{user?.phone}</p>
                <Badge className="mt-2" variant="outline">
                  {user?.role === 'customer' ? 'Customer' : 'Seller'}
                </Badge>
              </div>

              <Separator className="my-4" />

              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <a href="#profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </a>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <a href="#security">
                    <Shield className="mr-2 h-4 w-4" />
                    Security
                  </a>
                </Button>
                <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
                  {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="profile">
            <TabsList className="w-full justify-start bg-transparent p-0">
              <TabsTrigger value="profile">Profile Information</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="payments">Payment Methods</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="name" className="pl-10" {...register('name')} />
                      </div>
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="phone" className="pl-10" {...register('phone')} disabled />
                      </div>
                      <p className="text-xs text-muted-foreground">Phone number cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email (Optional)</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="email" type="email" className="pl-10" {...register('email')} />
                      </div>
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Default Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="address" className="pl-10" {...register('address')} />
                      </div>
                    </div>

                    <Button type="submit" disabled={!isDirty || isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses">
              <Card>
                <CardHeader>
                  <CardTitle>Saved Addresses</CardTitle>
                  <CardDescription>Manage your delivery addresses</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Address management coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Manage your saved payment methods</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 rounded-lg border p-4">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-sm text-muted-foreground">Default payment method</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Online payment methods will be available soon.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
