interface Location {
  latitude: number;
  longitude: number;
}

enum ParkMaterial {
  GARSS = 'grass',
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

export type { Park, Location };
