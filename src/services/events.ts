import { ParkEventVisibility } from '../types/parkEvent';
import { supabase } from './supabase-client';

interface CreateParkEventParams {
  inviteeIds?: string[];
  message?: string;
  parkId: string;
  presetOffsetMinutes?: number;
  visibility: ParkEventVisibility;
}

const createParkEvent = async (params: CreateParkEventParams) => {
  try {
    const { inviteeIds, message, parkId, presetOffsetMinutes, visibility } =
      params;

    const { data: event, error } = await supabase.rpc('create_park_event', {
      invitee_ids: inviteeIds,
      message,
      park_id: parkId,
      preset_offset_minutes: presetOffsetMinutes,
      visibility,
    });

    if (error) {
      throw error;
    }

    return event;
  } catch (error) {
    console.error(
      `there was an error while creating the event: ${JSON.stringify(error)}`
    );
    return null;
  }
};

const fetchUserOrganizedEvents = async () => {
  try {
    const { data: events, error } = await supabase.rpc(
      'get_user_events_organized'
    );

    if (error) {
      throw error;
    }

    return events;
  } catch (error) {
    console.error(
      `there was an error while fetching user organized events: ${JSON.stringify(error)}`
    );
    return [];
  }
};

const fetchUserInvitedEvents = async () => {
  try {
    const { data: events, error } = await supabase.rpc(
      'get_user_events_invited'
    );

    if (error) {
      throw error;
    }

    return events;
  } catch (error) {
    console.error(
      `there was an error while fetching user invited events: ${JSON.stringify(error)}`
    );
    return [];
  }
};

export { createParkEvent, fetchUserOrganizedEvents, fetchUserInvitedEvents };
