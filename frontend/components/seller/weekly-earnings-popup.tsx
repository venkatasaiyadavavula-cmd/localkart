'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, X, Trophy } from 'lucide-react';
import axios from 'axios';
import { formatPrice } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL;

function getWeekKey() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  return `earnings-popup-${start.toISOString().slice(0, 10)}`;
}

export function WeeklyEarningsPopup() {
  const [open, setOpen] = useState(false);
  const [earnings, setEarnings] = useState<{ net: number; orderCount: number; growth: number } | null>(null);

  useEffect(() => {
    const seen = localStorage.getItem(getWeekKey());
    if (seen) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    axios
      .get(`${API}/seller/earnings/weekly`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        const payload = data?.data ?? data;
        const current = payload?.currentWeek;
        if (current) {
          setEarnings({
            net: Number(current.net) || 0,
            orderCount: current.orderCount || 0,
            growth: payload.growth || 0,
          });
          setOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    localStorage.setItem(getWeekKey(), '1');
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && earnings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white"
            style={{ boxShadow: '0 32px 80px rgba(61,90,241,0.35)' }}
          >
            <div
              className="relative px-6 py-8 text-center text-white"
              style={{ background: 'linear-gradient(135deg,#3D5AF1 0%,#6D28D9 50%,#8B5CF6 100%)' }}
            >
              <button onClick={dismiss} className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5">
                <X className="h-4 w-4" />
              </button>

              <motion.div
                animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20"
              >
                <Trophy className="h-9 w-9" />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm font-bold uppercase tracking-widest text-white/70"
              >
                Congratulations!
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-2 text-2xl font-black"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Great week, Shop Owner!
              </motion.h2>
            </div>

            <div className="p-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="mb-2"
              >
                <Sparkles className="mx-auto h-5 w-5 text-amber-500" />
              </motion.div>

              <p className="text-sm text-gray-500">This week you earned</p>
              <p className="mt-1 text-4xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
                {formatPrice(earnings.net)}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                from <strong>{earnings.orderCount}</strong> delivered order{earnings.orderCount !== 1 ? 's' : ''}
              </p>

              {earnings.growth !== 0 && (
                <div className={`mt-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${earnings.growth > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  <TrendingUp className="h-3 w-3" />
                  {earnings.growth > 0 ? '+' : ''}{earnings.growth}% vs last week
                </div>
              )}

              <button
                onClick={dismiss}
                className="mt-6 w-full rounded-2xl py-3.5 text-sm font-extrabold text-white"
                style={{ background: 'linear-gradient(135deg,#3D5AF1,#6D28D9)', boxShadow: '0 4px 20px rgba(61,90,241,0.30)' }}
              >
                Keep Growing! 🚀
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
