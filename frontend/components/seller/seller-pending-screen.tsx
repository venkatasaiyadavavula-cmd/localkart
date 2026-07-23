'use client';

import { Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SellerSupportContact } from '@/components/seller/seller-support-contact';
import { formatDate } from '@/lib/utils';

interface SellerPendingScreenProps {
  shopName?: string;
  submittedAt?: string | null;
}

export function SellerPendingScreen({ shopName, submittedAt }: SellerPendingScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg border-amber-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">Your shop registration is under review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-muted-foreground">
          {shopName ? (
            <p>
              <span className="font-semibold text-foreground">{shopName}</span> has been submitted
              and is awaiting approval from the LocalKart team.
            </p>
          ) : (
            <p>Your shop registration has been submitted and is awaiting approval.</p>
          )}
          {submittedAt ? (
            <p className="text-sm">
              Submitted on{' '}
              <span className="font-medium text-foreground">{formatDate(submittedAt)}</span>
            </p>
          ) : null}
          <p>
            We typically review new shops within 1–2 business days. You will be able to access your
            seller dashboard once your shop is approved.
          </p>
          <SellerSupportContact />
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Return to homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
