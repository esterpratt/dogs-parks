import { Geolocation } from '@capacitor/geolocation';
import { isMobile } from './platform';
import { DEFAULT_LOCATION } from './consts';

export async function getUserLocation() {
  let position: { position: GeolocationPosition; error?: unknown } | null =
    null;

  try {
    if (isMobile()) {
      let permStatus = await Geolocation.checkPermissions();

      if (
        permStatus.location === 'prompt' ||
        permStatus.location === 'prompt-with-rationale'
      ) {
        await Geolocation.requestPermissions();
        permStatus = await Geolocation.checkPermissions();
      }

      if (permStatus.location === 'denied') {
        throw new Error('PERMISSION_DENIED');
      }

      const capPosition = await Geolocation.getCurrentPosition();
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
