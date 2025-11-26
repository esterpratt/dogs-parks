import { useQuery } from '@tanstack/react-query';
import {
  fetchUserInvitedEvents,
  fetchUserOrganizedEvents,
} from '../services/events';
import {
  ParkEvent,
  ParkEventInvite,
  ParkEventInviteeStatus,
  ParkEventStatus,
} from '../types/parkEvent';
import { useCallback, useMemo } from 'react';

const MS_IN_MINUTE = 60000;

interface HasConflictParams {
  startMs: number;
  durationMinutes?: number;
}

interface EventConflictSlot {
  id: string;
  parkId: string;
  type: 'organized' | 'invited';
  startMs: number;
  endMs: number;
}

// interface UseEventConflictsResult {
//   conflicetdEvent: EventConflictSlot[];
// }

const mapEventToSlot = (
  event: ParkEvent | ParkEventInvite,
  type: 'organized' | 'invited'
): EventConflictSlot => {
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  return {
    id: event.id,
    parkId: event.park_id,
    type,
    startMs: start.getTime(),
    endMs: end.getTime(),
  };
};

const useEventConflicts = (userId: string, isOpen: boolean) => {
  const { data: organizedEvents } = useQuery({
    queryKey: ['events', 'organized', userId, 'conflict'],
    queryFn: fetchUserOrganizedEvents,
    staleTime: 0,
    refetchOnWindowFocus: true,
    enabled: isOpen,
    select: (events: ParkEvent[]) => {
      return events
        .filter((event) => {
          return event.status === ParkEventStatus.ACTIVE;
        })
        .map((event) => mapEventToSlot(event, 'organized'));
    },
  });

  const { data: invitedEvents } = useQuery({
    queryKey: ['events', 'invited', userId, 'conflict'],
    queryFn: fetchUserInvitedEvents,
    staleTime: 0,
    refetchOnWindowFocus: true,
    enabled: isOpen,
    select: (events: ParkEventInvite[]) => {
      return events
        .filter((event) => {
          return (
            event.status === ParkEventStatus.ACTIVE &&
            (event.my_invite_status === ParkEventInviteeStatus.ACCEPTED ||
              event.my_invite_status === ParkEventInviteeStatus.INVITED)
          );
        })
        .map((event) => mapEventToSlot(event, 'invited'));
    },
  });

  const events = useMemo(() => {
    return [...(organizedEvents ?? []), ...(invitedEvents ?? [])];
  }, [organizedEvents, invitedEvents]);

  const getConflictedEvents = useCallback(
    (params: HasConflictParams) => {
      const { startMs, durationMinutes = 60 } = params;
      const endMs = startMs + durationMinutes * MS_IN_MINUTE;

      return events.filter(
        (event) => startMs < event.endMs && endMs > event.startMs
      );
    },
    [events]
  );

  return { getConflictedEvents };
};

export { useEventConflicts, MS_IN_MINUTE };
