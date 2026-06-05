'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AlertCircle, CheckCircle2, Clock, IndianRupee, TrendingUp, Calendar, CreditCard, ChevronRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

const API = process.env.NEXT_PUBLIC_API_URL;
const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

type BillStatus = 'pending' | 'paid' | 'overdue';

interface CommissionBill {
  id: string;
  billDate: string;
  orderCount: number;
  totalOrderValue: number;
  commissionAmount: number;
  fineAmount: number;
  daysOverdue: number;
  status: BillStatus;
  paidAt?: string;
}

const STATUS_CONFIG = {
  paid:    { label: 'Paid',    color: '#059669', bg: '#ECFDF5', icon: CheckCircle2 },
  pending: { label: 'Due',     color: '#D97706', bg: '#FFFBEB', icon: Clock },
  overdue: { label: 'Overdue', color: '#DC2626', bg: '#FEF2F2', icon: AlertCircle },
};

declare global { interface Window { Razorpay: any; } }

export default function CommissionPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['commission-bills'],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/commission/my-bills`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return data;
    },
  });

  const payMutation = useMutation({
    mutationFn: async (billId: string) => {
      const { data } = await axios.post(`${API}/commission/pay/${billId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return { ...data, billId };
    },
    onSuccess: (data) => openRazorpay(data),
    onError: () => toast.error('Failed to initiate payment'),
  });

  const verifyMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await axios.post(`${API}/commission/verify/${payload.billId}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accesstoken')}` },
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Commission paid successfully! ✅');
      queryClient.invalidateQueries({ queryKey: ['commission-bills'] });
    },
  });

  const openRazorpay = (orderData: any) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      const rzp = new window.Razorpay({
        key:         RAZORPAY_KEY,
        amount:      orderData.amount,
        currency:    orderData.currency,
        order_id:    orderData.razorpayOrderId,
        name:        'LocalKart',
        description: `Commission for ${orderData.billDetails.billDate}`,
        theme:       { color: '#3D5AF1' },
        handler: (response: any) => {
          verifyMutation.mutate({
            billId:             orderData.billId,
            razorpayPaymentId:  response.razorpay_payment_id,
            razorpayOrderId:    response.razorpay_order_id,
            razorpaySignature:  response.razorpay_signature,
          });
        },
      });
      rzp.open();
    };
    document.body.appendChild(script);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl skeleton-shimmer" />
        ))}
      </div>
    );
  }

  const bills: CommissionBill[] = data?.bills || [];
  const totalPending: number    = data?.totalPending || 0;
  const unpaidBills  = bills.filter(b => b.status !== 'paid');
  const paidBills    = bills.filter(b => b.status === 'paid');

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5" style={{ fontFamily: 'var(--font-sans)' }}>

      <div>
        <h1 className="text-xl font-black text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
          Commission Bills
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Category-based rates · Billed daily at 10 PM · ₹25/day fine if unpaid
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            { label: 'Groceries', rate: '2%' },
            { label: 'Electronics', rate: '3%' },
            { label: 'Fashion', rate: '4%' },
            { label: 'Home', rate: '4%' },
            { label: 'Beauty', rate: '5%' },
            { label: 'Accessories', rate: '5%' },
          ].map(({ label, rate }) => (
            <span key={label} className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {label} {rate}
            </span>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Pending', value: formatPrice(totalPending), color: '#DC2626', bg: '#FEF2F2', icon: IndianRupee },
          { label: 'Unpaid Bills',  value: unpaidBills.length,        color: '#D97706', bg: '#FFFBEB', icon: Clock },
          { label: 'Paid Bills',    value: paidBills.length,          color: '#059669', bg: '#ECFDF5', icon: CheckCircle2 },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm text-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl mx-auto mb-2" style={{ background: bg }}>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <p className="text-lg font-black text-gray-900">{value}</p>
            <p className="text-[10px] text-gray-400 font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {/* Unpaid bills */}
      {unpaidBills.length > 0 && (
        <div>
          <p className="text-xs font-extrabold tracking-widest uppercase text-gray-400 mb-2">
            Pending Payment
          </p>
          <div className="space-y-2">
            {unpaidBills.map(bill => {
              const cfg   = STATUS_CONFIG[bill.status];
              const Icon  = cfg.icon;
              const total = Number(bill.commissionAmount) + Number(bill.fineAmount);
              return (
                <div
                  key={bill.id}
                  className="bg-white rounded-2xl border p-4 flex items-center justify-between gap-3"
                  style={{ borderColor: bill.status === 'overdue' ? '#FECACA' : '#E5E9F2', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0" style={{ background: cfg.bg }}>
                      <Icon className="h-5 w-5" style={{ color: cfg.color }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-800">
                          {new Date(bill.billDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                        {bill.daysOverdue > 0 && (
                          <span className="text-[10px] font-bold text-red-500">
                            +{bill.daysOverdue}d fine
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {bill.orderCount} orders · ₹{Number(bill.totalOrderValue).toLocaleString('en-IN')} revenue
                      </p>
                      {bill.fineAmount > 0 && (
                        <p className="text-[11px] font-semibold text-red-500 mt-0.5">
                          Commission ₹{Number(bill.commissionAmount).toFixed(0)} + Fine ₹{Number(bill.fineAmount).toFixed(0)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="text-base font-extrabold text-gray-900">
                      {formatPrice(total)}
                    </p>
                    <button
                      onClick={() => payMutation.mutate(bill.id)}
                      disabled={payMutation.isPending}
                      className="flex items-center gap-1 text-xs font-extrabold text-white px-3 py-1.5 rounded-xl active:scale-95 transition-all"
                      style={{ background: 'linear-gradient(135deg,#3D5AF1,#6D28D9)', boxShadow: '0 2px 10px rgba(61,90,241,0.30)' }}
                    >
                      <CreditCard className="h-3 w-3" />
                      Pay Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Paid bills */}
      {paidBills.length > 0 && (
        <div>
          <p className="text-xs font-extrabold tracking-widest uppercase text-gray-400 mb-2">
            Paid History
          </p>
          <div className="space-y-2">
            {paidBills.map(bill => (
              <div
                key={bill.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between opacity-70"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: '#059669' }} />
                  <div>
                    <p className="text-sm font-bold text-gray-700">
                      {new Date(bill.billDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs text-gray-400">{bill.orderCount} orders</p>
                  </div>
                </div>
                <p className="text-sm font-extrabold text-gray-600">
                  {formatPrice(bill.commissionAmount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {bills.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-bold text-gray-600">No bills yet</p>
          <p className="text-sm text-gray-400 mt-1">Bills are generated after orders are delivered</p>
        </div>
      )}
    </div>
  );
}
