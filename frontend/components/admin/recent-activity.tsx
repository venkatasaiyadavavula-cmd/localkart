'use client';

import { Package, Store, ShoppingBag, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'order' | 'shop' | 'product' | 'user';
  description: string;
  createdAt: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const iconMap = {
  order: ShoppingBag,
  shop: Store,
  product: Package,
  user: User,
};

export function RecentActivity({ activities }: RecentActivityProps) {
  if (!activities?.length) {
    return <p className="text-center text-muted-foreground py-4">No recent activity</p>;
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = iconMap[activity.type] || Package;
        return (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="rounded-full bg-muted p-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm">{activity.description}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
