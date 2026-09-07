import { useCallback, useState } from 'react';

/**
 * Opt-in browser geolocation for challenge submission.
 * Never blocks submission: caller decides whether to proceed on denial/error.
 */
export function useGeolocation() {
  const [status, setStatus] = useState('idle'); // idle | detecting | granted | denied | unavailable | timeout
  const [location, setLocation] = useState(null); // { lat, lng, accuracy }

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('unavailable');
      return;
    }
    setStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setStatus('granted');
      },
      (err) => {
        setLocation(null);
        setStatus(err.code === err.TIMEOUT ? 'timeout' : 'denied');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return { status, location, request };
}
