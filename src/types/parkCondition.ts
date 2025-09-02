enum ParkCondition {
  MUDDY = 'MUDDY',
  BROKEN_FOUNTAIN = 'BROKEN_FOUNTAIN',
  GATE_CLOSED = 'GATE_CLOSED',
  UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION',
}

enum ParkConditionStatus {
  PRESENT = 'PRESENT',
  NOT_PRESENT = 'NOT_PRESENT',
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
