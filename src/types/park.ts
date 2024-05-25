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
  hasShade?: boolean;
  hasWater?: boolean;
  hasFacilities?: boolean;
}

type ParkForLists = Pick<Park, 'id' | 'location' | 'name' | 'city' | 'address'>;

export type { Park, ParkForLists, Location };
export { ParkMaterial };
