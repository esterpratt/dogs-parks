import { Geolocation } from '@capacitor/geolocation';
import { isMobile } from '../../../utils/platform';

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
  }

  return position;
}
