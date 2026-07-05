'use client';

import { Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminCustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Customers</h1>
        <p className="text-sm text-muted-foreground">View and manage customer accounts on LocalKart</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Management
          </CardTitle>
          <CardDescription>
            Customer analytics and account management will be available here in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            For now, customer support requests can be handled through the disputes section.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
