'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import { formatPrice, unwrapApiData } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';

import type { WeeklyEarningsData } from '@/types/api';

interface WeekData {
  weekLabel:  string;
  orderCount: number;
  gross:      number;
  commission: number;
  net:        number;
}

export default function EarningsPage() {
  const { data, isLoading } = useQuery<WeeklyEarningsData>({
    queryKey: ['weekly-earnings'],
    queryFn: async () => {
      const { data: res } = await apiClient.get('/seller/earnings/weekly');
      return unwrapApiData<WeeklyEarningsData>(res);
    },
  });

  const weeks: WeekData[]   = data?.weeks ?? [];
  const growth: number      = data?.growth ?? 0;
  const current: WeekData   = data?.currentWeek ?? { weekLabel: '', orderCount: 0, gross: 0, commission: 0, net: 0 };
  const maxNet              = Math.max(...weeks.map(w => w.net), 1);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl skeleton-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5" style={{ fontFamily: 'var(--font-sans)' }}>

      <div>
        <h1 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
          Weekly Earnings
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">WhatsApp summary sent every Friday 9 PM</p>
      </div>

      {/* This week summary */}
      <div
        className="rounded-3xl p-5 text-white relative overflow-hidden"
        style={{
          background:  'linear-gradient(135deg,#0F0E2A 0%,#1a1560 50%,#2D1B69 100%)',
          boxShadow:   '0 20px 60px -12px rgba(61,90,241,0.35)',
        }}
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20"
          style={{ background: '#3D5AF1', filter: 'blur(40px)' }} />

        <div className="relative">
          <p className="text-xs font-extrabold tracking-widest uppercase text-indigo-300 mb-3">
            This Week · {current.weekLabel}
          </p>
          <p className="text-4xl font-black leading-none" style={{ fontFamily: 'var(--font-display)' }}>
            {formatPrice(current.net)}
          </p>
          <p className="text-sm text-white/50 mt-1">Net earnings after commission</p>

          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Orders',      value: current.orderCount,              isPrice: false },
              { label: 'Gross',       value: formatPrice(current.gross),      isPrice: true },
              { label: 'Commission',  value: `-${formatPrice(current.commission)}`, isPrice: true },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-2xl p-3">
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-wide">{label}</p>
                <p className="text-sm font-extrabold text-white mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {growth !== 0 && (
            <div className="flex items-center gap-1.5 mt-4">
              {growth > 0
                ? <ArrowUpRight className="h-4 w-4 text-green-400" />
                : <ArrowDownRight className="h-4 w-4 text-red-400" />
              }
              <span className={`text-sm font-bold ${growth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {growth > 0 ? '+' : ''}{growth}% vs last week
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 8-week bar chart */}
      <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
        <p className="text-sm font-extrabold text-gray-700 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          Last 8 Weeks
        </p>

        <div className="flex items-end gap-2 h-32">
          {weeks.map((w, i) => {
            const heightPct = maxNet > 0 ? (w.net / maxNet) * 100 : 0;
            const isLatest  = i === weeks.length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="w-full relative flex flex-col justify-end" style={{ height: '100px' }}>
                  {/* Gross bar (lighter) */}
                  <div
                    className="absolute bottom-0 w-full rounded-t-lg opacity-30 transition-all duration-500"
                    style={{
                      height:     `${(w.gross / maxNet) * 100}%`,
                      background: isLatest ? '#3D5AF1' : '#9CA3AF',
                    }}
                  />
                  {/* Net bar */}
                  <div
                    className="absolute bottom-0 w-full rounded-t-lg transition-all duration-500"
                    style={{
                      height:     `${heightPct}%`,
                      background: isLatest
                        ? 'linear-gradient(180deg,#3D5AF1,#6D28D9)'
                        : 'linear-gradient(180deg,#D1D5DB,#9CA3AF)',
                    }}
                  />
                </div>
                <span className={`text-[9px] font-bold truncate w-full text-center ${isLatest ? 'text-primary' : 'text-gray-400'}`}>
                  {w.weekLabel}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm opacity-30" style={{ background: '#3D5AF1' }} />
            <span className="text-[10px] text-gray-400 font-semibold">Gross</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#3D5AF1' }} />
            <span className="text-[10px] text-gray-400 font-semibold">Net (after commission)</span>
          </div>
        </div>
      </div>

      {/* Weekly breakdown list */}
      <div>
        <p className="text-xs font-extrabold tracking-widest uppercase text-gray-400 mb-2">
          Week by Week
        </p>
        <div className="space-y-2">
          {[...weeks].reverse().map((w, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: i === 0 ? '#EEF0FE' : '#F3F4F6' }}
                >
                  <Package className="h-4 w-4" style={{ color: i === 0 ? '#3D5AF1' : '#9CA3AF' }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{w.weekLabel}</p>
                  <p className="text-xs text-gray-400">{w.orderCount} orders · Commission ₹{w.commission.toFixed(0)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-gray-900">{formatPrice(w.net)}</p>
                <p className="text-[10px] text-gray-400">net</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
