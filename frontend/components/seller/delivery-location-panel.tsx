'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ordersApi } from '@/lib/api/orders';
import { staffWorkApi } from '@/lib/api/staff-work';

interface DeliveryLocationPanelProps {
  orderId: string;
  staffName?: string | null;
  staffPhone?: string | null;
  onLocationUpdated?: () => void;
}

export function DeliveryLocationPanel({
  orderId,
  staffName: initialName,
  staffPhone: initialPhone,
  onLocationUpdated,
}: DeliveryLocationPanelProps) {
  const [staffName, setStaffName] = useState(initialName ?? '');
  const [staffPhone, setStaffPhone] = useState(initialPhone ?? '');
  const [isSharing, setIsSharing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isAutoSharing, setIsAutoSharing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setStaffName(initialName ?? '');
    setStaffPhone(initialPhone ?? '');
  }, [initialName, initialPhone]);

  const shareLocation = async (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) toast.error('GPS not available on this device');
      return;
    }

    setIsSharing(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const isStaff = !!localStorage.getItem('staffAccessToken');
          if (isStaff) {
            await staffWorkApi.updateDeliveryLocation(orderId, {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              staffName: staffName || undefined,
              staffPhone: staffPhone || undefined,
            });
          } else {
            await ordersApi.updateDeliveryLocation(orderId, {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              staffName: staffName || undefined,
              staffPhone: staffPhone || undefined,
            });
          }
          setLastUpdate(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
          onLocationUpdated?.();
          if (!silent) toast.success('📍 Location shared with customer');
        } catch {
          if (!silent) toast.error('Failed to update location');
        } finally {
          setIsSharing(false);
        }
      },
      () => {
        if (!silent) toast.error('Could not get GPS location. Enable location access.');
        setIsSharing(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const startLiveSharing = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsAutoSharing(true);
    shareLocation();
    intervalRef.current = setInterval(() => shareLocation(true), 30000);
    toast.success('Live location sharing started (every 30s)');
  };

  const stopLiveSharing = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsAutoSharing(false);
    toast.info('Live sharing stopped');
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <div className="mt-3 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3">
      <div className="flex items-center gap-2">
        <Navigation className="h-4 w-4 text-emerald-600" />
        <p className="text-xs font-bold text-emerald-800">Live GPS Tracking</p>
        {lastUpdate && (
          <span className="ml-auto text-[10px] font-semibold text-emerald-600">Updated {lastUpdate}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Delivery staff name"
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          className="h-9 rounded-xl bg-white text-xs"
        />
        <Input
          placeholder="Staff phone"
          value={staffPhone}
          onChange={(e) => setStaffPhone(e.target.value)}
          className="h-9 rounded-xl bg-white text-xs"
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => shareLocation()}
          disabled={isSharing}
          className="h-10 flex-1 rounded-xl bg-emerald-600 text-xs font-bold hover:bg-emerald-700"
        >
          {isSharing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <MapPin className="mr-1 h-3 w-3" />}
          Share Location
        </Button>
        <Button
          onClick={startLiveSharing}
          variant="outline"
          className="h-10 flex-1 rounded-xl border-emerald-300 text-xs font-bold text-emerald-700"
        >
          Auto (30s)
        </Button>
        {isAutoSharing && (
          <Button onClick={stopLiveSharing} variant="ghost" className="h-10 rounded-xl text-xs text-gray-500">
            Stop
          </Button>
        )}
      </div>
      <p className="text-[10px] text-emerald-700/70">
        Customer can see your live location on their tracking screen
      </p>
    </div>
  );
}
