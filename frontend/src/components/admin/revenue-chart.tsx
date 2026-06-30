"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Nov", revenue: 65000 },
  { month: "Dec", revenue: 89000 },
  { month: "Jan", revenue: 72000 },
  { month: "Feb", revenue: 95000 },
  { month: "Mar", revenue: 110000 },
  { month: "Apr", revenue: 124500 },
];

export function RevenueChart() {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
          <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
