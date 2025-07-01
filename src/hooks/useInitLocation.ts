import { useEffect } from 'react';
import { useUserLocation } from '../context/LocationContext';
import { initializeUserLocation } from '../utils/initializeUserLocation';

export const useInitLocation = () => {
  const userLocation = useUserLocation((state) => state.userLocation);
  const setUserLocation = useUserLocation((state) => state.setUserLocation);
  const setIsLocationDenied = useUserLocation((state) => state.setIsLocationDenied);

  useEffect(() => {
    if (!userLocation) {
      initializeUserLocation({ setUserLocation, setIsLocationDenied });
    }
  }, [userLocation, setIsLocationDenied, setUserLocation]);

  return userLocation;
};
