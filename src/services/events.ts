import { ParkEventVisibility } from '../types/parkEvent';
// import { supabase } from './supabase-client';

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

    console.log(
      'creating park event: ',
      inviteeIds,
      message,
      parkId,
      presetOffsetMinutes,
      visibility
    );
    // const { data: event, error } = await supabase.rpc('create_park_event', {
    //   invitee_ids: inviteeIds,
    //   message,
    //   park_id: parkId,
    //   preset_offset_minutes: presetOffsetMinutes,
    //   visibility,
    // });

    // if (error) {
    //   throw error;
    // }

    // return event;
  } catch (error) {
    console.error(
      `there was an error while creating the event: ${JSON.stringify(error)}`
    );
    return null;
  }
};

export { createParkEvent };
