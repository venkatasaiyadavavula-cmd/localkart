'use client';

import { useMapEvents } from 'react-leaflet';

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

/** Listens for map clicks to place the pin (must be rendered inside MapContainer). */
export function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
