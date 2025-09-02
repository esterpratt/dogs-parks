import { getUserLocation } from './getUserLocation';

export async function initializeUserLocation({
  setUserLocation,
  setIsLocationDenied,
}: {
  setUserLocation: (loc: { lat: number; long: number }) => void;
  setIsLocationDenied: (denied: boolean) => void;
}) {
  try {
    const userLocation = await getUserLocation();

    if (userLocation?.error) {
      setIsLocationDenied(true);
      return;
    }

    if (userLocation) {
      setIsLocationDenied(false);
      setUserLocation({
        lat: userLocation.position.coords.latitude,
        long: userLocation.position.coords.longitude,
      });
    }
  } catch (error) {
    console.error(
      `There was an error initialize user lcoation: `,
      JSON.stringify(error)
    );
  }
}
