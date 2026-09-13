import { AppLanguage } from './language';

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

// Park size is stored as a user-selected category instead of estimated square meters.
enum ParkSizeCategory {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  HUGE = 'huge',
}

interface Park {
  id: string;
  location: Location;
  name: string;
  city: string;
  address: string;
  size_category: ParkSizeCategory | null;
  materials: ParkMaterial[] | null;
  shade: number | null;
  has_facilities: boolean | null;
}

interface ParkTranslation {
  id: string;
  park_id: string;
  language: AppLanguage;
  name: string;
  city: string;
  address: string;
  created_at: string;
  updated_at: string;
}

interface TranslatedPark {
  id: string;
  location: Location;
  name: string;
  city: string;
  address: string;
  size_category: ParkSizeCategory | null;
  materials: ParkMaterial[] | null;
  shade: number | null;
  has_facilities: boolean | null;
}

// Normalized JSON structure for parks with translations
interface ParkJSON {
  id: string;
  name: string;
  city: string;
  address: string;
  location: Location;
}

// Raw park data structure from JSON files (before normalization)
interface RawParkData {
  id: string;
  name: string;
  city: string;
  address: string;
  location: Location;
}

interface NewParkDetails {
  name: string;
  city: string;
  address: string;
  size_category: ParkSizeCategory | null;
  location: Location;
  user_id: string;
}

// Only editable general park details are accepted by the update service.
interface UpdateParkDetails {
  size_category?: ParkSizeCategory;
  materials?: ParkMaterial[];
  shade?: number;
  has_facilities?: boolean;
}

export type {
  Park,
  ParkTranslation,
  TranslatedPark,
  ParkJSON,
  RawParkData,
  Location,
  NewParkDetails,
  UpdateParkDetails,
};
export { ParkMaterial, ParkSizeCategory };
