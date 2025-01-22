import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export async function getUserLocation() {
  let position: GeolocationPosition | null = null;

  try {
    if (Capacitor.getPlatform() === 'web') {
      if ('geolocation' in navigator) {
        position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
      }
    } else {
      const capPosition = await Geolocation.getCurrentPosition();
      position = {
        coords: {
          latitude: capPosition.coords.latitude,
          longitude: capPosition.coords.longitude,
        },
        timestamp: capPosition.timestamp,
      } as GeolocationPosition;
    }
  } catch (error) {
    console.error('Error getting location:', error);
  }

  return position;
}
