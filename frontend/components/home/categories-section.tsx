'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const CATEGORY_CONFIG: Record<string, {
  emoji:    string;
  bg:       string;   /* icon circle background      */
  ring:     string;   /* subtle border color         */
  glow:     string;   /* hover glow shadow           */
  label:    string;   /* colour of the label text    */
}> = {
  groceries: {
    emoji: '🛒',
    bg:    'linear-gradient(135deg,#D1FAE5,#A7F3D0)',
    ring:  'rgba(16,185,129,0.20)',
    glow:  'rgba(16,185,129,0.28)',
    label: '#065F46',
  },
  fashion: {
    emoji: '👗',
    bg:    'linear-gradient(135deg,#FCE7F3,#FBCFE8)',
    ring:  'rgba(236,72,153,0.20)',
    glow:  'rgba(236,72,153,0.26)',
    label: '#831843',
  },
  electronics: {
    emoji: '📱',
    bg:    'linear-gradient(135deg,#DBEAFE,#BFDBFE)',
    ring:  'rgba(59,130,246,0.20)',
    glow:  'rgba(59,130,246,0.26)',
    label: '#1E3A8A',
  },
  home_essentials: {
    emoji: '🏠',
    bg:    'linear-gradient(135deg,#FEF3C7,#FDE68A)',
    ring:  'rgba(245,158,11,0.20)',
    glow:  'rgba(245,158,11,0.28)',
    label: '#78350F',
  },
  beauty: {
    emoji: '💄',
    bg:    'linear-gradient(135deg,#EDE9FE,#DDD6FE)',
    ring:  'rgba(139,92,246,0.20)',
    glow:  'rgba(139,92,246,0.28)',
    label: '#4C1D95',
  },
  accessories: {
    emoji: '⌚',
    bg:    'linear-gradient(135deg,#CFFAFE,#A5F3FC)',
    ring:  'rgba(6,182,212,0.20)',
    glow:  'rgba(6,182,212,0.26)',
    label: '#164E63',
  },
  sports: {
    emoji: '⚽',
    bg:    'linear-gradient(135deg,#ECFCCB,#D9F99D)',
    ring:  'rgba(132,204,22,0.20)',
    glow:  'rgba(132,204,22,0.26)',
    label: '#3F6212',
  },
  books: {
    emoji: '📚',
    bg:    'linear-gradient(135deg,#FFEDD5,#FED7AA)',
    ring:  'rgba(249,115,22,0.20)',
    glow:  'rgba(249,115,22,0.26)',
    label: '#7C2D12',
  },
  toys: {
    emoji: '🧸',
    bg:    'linear-gradient(135deg,#FEE2E2,#FECACA)',
    ring:  'rgba(239,68,68,0.20)',
    glow:  'rgba(239,68,68,0.26)',
    label: '#7F1D1D',
  },
  kitchen: {
    emoji: '🍳',
    bg:    'linear-gradient(135deg,#F0FDF4,#BBF7D0)',
    ring:  'rgba(34,197,94,0.20)',
    glow:  'rgba(34,197,94,0.26)',
    label: '#14532D',
  },
};

const FALLBACK = {
  emoji: '🛍️',
  bg:    'linear-gradient(135deg,#F3F4F6,#E5E7EB)',
  ring:  'rgba(107,114,128,0.18)',
  glow:  'rgba(107,114,128,0.20)',
  label: '#374151',
};

function CategorySkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto px-4 pb-3 no-scrollbar">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 w-[72px]">
          <div
            className="w-[60px] h-[60px] rounded-2xl skeleton-shimmer"
            style={{ borderRadius: '18px' }}
          />
          <div className="h-3 w-12 rounded-full skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}

export function CategoriesSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/catalog/categories`);
      return data;
    },
  });

  if (isLoading) return <CategorySkeleton />;

  const items = (data || []).slice(0, 8);

  return (
    <div className="flex gap-4 overflow-x-auto px-4 pb-3 no-scrollbar">
      {items.map((category: any, idx: number) => {
        const cfg = CATEGORY_CONFIG[category.slug] ?? FALLBACK;

        return (
          <Link
            key={category.id}
            href={`/browse/${category.slug}`}
            className="flex-shrink-0 outline-none"
            style={{ animationDelay: `${idx * 55}ms` }}
          >
            <div className="flex flex-col items-center gap-2 w-[72px] group">

              {/* ── Icon bubble ── */}
              <div
                className="relative w-[60px] h-[60px] flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1"
                style={{
                  background:   cfg.bg,
                  borderRadius: '18px',
                  border:       `1.5px solid ${cfg.ring}`,
                  boxShadow:    `0 2px 8px ${cfg.ring}, 0 1px 2px rgba(0,0,0,0.04)`,
                }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    borderRadius:  'inherit',
                    boxShadow:     `0 8px 24px ${cfg.glow}`,
                  }}
                />

                {/* Shine overlay */}
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    borderRadius: 'inherit',
                    background:   'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, transparent 55%)',
                  }}
                />

                {/* Emoji */}
                <span
                  className="relative text-[1.625rem] leading-none select-none transition-transform duration-300 group-hover:scale-110"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.10))' }}
                >
                  {cfg.emoji}
                </span>
              </div>

              {/* ── Label ── */}
              <span
                className="text-[11px] text-center font-bold leading-tight line-clamp-2 transition-colors duration-200 w-full"
                style={{ color: cfg.label }}
              >
                {category.name}
              </span>
            </div>
          </Link>
        );
      })}

      {/* ── "View All" pill ── */}
      <Link href="/browse" className="flex-shrink-0 outline-none">
        <div className="flex flex-col items-center gap-2 w-[72px] group">
          <div
            className="w-[60px] h-[60px] flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1"
            style={{
              background:   'linear-gradient(135deg,#EEF0FE,#E0E7FF)',
              borderRadius: '18px',
              border:       '1.5px solid rgba(61,90,241,0.18)',
              boxShadow:    '0 2px 8px rgba(61,90,241,0.10)',
            }}
          >
            <span
              className="text-[1.625rem] leading-none select-none transition-transform duration-300 group-hover:scale-110"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))' }}
            >
              🔍
            </span>
          </div>
          <span
            className="text-[11px] text-center font-bold leading-tight"
            style={{ color: '#3D5AF1' }}
          >
            View All
          </span>
        </div>
      </Link>
    </div>
  );
}
