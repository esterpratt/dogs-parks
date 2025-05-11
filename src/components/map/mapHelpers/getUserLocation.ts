import { Geolocation } from '@capacitor/geolocation';
import { isMobile } from '../../../utils/platform';
import { DEFAULT_LOCATION } from '../../../utils/consts';

export async function getUserLocation() {
  let position: GeolocationPosition | null = null;

  try {
    if (isMobile) {
      const capPosition = await Geolocation.getCurrentPosition();
      position = {
        coords: {
          latitude: capPosition.coords.latitude,
          longitude: capPosition.coords.longitude,
        },
        timestamp: capPosition.timestamp,
      } as GeolocationPosition;
    } else {
      if ('geolocation' in navigator) {
        position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
      }
    }
  } catch (error) {
    console.error('Error getting location:', error);
    return {
      coords: {
        latitude: DEFAULT_LOCATION.lat,
        longitude: DEFAULT_LOCATION.long,
      }
    }
  }

  return position;
}
