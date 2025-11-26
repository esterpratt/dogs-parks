import { useQuery } from '@tanstack/react-query';
import {
  fetchUserInvitedEvents,
  fetchUserOrganizedEvents,
} from '../services/events';
import {
  EventConflictSlot,
  ParkEvent,
  ParkEventInvite,
  ParkEventInviteeStatus,
  ParkEventStatus,
} from '../types/parkEvent';
import { useMemo } from 'react';

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

const useEventSlots = (userId: string, isOpen: boolean) => {
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

  return events;
};

export { useEventSlots };
