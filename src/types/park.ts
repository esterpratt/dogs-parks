interface Location {
  lat: number;
  long: number;
}

enum ParkMaterial {
  GRASS = 'grass',
  SYNTHETIC_GRASS = 'Synthetic grass',
  SAND = 'sand',
  DIRT = 'dirt',
}

interface Park {
  id: string;
  location: Location;
  name: string;
  city: string;
  address: string;
  size: number | null;
  pics?: [];
  materials: ParkMaterial[] | null;
  shade: number | null;
  has_water: boolean | null;
  has_facilities: boolean | null;
}

interface NewParkDetails {
  name: string;
  city: string;
  address: string;
  size?: number;
  location: Location;
  user_id: string | null;
}

type ParkForLists = Pick<Park, 'id' | 'location' | 'name' | 'city' | 'address'>;

export type { Park, ParkForLists, Location, NewParkDetails };
export { ParkMaterial };
