import { create } from 'zustand';
import { Location } from '../types/park';

interface LocationStoreProps {
  userLocation: Location | undefined;
  setUserLocation: (location: Location) => void;
}

export const useUserLocation = create<LocationStoreProps>((set) => ({
  userLocation: undefined,
  setUserLocation: (location: Location) =>
    set(() => ({ userLocation: location })),
}));
