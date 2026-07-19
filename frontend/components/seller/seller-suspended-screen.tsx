'use client';

import { AlertTriangle, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SellerSuspendedScreen({ shopName }: { shopName?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg border-orange-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Your shop has been suspended</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-muted-foreground">
          {shopName ? (
            <p>
              <span className="font-semibold text-foreground">{shopName}</span> has been suspended
              by LocalKart admin.
            </p>
          ) : (
            <p>Your shop has been suspended by LocalKart admin.</p>
          )}
          <p>
            You cannot access the seller dashboard or accept orders until your shop is reactivated.
            Your shop has been suspended — contact support to appeal.
          </p>
          <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-4 text-sm">
            <a
              href="mailto:support@localkart.com"
              className="inline-flex items-center justify-center gap-2 text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              support@localkart.com
            </a>
            <a
              href="tel:+919999999999"
              className="inline-flex items-center justify-center gap-2 text-primary hover:underline"
            >
              <Phone className="h-4 w-4" />
              Platform support
            </a>
          </div>
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Return to homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
