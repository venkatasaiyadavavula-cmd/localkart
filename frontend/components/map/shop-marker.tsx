'use client';

import { Marker, Popup } from 'react-leaflet';
import { Store, MapPin } from 'lucide-react';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import Link from 'next/link';
import { formatDistance } from '@/lib/utils';

interface ShopMarkerProps {
  shop: {
    id: string;
    name: string;
    slug: string;
    latitude: number;
    longitude: number;
    distance?: number;
    logoImage?: string;
    address: string;
  };
}

// Custom marker icon
const createShopIcon = (isSelected: boolean = false) => {
  const size = isSelected ? 40 : 32;
  const html = renderToString(
    <div
      style={{
        backgroundColor: isSelected ? '#0B63E5' : '#FFFFFF',
        borderRadius: '50%',
        padding: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        border: '2px solid #0B63E5',
      }}
    >
      <Store size={size - 16} color={isSelected ? '#FFFFFF' : '#0B63E5'} />
    </div>
  );

  return L.divIcon({
    html,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

export function ShopMarker({ shop }: ShopMarkerProps) {
  const position: [number, number] = [shop.latitude, shop.longitude];

  return (
    <Marker position={position} icon={createShopIcon()}>
      <Popup className="shop-popup" minWidth={200}>
        <div className="p-2">
          <Link href={`/shop/${shop.slug}`} className="font-semibold hover:text-primary">
            {shop.name}
          </Link>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{shop.address}</span>
          </div>
          {shop.distance && (
            <p className="mt-1 text-xs font-medium text-primary">
              {formatDistance(shop.distance)} away
            </p>
          )}
          <Link
            href={`/shop/${shop.slug}`}
            className="mt-2 block w-full rounded bg-primary px-3 py-1 text-center text-xs text-white hover:bg-primary/90"
          >
            View Shop
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}
