'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import - SSR disable cheyyadam
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
);

interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number, address?: string) => void;
  defaultLocation?: { lat: number; lng: number };
}

const DEFAULT_LAT = 14.4673;
const DEFAULT_LNG = 78.8242;

export function LocationPicker({ open, onClose, onSelect, defaultLocation }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>(
    defaultLocation ? [defaultLocation.lat, defaultLocation.lng] : [DEFAULT_LAT, DEFAULT_LNG]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      import('leaflet').then(L => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
      });
      import('leaflet/dist/leaflet.css');
    }
  }, []);

  useEffect(() => {
    if (defaultLocation) {
      setPosition([defaultLocation.lat, defaultLocation.lng]);
    }
  }, [defaultLocation]);

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      setAddress(data.display_name || '');
    } catch (error) {
      console.error('Failed to fetch address:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ', Kadapa, Andhra Pradesh'
        )}`
      );
      const data = await response.json();
      if (data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setPosition([lat, lng]);
        setAddress(data[0].display_name);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    onSelect(position[0], position[1], address);
    onClose();
  };

  const handleUseCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        fetchAddress(latitude, longitude);
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Select Delivery Location</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for area, street..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
            <Button variant="outline" onClick={handleUseCurrentLocation} disabled={isLoading}>
              <MapPin className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative h-[400px] w-full overflow-hidden rounded-lg border">
            {isMounted && (
              <MapContainer
                center={position}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position} />
              </MapContainer>
            )}
          </div>

          {address && (
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-sm font-medium">Selected Location:</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{address}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm Location</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
