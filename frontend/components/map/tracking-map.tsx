'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  deliveryLocation: { latitude: number; longitude: number };
  customerLocation?: Record<string, any>;
  shopLocation?:     { lat?: number; lng?: number };
}

const DELIVERY_ICON = L.divIcon({
  html: `<div style="
    width:40px;height:40px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    background:linear-gradient(135deg,#059669,#047857);
    border:3px solid white;
    box-shadow:0 4px 16px rgba(5,150,105,0.45);
    display:flex;align-items:center;justify-content:center;
  ">
    <span style="transform:rotate(45deg);font-size:16px;">🚴</span>
  </div>`,
  className: '',
  iconSize:     [40, 40],
  iconAnchor:   [20, 40],
  popupAnchor:  [0, -40],
});

const CUSTOMER_ICON = L.divIcon({
  html: `<div style="
    width:36px;height:36px;border-radius:50%;
    background:linear-gradient(135deg,#3D5AF1,#6D28D9);
    border:3px solid white;
    box-shadow:0 4px 16px rgba(61,90,241,0.45);
    display:flex;align-items:center;justify-content:center;
    font-size:16px;
  ">🏠</div>`,
  className: '',
  iconSize:    [36, 36],
  iconAnchor:  [18, 18],
});

const SHOP_ICON = L.divIcon({
  html: `<div style="
    width:32px;height:32px;border-radius:50%;
    background:linear-gradient(135deg,#F59E0B,#D97706);
    border:3px solid white;
    box-shadow:0 4px 12px rgba(245,158,11,0.40);
    display:flex;align-items:center;justify-content:center;
    font-size:14px;
  ">🏪</div>`,
  className: '',
  iconSize:    [32, 32],
  iconAnchor:  [16, 16],
});

export default function TrackingMap({ deliveryLocation, customerLocation, shopLocation }: Props) {
  const mapRef    = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const lineRef   = useRef<L.Polyline | null>(null);
  const divRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current || mapRef.current) return;

    const map = L.map(divRef.current, {
      zoomControl:       true,
      attributionControl: false,
    }).setView([deliveryLocation.latitude, deliveryLocation.longitude], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    mapRef.current = map;

    // Delivery marker
    markerRef.current = L.marker(
      [deliveryLocation.latitude, deliveryLocation.longitude],
      { icon: DELIVERY_ICON }
    ).bindPopup('🚴 Delivery Partner').addTo(map);

    // Customer marker
    if (customerLocation?.latitude && customerLocation?.longitude) {
      L.marker([customerLocation.latitude, customerLocation.longitude], { icon: CUSTOMER_ICON })
        .bindPopup('🏠 Your Location').addTo(map);
    }

    // Shop marker
    if (shopLocation?.lat && shopLocation?.lng) {
      L.marker([shopLocation.lat, shopLocation.lng], { icon: SHOP_ICON })
        .bindPopup('🏪 Shop').addTo(map);
    }

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update delivery marker on live location change
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const newLatLng = L.latLng(deliveryLocation.latitude, deliveryLocation.longitude);
    markerRef.current.setLatLng(newLatLng);

    // Smooth pan to new location
    mapRef.current.panTo(newLatLng, { animate: true, duration: 1 });

    // Draw route line
    if (lineRef.current) lineRef.current.remove();
    if (customerLocation?.latitude && customerLocation?.longitude) {
      const customerLatLng = L.latLng(customerLocation.latitude, customerLocation.longitude);
      lineRef.current = L.polyline(
        [newLatLng, customerLatLng],
        { color: '#3D5AF1', weight: 3, dashArray: '6, 8', opacity: 0.7 }
      ).addTo(mapRef.current);
    }
  }, [deliveryLocation.latitude, deliveryLocation.longitude]);

  return <div ref={divRef} style={{ width: '100%', height: '100%' }} />;
}
