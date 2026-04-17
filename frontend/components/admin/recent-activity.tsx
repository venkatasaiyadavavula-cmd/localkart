'use client';

import { Package, Store, ShoppingBag, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'order' | 'shop' | 'product' | 'user';
  message: string;
  createdAt: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const activityIcons = {
  order: ShoppingBag,
  shop: Store,
  product: Package,
  user: User,
};

const activityColors = {
  order: 'text-blue-600 bg-blue-50',
  shop: 'text-purple-600 bg-purple-50',
  product: 'text-green-600 bg-green-50',
  user: 'text-orange-600 bg-orange-50',
};

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.type] || Package;
        const colorClass = activityColors[activity.type] || 'text-gray-600 bg-gray-50';

        return (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">{activity.message}</p>
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
