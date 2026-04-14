'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { LatLngExpression, LeafletMouseEvent } from 'leaflet';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Loader2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number, address?: string) => void;
  defaultLocation?: { lat: number; lng: number };
}

// Kadapa default coordinates
const DEFAULT_CENTER: LatLngExpression = [14.4673, 78.8242];

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapController({ center }: { center: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export function LocationPicker({ open, onClose, onSelect, defaultLocation }: LocationPickerProps) {
  const [position, setPosition] = useState<LatLngExpression>(
    defaultLocation ? [defaultLocation.lat, defaultLocation.lng] : DEFAULT_CENTER
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (defaultLocation) {
      setPosition([defaultLocation.lat, defaultLocation.lng]);
    }
  }, [defaultLocation]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setPosition([lat, lng]);
    fetchAddress(lat, lng);
  }, []);

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
    const [lat, lng] = position as [number, number];
    onSelect(lat, lng, address);
    onClose();
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        fetchAddress(latitude, longitude);
        setIsLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLoading(false);
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Select Delivery Location</DialogTitle>
        </DialogHeader>
        
        <div className="p-4 space-y-4">
          {/* Search Bar */}
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

          {/* Map */}
          <div className="relative h-[400px] w-full overflow-hidden rounded-lg border">
            <MapContainer
              center={position}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={position} />
              <MapEvents onMapClick={handleMapClick} />
              <MapController center={position} />
            </MapContainer>
          </div>

          {/* Selected Address */}
          {address && (
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-sm font-medium">Selected Location:</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{address}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm Location
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
