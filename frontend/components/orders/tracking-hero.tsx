'use client';

import { motion } from 'framer-motion';
import { getStatusHeadline, getTrackingProgress } from '@/lib/order-tracking';
import { formatDistance, formatEta } from '@/lib/geo';

interface TrackingHeroProps {
  status: string;
  orderNumber?: string;
  etaMinutes?: number | null;
  distanceKm?: number | null;
  connected?: boolean;
}

export function TrackingHero({
  status,
  orderNumber,
  etaMinutes,
  distanceKm,
  connected,
}: TrackingHeroProps) {
  const progress = getTrackingProgress(status);
  const { title, subtitle } = getStatusHeadline(status);
  const isDelivered = status === 'delivered';
  const showEta = status === 'out_for_delivery' && etaMinutes != null && distanceKm != null;

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-5 text-white"
      style={{
        background: isDelivered
          ? 'linear-gradient(135deg, #059669 0%, #047857 50%, #065F46 100%)'
          : 'linear-gradient(135deg, #3D5AF1 0%, #5B4FCF 50%, #6D28D9 100%)',
        boxShadow: '0 12px 40px rgba(61,90,241,0.25)',
      }}
    >
      {/* Decorative rings */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />

      <div className="relative flex items-start gap-4">
        {/* Progress ring */}
        <div className="relative flex-shrink-0">
          <svg width="72" height="72" className="-rotate-90">
            <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
            <motion.circle
              cx="36"
              cy="36"
              r="30"
              fill="none"
              stroke="white"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 30}
              initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - progress / 100) }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-black">{progress}%</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {connected && status !== 'delivered' && (
              <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                LIVE
              </span>
            )}
            {orderNumber && (
              <span className="text-[11px] font-semibold text-white/70">#{orderNumber}</span>
            )}
          </div>
          <h2 className="mt-1 text-xl font-black leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            {isDelivered ? '🎉 ' : ''}{title}
          </h2>
          <p className="mt-0.5 text-sm text-white/80">{subtitle}</p>

          {showEta && (
            <div className="mt-3 flex gap-3">
              <div className="rounded-2xl bg-white/15 px-3 py-2 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">ETA</p>
                <p className="text-sm font-black">{formatEta(etaMinutes!)}</p>
              </div>
              <div className="rounded-2xl bg-white/15 px-3 py-2 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">Distance</p>
                <p className="text-sm font-black">{formatDistance(distanceKm!)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
