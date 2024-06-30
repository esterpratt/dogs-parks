interface Location {
  latitude: number;
  longitude: number;
}

enum ParkMaterial {
  GRASS = 'grass',
  SAND = 'sand',
}

interface Park {
  id: string;
  location: Location;
  name: string;
  city: string;
  address: string;
  size?: number;
  pics?: [];
  materials?: ParkMaterial[];
  shade?: number;
  hasWater?: boolean;
  hasFacilities?: boolean;
}

interface NewParkDetails {
  name: string;
  city: string;
  address: string;
  size?: number;
  location: Location;
  userId: string | null;
}

type ParkForLists = Pick<Park, 'id' | 'location' | 'name' | 'city' | 'address'>;

export type { Park, ParkForLists, Location, NewParkDetails };
export { ParkMaterial };
