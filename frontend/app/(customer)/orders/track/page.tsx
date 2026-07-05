'use client';

import { useEffect, useState, useRef, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Phone,
  MapPin,
  Package,
  AlertCircle,
  Wifi,
  WifiOff,
  Headphones,
  Navigation,
  Store,
  Sparkles,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { unwrapApiData } from '@/lib/utils';
import { haversineKm, estimateEtaMinutes } from '@/lib/geo';
import { TrackingHero } from '@/components/orders/tracking-hero';
import { OrderProgress } from '@/components/orders/order-progress';

const API = process.env.NEXT_PUBLIC_API_URL;
const WS = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(
  /\/api\/v1\/?$/,
  '',
);
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

const LeafletMap = dynamic(() => import('@/components/map/tracking-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-3xl bg-gray-100">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
});

interface LiveLocation {
  latitude: number;
  longitude: number;
  updatedAt: string;
  staffName?: string;
}

function TrackOrderContent() {
  const params = useSearchParams();
  const orderId = params.get('id') ?? '';
  const router = useRouter();
  const queryClient = useQueryClient();

  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [connected, setConnected] = useState(false);
  const [orderStatus, setOrderStatus] = useState('');
  const socketRef = useRef<Socket | null>(null);

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/orders/${orderId}`, { headers: auth() });
      return unwrapApiData(data);
    },
    enabled: !!orderId,
    refetchInterval: connected ? false : 15000,
  });

  const customerCoords = useMemo(() => {
    const addr = order?.deliveryAddress ?? order?.shippingAddress;
    if (addr?.latitude && addr?.longitude) {
      return { lat: Number(addr.latitude), lng: Number(addr.longitude) };
    }
    return null;
  }, [order]);

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

  const connectSocket = useCallback(() => {
    if (!orderId) return;
    socketRef.current?.disconnect();

    const socket = io(`${WS}/tracking`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-order', { orderId });
      refetch();
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('reconnect', () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    });
    socket.on('location-update', (data: LiveLocation) => setLiveLocation(data));
    socket.on('status-update', (data: { status: string }) => {
      setOrderStatus(data.status);
      refetch();
      if (data.status === 'delivered') {
        toast.success('🎉 Order delivered! Enjoy!');
      } else if (data.status === 'cancelled') {
        toast.error('Order was cancelled');
      }
    });

    return socket;
  }, [orderId, refetch, queryClient]);

  useEffect(() => {
    const socket = connectSocket();
    return () => {
      socket?.disconnect();
    };
  }, [connectSocket]);

  const isOutForDelivery = orderStatus === 'out_for_delivery';
  const isDelivered = orderStatus === 'delivered';
  const isCancelled = orderStatus === 'cancelled';
  const showMap = !isCancelled && (customerCoords || order?.shop?.latitude);

  const { distanceKm, etaMinutes } = useMemo(() => {
    if (!isOutForDelivery || !liveLocation || !customerCoords) {
      return { distanceKm: null, etaMinutes: null };
    }
    const km = haversineKm(
      liveLocation.latitude,
      liveLocation.longitude,
      customerCoords.lat,
      customerCoords.lng,
    );
    return { distanceKm: km, etaMinutes: estimateEtaMinutes(km) };
  }, [isOutForDelivery, liveLocation, customerCoords]);

  const liveHint =
    isOutForDelivery && liveLocation
      ? `📍 Live · updated ${new Date(liveLocation.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
      : undefined;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#F5F7FA' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-semibold text-gray-500">Loading live tracking...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{ background: '#F5F7FA' }}>
        <Package className="h-12 w-12 text-gray-300" />
        <p className="mt-4 text-lg font-bold text-gray-700">Order not found</p>
        <button onClick={() => router.push('/orders')} className="mt-4 text-sm font-semibold text-primary">
          View all orders
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: '#F0F2F8', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <div>
              <p className="text-sm font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
                Live Tracking
              </p>
              <p className="text-[11px] text-gray-400">Real-time order updates</p>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: connected ? '#ECFDF5' : '#F3F4F6' }}
          >
            {connected ? (
              <>
                <Wifi className="h-3 w-3" style={{ color: '#10B981' }} />
                <span className="text-[10px] font-extrabold" style={{ color: '#10B981' }}>
                  LIVE
                </span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-400">Connecting...</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-4">
        {/* Hero status card */}
        <TrackingHero
          status={orderStatus}
          orderNumber={order.orderNumber}
          etaMinutes={etaMinutes}
          distanceKm={distanceKm}
          connected={connected}
        />

        {/* Delivered celebration */}
        <AnimatePresence>
          {isDelivered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4"
            >
              <Sparkles className="h-6 w-6 text-emerald-600" />
              <div>
                <p className="text-sm font-extrabold text-emerald-800">Delivery Complete!</p>
                <p className="text-xs text-emerald-600">
                  మీ order successfully deliver అయింది. LocalKart choose చేసినందుకు thanks!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map */}
        <div
          className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white"
          style={{ height: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
        >
          {showMap ? (
            <>
              <LeafletMap
                deliveryLocation={
                  isOutForDelivery && liveLocation
                    ? liveLocation
                    : isOutForDelivery && order.deliveryLatitude
                      ? {
                          latitude: Number(order.deliveryLatitude),
                          longitude: Number(order.deliveryLongitude),
                          updatedAt: order.locationUpdatedAt,
                        }
                      : null
                }
                customerLocation={order.deliveryAddress ?? order.shippingAddress}
                shopLocation={{ lat: order.shop?.latitude, lng: order.shop?.longitude }}
                showRoute={isOutForDelivery}
                pulseDelivery={isOutForDelivery}
              />
              {isOutForDelivery && (
                <div
                  className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5"
                  style={{
                    background: 'rgba(16,185,129,0.95)',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
                  }}
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  <span className="text-[11px] font-extrabold text-white">Live GPS tracking</span>
                </div>
              )}
              {!isOutForDelivery && !isDelivered && (
                <div className="absolute bottom-3 left-3 right-3 rounded-2xl bg-white/90 px-3 py-2 backdrop-blur-sm">
                  <p className="text-[11px] font-semibold text-gray-600">
                    <Store className="mr-1 inline h-3 w-3" />
                    Shop & your location · Live GPS activates when out for delivery
                  </p>
                </div>
              )}
            </>
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#EEF0FE,#F0EEFF)' }}
            >
              <Navigation className="h-8 w-8 text-primary" />
              <p className="mt-2 text-sm font-bold text-gray-600">Map unavailable</p>
            </div>
          )}
        </div>

        {/* Delivery partner card */}
        {isOutForDelivery && (order.deliveryStaffName || liveLocation?.staffName) && (
          <div
            className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-4"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-extrabold text-white"
                style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}
              >
                {(order.deliveryStaffName ?? liveLocation?.staffName ?? 'D')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-extrabold text-gray-900">
                  {order.deliveryStaffName ?? liveLocation?.staffName}
                </p>
                <p className="text-xs text-gray-400">Your Delivery Partner</p>
                {etaMinutes != null && (
                  <p className="mt-0.5 text-[11px] font-bold text-emerald-600">
                    Arriving in ~{etaMinutes} min
                  </p>
                )}
              </div>
            </div>
            {order.deliveryStaffPhone && (
              <a href={`tel:${order.deliveryStaffPhone}`}>
                <button
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                  style={{
                    background: 'linear-gradient(135deg,#059669,#047857)',
                    boxShadow: '0 4px 12px rgba(5,150,105,0.30)',
                  }}
                >
                  <Phone className="h-5 w-5" />
                </button>
              </a>
            )}
          </div>
        )}

        {/* COD safety */}
        {isOutForDelivery && (
          <div
            className="flex items-start gap-3 rounded-2xl border p-3.5"
            style={{ background: '#FFFBEB', borderColor: 'rgba(245,158,11,0.25)' }}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
            <p className="text-xs font-semibold leading-relaxed text-amber-700">
              Pay only through LocalKart COD. OTP verify చేయకుండా డబ్బులు ఇవ్వకండి.
            </p>
          </div>
        )}

        {/* Order items summary */}
        {order.items?.length > 0 && (
          <div
            className="rounded-3xl border border-gray-100 bg-white p-4"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-extrabold text-gray-700" style={{ fontFamily: 'var(--font-display)' }}>
                Order Items
              </p>
              <Link href={`/orders/${order.id}`} className="text-[11px] font-bold text-primary">
                View details →
              </Link>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {order.items.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex-shrink-0 text-center">
                  <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-gray-100">
                    {item.productImage ? (
                      <Image src={item.productImage} alt={item.productName} fill className="object-cover" />
                    ) : (
                      <Package className="absolute inset-0 m-auto h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <p className="mt-1 max-w-[56px] truncate text-[10px] text-gray-500">{item.productName}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              from <span className="font-semibold text-gray-600">{order.shop?.name}</span>
            </p>
          </div>
        )}

        {/* Progress timeline */}
        <div
          className="rounded-3xl border border-gray-100 bg-white p-5"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
        >
          <p className="mb-4 text-sm font-extrabold text-gray-700" style={{ fontFamily: 'var(--font-display)' }}>
            Order Journey
          </p>
          <OrderProgress status={orderStatus} liveHint={liveHint} />
        </div>

        {/* Address */}
        <div
          className="flex items-start gap-3 rounded-3xl border border-gray-100 bg-white p-4"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl" style={{ background: '#EEF0FE' }}>
            <MapPin className="h-4 w-4" style={{ color: '#3D5AF1' }} />
          </div>
          <div>
            <p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-gray-400">Delivery Address</p>
            <p className="text-sm font-semibold text-gray-700">
              {order.deliveryAddress?.name ?? order.shippingAddress?.name}
            </p>
            <p className="text-xs text-gray-500">
              {order.deliveryAddress?.address ?? order.shippingAddress?.address},{' '}
              {order.deliveryAddress?.city ?? order.shippingAddress?.city}
            </p>
          </div>
        </div>

        {/* Help strip */}
        <div className="flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <Headphones className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Need help?</p>
              <p className="text-xs text-gray-400">Contact shop or support</p>
            </div>
          </div>
          {order.shop?.contactPhone && (
            <a href={`tel:${order.shop.contactPhone}`}>
              <button className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white">Call Shop</button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F7FA' }}>
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
