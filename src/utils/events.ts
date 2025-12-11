import { EventConflictSlot } from '../types/parkEvent';
import { ONE_MINUTE } from './consts';

interface HasConflictParams {
  events: EventConflictSlot[];
  startMs: number;
  durationMinutes?: number;
}

const getConflictedEvents = (params: HasConflictParams) => {
  const { events, startMs, durationMinutes = 60 } = params;
  const endMs = startMs + durationMinutes * ONE_MINUTE;

  return events.filter(
    (event) => startMs < event.endMs && endMs > event.startMs
  );
};

export { getConflictedEvents };
