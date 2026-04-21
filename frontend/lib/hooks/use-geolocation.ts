import { useState, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
  });

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: 'Geolocation is not supported', loading: false }));
      return Promise.reject('Geolocation not supported');
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setState({
            latitude,
            longitude,
            error: null,
            loading: false,
          });
          resolve({ latitude, longitude });
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          if (error.code === 1) errorMessage = 'Location permission denied';
          if (error.code === 2) errorMessage = 'Location unavailable';
          if (error.code === 3) errorMessage = 'Location request timeout';
          setState({
            latitude: null,
            longitude: null,
            error: errorMessage,
            loading: false,
          });
          reject(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  const resetLocation = useCallback(() => {
    setState({
      latitude: null,
      longitude: null,
      error: null,
      loading: false,
    });
  }, []);

  return {
    ...state,
    detectLocation,
    resetLocation,
  };
}
