'use client';

import { Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Platform configuration and admin preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Admin Settings
          </CardTitle>
          <CardDescription>
            Commission rates, notification settings, and platform controls will be managed here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Contact the platform owner for configuration changes at{' '}
            <a href="mailto:support@localkart.com" className="text-primary hover:underline">
              support@localkart.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
