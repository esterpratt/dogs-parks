import { Geolocation } from '@capacitor/geolocation';
import { isMobile } from './platform';
import { DEFAULT_LOCATION } from './consts';
import { runWhenActive } from './runWhenActive';

let inFlightRequest: Promise<{
  position: GeolocationPosition;
  error?: unknown;
} | null> | null = null;

// Solve the issue of:
// Android returns an error when 2 requests are been sent at the same time
export async function getUserLocation() {
  if (inFlightRequest) {
    return inFlightRequest;
  }

  inFlightRequest = getUserLocationInternal();

  try {
    const result = await inFlightRequest;
    return result;
  } finally {
    inFlightRequest = null;
  }
}

async function getUserLocationInternal() {
  let position: { position: GeolocationPosition; error?: unknown } | null =
    null;

  try {
    if (isMobile()) {
      let permStatus = await Geolocation.checkPermissions();

      if (
        permStatus.location === 'prompt' ||
        permStatus.location === 'prompt-with-rationale'
      ) {
        await runWhenActive(Geolocation.requestPermissions);
        permStatus = await Geolocation.checkPermissions();
      }

      if (permStatus.location === 'denied') {
        throw new Error('PERMISSION_DENIED');
      }

      const capPosition = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });

      position = {
        position: {
          coords: {
            latitude: capPosition.coords.latitude,
            longitude: capPosition.coords.longitude,
          },
          timestamp: capPosition.timestamp,
        } as GeolocationPosition,
      };
    } else {
      if ('geolocation' in navigator) {
        position = {
          position: await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          }),
        };
      }
    }
  } catch (error) {
    console.error('Error getting location:', error);
    position = {
      error,
      position: {
        coords: {
          latitude: DEFAULT_LOCATION.lat,
          longitude: DEFAULT_LOCATION.long,
        },
      } as GeolocationPosition,
    };
  }

  return position;
}
