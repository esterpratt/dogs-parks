import { DEFAULT_LOCATION } from "./consts";
import { getUserLocation } from "./getUserLocation";

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
    } else {
      setIsLocationDenied(false);
    }

    if (userLocation) {
      setUserLocation({
        lat: userLocation.position.coords.latitude,
        long: userLocation.position.coords.longitude,
      });
    }
  } catch {
    setUserLocation(DEFAULT_LOCATION);
  }
}
