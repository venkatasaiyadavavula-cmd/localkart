export interface ReverseGeocodeResult {
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  displayLabel: string;
}

/**
 * Reverse geocode coordinates using OpenStreetMap Nominatim (no API key).
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('zoom', '14');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'LocalKart/1.0 (hyperlocal marketplace)',
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) throw new Error('Geocode failed');

    const data = await response.json();
    const addr = data.address ?? {};

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.suburb ||
      addr.county ||
      addr.state_district;
    const state = addr.state;
    const pincode = addr.postcode;
    const neighbourhood = addr.neighbourhood || addr.road;

    const displayLabel = formatLocationParts({
      neighbourhood,
      city,
      state,
      latitude,
      longitude,
    });

    return {
      address: data.display_name,
      city,
      state,
      pincode,
      displayLabel,
    };
  } catch {
    return {
      displayLabel: formatLocationParts({ latitude, longitude }),
    };
  }
}

export function formatLocationParts(parts: {
  neighbourhood?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}): string {
  if (parts.city && parts.state) {
    return `${parts.city}, ${parts.state}`;
  }
  if (parts.city) return parts.city;
  if (parts.neighbourhood && parts.state) {
    return `${parts.neighbourhood}, ${parts.state}`;
  }
  if (parts.state) return parts.state;
  if (parts.latitude != null && parts.longitude != null) {
    return `${parts.latitude.toFixed(2)}°, ${parts.longitude.toFixed(2)}°`;
  }
  return '';
}

/** Forward geocode an Indian pincode to coordinates (Nominatim). */
export async function forwardGeocodePincode(
  pincode: string,
): Promise<ReverseGeocodeResult & { latitude?: number; longitude?: number }> {
  const clean = pincode.replace(/\D/g, '').slice(0, 6);
  if (clean.length !== 6) {
    return { displayLabel: '' };
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('postalcode', clean);
    url.searchParams.set('country', 'India');
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'LocalKart/1.0 (hyperlocal marketplace)',
      },
    });

    if (!response.ok) throw new Error('Pincode geocode failed');

    const results = await response.json();
    const hit = results?.[0];
    if (!hit) {
      return { displayLabel: '', pincode: clean };
    }

    const latitude = parseFloat(hit.lat);
    const longitude = parseFloat(hit.lon);
    const addr = hit.address ?? {};
    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.county ||
      addr.state_district;
    const state = addr.state;

    return {
      latitude,
      longitude,
      city,
      state,
      pincode: clean,
      address: hit.display_name,
      displayLabel: formatLocationParts({ city, state, latitude, longitude }),
    };
  } catch {
    return { displayLabel: '', pincode: clean };
  }
}

export function getLocationDisplayLabel(location: {
  city?: string;
  state?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
} | null | undefined, fallback = 'Set Location'): string {
  if (!location) return fallback;

  const fromParts = formatLocationParts({
    city: location.city,
    state: location.state,
    latitude: location.latitude,
    longitude: location.longitude,
  });

  if (fromParts) return fromParts;

  if (location.address) {
    const short = location.address.split(',').slice(0, 2).join(',').trim();
    return short || fallback;
  }

  return fallback;
}
