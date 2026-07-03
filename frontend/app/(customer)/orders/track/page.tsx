'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import dynamic from 'next/dynamic';
import {
  ChevronLeft, Phone, MapPin, Package,
  CheckCircle2, Truck, Store,
  Navigation, Wifi, WifiOff, AlertCircle,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL;
const WS  = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(/\/api\/v1\/?$/, '');
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

const LeafletMap = dynamic(() => import('@/components/map/tracking-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-3xl">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  ),
});

const STATUS_STEPS = [
  { key: 'confirmed',        label: 'Order Confirmed',  icon: CheckCircle2, color: '#3D5AF1' },
  { key: 'processing',       label: 'Being Prepared',   icon: Package,      color: '#F59E0B' },
  { key: 'ready_for_pickup', label: 'Ready for Pickup', icon: Store,        color: '#8B5CF6' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck,        color: '#059669' },
  { key: 'delivered',        label: 'Delivered',        icon: CheckCircle2, color: '#10B981' },
];

const STATUS_ORDER = STATUS_STEPS.map(s => s.key);

interface LiveLocation { latitude: number; longitude: number; updatedAt: string; staffName?: string; }

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F7FA' }}>
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}

function TrackOrderContent() {
  const params  = useSearchParams();
  const orderId = params.get('id') ?? '';
  const router  = useRouter();

  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [connected,    setConnected]    = useState(false);
  const [orderStatus,  setOrderStatus]  = useState('');
  const socketRef = useRef<Socket | null>(null);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/orders/${orderId}`, { headers: auth() });
      return unwrapApiData(data);
    },
    enabled: !!orderId,
  });

  useEffect(() => {
    if (order) {
      setOrderStatus(order.status);
      if (order.deliveryLatitude && order.deliveryLongitude) {
        setLiveLocation({
          latitude: Number(order.deliveryLatitude),
          longitude: Number(order.deliveryLongitude),
          updatedAt: order.locationUpdatedAt ?? new Date().toISOString(),
          staffName: order.deliveryStaffName,
        });
      }
    }
  }, [order]);

  useEffect(() => {
    if (!orderId) return;
    const socket = io(`${WS}/tracking`, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-order', { orderId });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('location-update', (data: LiveLocation) => setLiveLocation(data));
    socket.on('status-update', (data: { status: string }) => {
      setOrderStatus(data.status);
      const step = STATUS_STEPS.find(s => s.key === data.status);
      if (step) toast.success(`${step.label}!`);
    });

    return () => { socket.disconnect(); };
  }, [orderId]);

  const currentStepIdx   = STATUS_ORDER.indexOf(orderStatus);
  const isOutForDelivery = orderStatus === 'out_for_delivery';
  const isDelivered      = orderStatus === 'delivered';

  if (!orderId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: '#F5F7FA' }}>
        <AlertCircle className="h-12 w-12 text-amber-500" />
        <h1 className="text-lg font-bold text-gray-900">Invalid tracking link</h1>
        <p className="text-sm text-gray-500">Open an order from My Orders and tap Track Order.</p>
        <button onClick={() => router.push('/orders')} className="mt-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold">
          Go to My Orders
        </button>
      </div>
    );
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F7FA' }}>
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (isError || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: '#F5F7FA' }}>
        <AlertCircle className="h-12 w-12 text-amber-500" />
        <h1 className="text-lg font-bold text-gray-900">Order not found</h1>
        <p className="text-sm text-gray-500">This order may have been removed or you do not have access.</p>
        <button onClick={() => router.push('/orders')} className="mt-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold">
          Go to My Orders
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F7FA', fontFamily: 'var(--font-sans)' }}>

      {/* Header */}
      <div className="glass sticky top-0 z-40 border-b border-white/60 shadow-soft-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-white border border-gray-100 shadow-xs flex items-center justify-center">
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <div>
              <p className="text-sm font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>Track Order</p>
              <p className="text-[11px] text-gray-400">#{order?.orderNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: connected ? '#ECFDF5' : '#F3F4F6' }}>
            {connected
              ? <><Wifi className="h-3 w-3" style={{ color: '#10B981' }} /><span className="text-[10px] font-extrabold" style={{ color: '#10B981' }}>LIVE</span></>
              : <><WifiOff className="h-3 w-3 text-gray-400" /><span className="text-[10px] font-bold text-gray-400">Connecting...</span></>
            }
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 space-y-4">

        {/* Map */}
        <div className="relative rounded-3xl overflow-hidden border border-gray-100" style={{ height: '260px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
          {isOutForDelivery && (liveLocation || (order?.deliveryLatitude && order?.deliveryLongitude)) ? (
            <>
              <LeafletMap
                deliveryLocation={liveLocation ?? {
                  latitude: Number(order.deliveryLatitude),
                  longitude: Number(order.deliveryLongitude),
                  updatedAt: order.locationUpdatedAt ?? new Date().toISOString(),
                }}
                customerLocation={order?.deliveryAddress}
                shopLocation={{ lat: order?.shop?.latitude, lng: order?.shop?.longitude }}
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(16,185,129,0.95)', boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[11px] font-extrabold text-white">Live tracking</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg,#EEF0FE,#F0EEFF)' }}>
              <div className="w-14 h-14 rounded-3xl flex items-center justify-center mb-3" style={{ background: 'white', boxShadow: '0 4px 16px rgba(61,90,241,0.15)' }}>
                <Navigation className="h-7 w-7" style={{ color: '#3D5AF1' }} />
              </div>
              <p className="text-sm font-extrabold text-gray-700">
                {isDelivered ? '✅ Delivered!' : 'Live map activates during delivery'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {STATUS_STEPS.find(s => s.key === orderStatus)?.label ?? orderStatus}
              </p>
            </div>
          )}
        </div>

        {/* Delivery staff */}
        {isOutForDelivery && order?.deliveryStaffName && (
          <div className="bg-white rounded-3xl border border-gray-100 p-4 flex items-center justify-between" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-extrabold text-white" style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
                {order.deliveryStaffName[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-extrabold text-gray-900">{order.deliveryStaffName}</p>
                <p className="text-xs text-gray-400">Delivery Partner</p>
                {liveLocation && <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#10B981' }}>📍 {new Date(liveLocation.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>}
              </div>
            </div>
            {order.deliveryStaffPhone && (
              <a href={`tel:${order.deliveryStaffPhone}`}>
                <button className="w-11 h-11 rounded-2xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 4px 12px rgba(5,150,105,0.30)' }}>
                  <Phone className="h-4.5 w-4.5" />
                </button>
              </a>
            )}
          </div>
        )}

        {/* Scam warning */}
        {isOutForDelivery && (
          <div className="rounded-2xl p-3.5 flex items-start gap-3 border" style={{ background: '#FFFBEB', borderColor: 'rgba(245,158,11,0.25)' }}>
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-amber-700 leading-relaxed">
              Pay only through LocalKart. Never give cash to delivery person without OTP. <strong>OTP verify చేయకుండా డబ్బులు ఇవ్వకండి.</strong>
            </p>
          </div>
        )}

        {/* Progress steps */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <p className="text-sm font-extrabold text-gray-700 mb-4" style={{ fontFamily: 'var(--font-display)' }}>Order Progress</p>
          {STATUS_STEPS.map((step, idx) => {
            const Icon      = step.icon;
            const isDone    = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            const isLast    = idx === STATUS_STEPS.length - 1;
            return (
              <div key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-500"
                    style={{ background: isDone ? step.color : '#F3F4F6', transform: isCurrent ? 'scale(1.1)' : 'scale(1)', boxShadow: isCurrent ? `0 4px 16px ${step.color}45` : 'none' }}>
                    <Icon className="h-4 w-4" style={{ color: isDone ? 'white' : '#D1D5DB' }} />
                  </div>
                  {!isLast && <div className="w-0.5 flex-1 my-1 transition-all duration-700" style={{ minHeight: '24px', background: idx < currentStepIdx ? step.color : '#E5E9F2' }} />}
                </div>
                <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-5'}`}>
                  <p className="text-sm font-extrabold leading-none mt-2" style={{ color: isDone ? '#111827' : '#9CA3AF' }}>{step.label}</p>
                  {isCurrent && <p className="text-[11px] font-semibold mt-1" style={{ color: step.color }}>
                    {step.key === 'out_for_delivery' ? (liveLocation ? '📍 Live location active' : '🚴 On the way') : '⏳ In progress...'}
                  </p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Address */}
        <div className="bg-white rounded-3xl border border-gray-100 p-4 flex items-start gap-3" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#EEF0FE' }}>
            <MapPin className="h-4 w-4" style={{ color: '#3D5AF1' }} />
          </div>
          <div>
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wide mb-1">Delivery Address</p>
            <p className="text-sm font-semibold text-gray-700">{order?.deliveryAddress?.address ?? order?.deliveryAddress?.city ?? '—'}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
