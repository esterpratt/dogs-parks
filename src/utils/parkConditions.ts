import { Construction, DropletOff, LockKeyhole, Waves } from 'lucide-react';
import { ParkCondition } from '../types/parkCondition';

export const PARK_CONDITIONS = [
  {
    id: ParkCondition.MUDDY,
    value: ParkCondition.MUDDY,
    icon: Waves,
  },
  {
    id: ParkCondition.GATE_CLOSED,
    value: ParkCondition.GATE_CLOSED,
    icon: LockKeyhole,
  },
  {
    id: ParkCondition.UNDER_CONSTRUCTION,
    value: ParkCondition.UNDER_CONSTRUCTION,
    icon: Construction,
  },
  {
    id: ParkCondition.BROKEN_FOUNTAIN,
    value: ParkCondition.BROKEN_FOUNTAIN,
    icon: DropletOff,
  },
];