import {
  ParkEventInviteeStatus,
  ParkEventStatus,
  ParkEventVisibility,
} from '../types/parkEvent';
import { throwError } from './error';
import { supabase } from './supabase-client';

interface CreateParkEventParams {
  inviteeIds?: string[];
  message?: string;
  parkId: string;
  presetOffsetMinutes?: number;
  visibility: ParkEventVisibility;
}

interface FetchInviteeParams {
  eventId: string;
  userId: string;
}

interface UpdateInviteeParams {
  eventId: string;
  userId: string;
  status: ParkEventInviteeStatus;
}

interface AddEventIniviteesParams {
  eventId: string;
  inviteeIds?: string[];
}

const createParkEvent = async (params: CreateParkEventParams) => {
  try {
    const { inviteeIds, message, parkId, presetOffsetMinutes, visibility } =
      params;

    const { data: event, error } = await supabase.rpc('create_park_event', {
      park_id: parkId,
      visibility,
      message,
      invitee_ids: inviteeIds,
      preset_offset_minutes: presetOffsetMinutes,
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

const fetchEvent = async (id: string) => {
  try {
    const { data: event, error } = await supabase.rpc(
      'get_event_with_invitees',
      { p_event_id: id }
    );

    if (error) {
      throw error;
    }

    return event;
  } catch (error) {
    throwError(error);
  }
};

const cancelEvent = async (eventId: string) => {
  try {
    const { error } = await supabase
      .from('park_events')
      .update({ status: ParkEventStatus.CANCELED })
      .eq('id', eventId);

    if (error) {
      throw error;
    }
  } catch (error) {
    throwError(error);
  }
};

const fetchInvitee = async (params: FetchInviteeParams) => {
  try {
    const { eventId, userId } = params;
    const { data: invitee, error } = await supabase
      .from('park_event_invitees')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw error;
    }

    return invitee;
  } catch (error) {
    throwError(error);
  }
};

const updateInvitee = async (params: UpdateInviteeParams) => {
  try {
    const { userId, eventId, status } = params;
    const { error } = await supabase
      .from('park_event_invitees')
      .update({ status })
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  } catch (error) {
    throwError(error);
  }
};

const addEventInvitees = async (params: AddEventIniviteesParams) => {
  try {
    const { eventId, inviteeIds } = params;
    const { error } = await supabase.rpc('add_event_invitees', {
      p_event_id: eventId,
      p_invitee_ids: inviteeIds,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    throwError(error);
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

export {
  createParkEvent,
  fetchUserOrganizedEvents,
  fetchUserInvitedEvents,
  fetchEvent,
  fetchInvitee,
  updateInvitee,
  cancelEvent,
  addEventInvitees,
};
