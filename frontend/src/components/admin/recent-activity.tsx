"use client";

interface Activity {
  id: string;
  message: string;
  time: string;
  type: "order" | "user" | "vendor" | "dispute";
}

const activities: Activity[] = [
  { id: "1", message: "New order #ORD-042 placed by Ravi Kumar", time: "2 mins ago", type: "order" },
  { id: "2", message: "New vendor 'Sri Lakshmi Stores' registered", time: "15 mins ago", type: "vendor" },
  { id: "3", message: "Dispute #D-012 resolved", time: "1 hour ago", type: "dispute" },
  { id: "4", message: "New user Priya Reddy signed up", time: "2 hours ago", type: "user" },
  { id: "5", message: "Order #ORD-038 delivered successfully", time: "3 hours ago", type: "order" },
];

const typeColors: Record<string, string> = {
  order: "bg-blue-100 text-blue-700",
  user: "bg-green-100 text-green-700",
  vendor: "bg-purple-100 text-purple-700",
  dispute: "bg-red-100 text-red-700",
};

export function RecentActivity() {
  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${typeColors[activity.type]}`}>
            {activity.type}
          </span>
          <div>
            <p className="text-sm text-gray-700">{activity.message}</p>
            <p className="text-xs text-gray-400">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
