import { ParkJSON } from '../types/park';

interface ParkNameMap {
  [parkId: string]: string;
}

function buildParkNameMap(parks: ParkJSON[]): ParkNameMap {
  const map: ParkNameMap = {};
  for (const park of parks) {
    map[park.id] = park.name;
  }
  return map;
}

export { buildParkNameMap, type ParkNameMap };
