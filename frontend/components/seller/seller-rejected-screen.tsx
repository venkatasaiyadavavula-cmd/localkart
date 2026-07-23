'use client';

import { XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SellerSupportContact } from '@/components/seller/seller-support-contact';

interface SellerRejectedScreenProps {
  shopName?: string;
}

export function SellerRejectedScreen({ shopName }: SellerRejectedScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg border-red-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Your shop registration was not approved</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-muted-foreground">
          {shopName ? (
            <p>
              <span className="font-semibold text-foreground">{shopName}</span> could not be approved
              at this time.
            </p>
          ) : (
            <p>Your shop registration could not be approved at this time.</p>
          )}
          <p>
            If you believe this was a mistake or would like to reapply with updated details, please
            contact our support team.
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
