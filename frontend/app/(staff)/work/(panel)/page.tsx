'use client';

import Link from 'next/link';
import { useStaffAuth } from '@/hooks/use-staff-auth';
import { Package, Truck, Plus, ArrowRight } from 'lucide-react';

export default function WorkDashboardPage() {
  const { staff, hasPermission } = useStaffAuth();

  const cards = [
    {
      href: '/work/products',
      icon: Package,
      title: 'Manage Products',
      desc: 'Add new products & update stock',
      show: hasPermission('products:read'),
      color: 'from-blue-500 to-indigo-600',
    },
    {
      href: '/work/orders',
      icon: Truck,
      title: 'Handle Deliveries',
      desc: 'View orders & update delivery status',
      show: hasPermission('orders:read'),
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div
        className="rounded-3xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 12px 40px rgba(5,150,105,0.25)' }}
      >
        <p className="text-sm font-semibold text-white/80">Welcome back</p>
        <h1 className="mt-1 text-2xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
          {staff?.name}
        </h1>
        <p className="mt-1 text-sm text-white/80">{staff?.shopName}</p>
        <p className="mt-4 text-xs text-white/70">
          You have access to work tasks only — products, stock & deliveries.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.filter((c) => c.show).map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-3xl border bg-white p-5 transition-shadow hover:shadow-lg"
          >
            <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color} text-white`}>
              <card.icon className="h-6 w-6" />
            </div>
            <p className="font-bold text-gray-900">{card.title}</p>
            <p className="mt-1 text-sm text-gray-500">{card.desc}</p>
            <span className="mt-3 flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:gap-2 transition-all">
              Open <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>

      {hasPermission('products:write') && (
        <Link
          href="/work/products/new"
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 py-4 text-sm font-bold text-emerald-700"
        >
          <Plus className="h-4 w-4" /> Add New Product
        </Link>
      )}
    </div>
  );
}
