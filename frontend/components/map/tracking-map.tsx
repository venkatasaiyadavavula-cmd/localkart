'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  deliveryLocation?: { latitude: number; longitude: number } | null;
  customerLocation?: Record<string, any>;
  shopLocation?: { lat?: number; lng?: number };
  showRoute?: boolean;
  pulseDelivery?: boolean;
}

function makeDeliveryIcon(pulse: boolean) {
  const pulseRing = pulse
    ? `<div style="
        position:absolute;inset:-8px;border-radius:50%;
        border:2px solid rgba(5,150,105,0.5);
        animation:lk-pulse 2s ease-out infinite;
      "></div>`
    : '';

  return L.divIcon({
    html: `<div style="position:relative;width:44px;height:44px;">
      ${pulseRing}
      <div style="
        width:40px;height:40px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        background:linear-gradient(135deg,#059669,#047857);
        border:3px solid white;
        box-shadow:0 4px 20px rgba(5,150,105,0.5);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:16px;">🚴</span>
      </div>
    </div>
    <style>@keyframes lk-pulse{0%{transform:scale(0.8);opacity:1}100%{transform:scale(1.6);opacity:0}}</style>`,
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
  });
}

const CUSTOMER_ICON = L.divIcon({
  html: `<div style="
    width:38px;height:38px;border-radius:50%;
    background:linear-gradient(135deg,#3D5AF1,#6D28D9);
    border:3px solid white;
    box-shadow:0 4px 16px rgba(61,90,241,0.45);
    display:flex;align-items:center;justify-content:center;font-size:16px;
  ">🏠</div>`,
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const SHOP_ICON = L.divIcon({
  html: `<div style="
    width:34px;height:34px;border-radius:50%;
    background:linear-gradient(135deg,#F59E0B,#D97706);
    border:3px solid white;
    box-shadow:0 4px 12px rgba(245,158,11,0.40);
    display:flex;align-items:center;justify-content:center;font-size:14px;
  ">🏪</div>`,
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

export default function TrackingMap({
  deliveryLocation,
  customerLocation,
  shopLocation,
  showRoute = true,
  pulseDelivery = true,
}: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);
  const lineRef = useRef<L.Polyline | null>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const boundsFitted = useRef(false);

  const centerLat =
    deliveryLocation?.latitude ??
    customerLocation?.latitude ??
    shopLocation?.lat ??
    14.4673;
  const centerLng =
    deliveryLocation?.longitude ??
    customerLocation?.longitude ??
    shopLocation?.lng ??
    78.8242;

  useEffect(() => {
    if (!divRef.current || mapRef.current) return;

    const map = L.map(divRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([centerLat, centerLng], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    if (shopLocation?.lat && shopLocation?.lng) {
      L.marker([shopLocation.lat, shopLocation.lng], { icon: SHOP_ICON })
        .bindPopup('🏪 Shop')
        .addTo(map);
    }

    if (customerLocation?.latitude && customerLocation?.longitude) {
      L.marker([customerLocation.latitude, customerLocation.longitude], { icon: CUSTOMER_ICON })
        .bindPopup('🏠 Your Location')
        .addTo(map);
    }

    if (deliveryLocation) {
      deliveryMarkerRef.current = L.marker(
        [deliveryLocation.latitude, deliveryLocation.longitude],
        { icon: makeDeliveryIcon(pulseDelivery) },
      )
        .bindPopup('🚴 Delivery Partner')
        .addTo(map);
    }

    const points: L.LatLngExpression[] = [];
    if (shopLocation?.lat && shopLocation?.lng) points.push([shopLocation.lat, shopLocation.lng]);
    if (deliveryLocation) points.push([deliveryLocation.latitude, deliveryLocation.longitude]);
    if (customerLocation?.latitude && customerLocation?.longitude) {
      points.push([customerLocation.latitude, customerLocation.longitude]);
    }
    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 });
      boundsFitted.current = true;
    }

    return () => {
      map.remove();
      mapRef.current = null;
      deliveryMarkerRef.current = null;
      boundsFitted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !deliveryLocation) return;

    const newLatLng = L.latLng(deliveryLocation.latitude, deliveryLocation.longitude);

    if (!deliveryMarkerRef.current) {
      deliveryMarkerRef.current = L.marker(newLatLng, { icon: makeDeliveryIcon(pulseDelivery) })
        .bindPopup('🚴 Delivery Partner')
        .addTo(mapRef.current);
    } else {
      deliveryMarkerRef.current.setLatLng(newLatLng);
    }

    mapRef.current.panTo(newLatLng, { animate: true, duration: 0.8 });

    if (lineRef.current) lineRef.current.remove();

    if (
      showRoute &&
      customerLocation?.latitude &&
      customerLocation?.longitude
    ) {
      const customerLatLng = L.latLng(customerLocation.latitude, customerLocation.longitude);
      lineRef.current = L.polyline([newLatLng, customerLatLng], {
        color: '#3D5AF1',
        weight: 4,
        dashArray: '10, 12',
        opacity: 0.75,
        lineCap: 'round',
      }).addTo(mapRef.current);
    }
  }, [deliveryLocation?.latitude, deliveryLocation?.longitude, showRoute]);

  return <div ref={divRef} className="h-full w-full" />;
}
