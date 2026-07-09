'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, User, Lock, ArrowRight, Loader2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStaffAuth } from '@/hooks/use-staff-auth';
import { formatWorkerHandle } from '@/components/work/worker-identity';

export default function WorkLoginPage() {
  const router = useRouter();
  const { login, isLoading } = useStaffAuth();
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(staffId, password);
      const handle = formatWorkerHandle(staffId.trim().toLowerCase());
      const session = useStaffAuth.getState().staff;
      toast.success(`Welcome ${session?.name ?? 'back'}! Signed in as ${handle}`);
      router.push('/work');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid Login ID or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
            <Briefcase className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
            Work Login
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in with the Login ID & password your shop owner gave you
          </p>
        </div>

        <form onSubmit={handleSubmit} data-page="work-login" className="space-y-4 rounded-3xl border bg-white p-6 shadow-xl">
          <div className="space-y-2">
            <Label htmlFor="staffId">Login ID</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="staffId"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                placeholder="e.g. test_9542"
                className="pl-10 font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. test@123123"
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            size="lg"
            disabled={submitting || isLoading}
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
            Start Working
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Shop owner?{' '}
          <Link href="/login?redirect=/dashboard" className="font-semibold text-primary hover:underline">
            Seller login
          </Link>
          {' · '}
          <Link href="/" className="font-semibold text-gray-600 hover:underline">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}
