'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPrice } from '@/lib/utils';

interface RevenueChartProps {
  data: { date: string; revenue: number; commission: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          className="text-xs fill-muted-foreground"
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          className="text-xs fill-muted-foreground"
          tickFormatter={(value) => `₹${value / 1000}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: number) => formatPrice(value)}
          labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
        />
        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="commission" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
