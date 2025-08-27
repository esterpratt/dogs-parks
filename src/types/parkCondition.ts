enum ParkCondition {
  MUDDY = 'muddy',
  BROKEN_FOUNTAIN = 'broken fountain',
  GATE_CLOSED = 'gate closed',
  UNDER_CONSTRUCTION = 'under construction',
}

enum ParkConditionStatus {
  PRESENT = 'present',
  NOT_PRESENT = 'not present',
}

interface ParkConditionObservation {
  id: string;
  park_id: string;
  condition: ParkCondition;
  status: ParkConditionStatus;
  created_at: string;
  reporter_id: string;
}

interface ActiveParkCondition {
  park_id: string;
  condition: ParkCondition;
  last_reported_at: string;
}

export type { ParkConditionObservation, ActiveParkCondition };
export { ParkCondition, ParkConditionStatus };
