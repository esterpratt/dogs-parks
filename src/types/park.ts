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

interface Park {
  id: string;
  location: Location;
  name: string;
  city: string;
  address: string;
  size: number | null;
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
  size: number | null;
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
  size: number | null;
  location: Location;
  user_id: string;
}

export type {
  Park,
  ParkTranslation,
  TranslatedPark,
  ParkJSON,
  RawParkData,
  Location,
  NewParkDetails,
};
export { ParkMaterial };
