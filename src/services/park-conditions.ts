import { supabase } from './supabase-client';
import { ParkCondition, ParkConditionStatus } from '../types/parkCondition';
import { throwError } from './error';

interface AddParkConditionObservationParams {
  parkId: string;
  condition: ParkCondition;
  status: ParkConditionStatus;
}

interface GetActiveParkConditionsParams {
  parkId: string;
}

const getActiveParkConditions = async ({
  parkId,
}: GetActiveParkConditionsParams) => {
  try {
    const { data, error } = await supabase.rpc('get_active_park_conditions', {
      p_park_id: parkId,
    });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(
      `There was an error fetching park conditions for park ${parkId}: ${error}`
    );
    return [];
  }
};

const addParkConditionObservation = async ({
  parkId,
  condition,
  status,
}: AddParkConditionObservationParams) => {
  try {
    const { error } = await supabase.rpc('add_park_condition_observation', {
      p_park_id: parkId,
      p_condition: condition,
      p_status: status,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    throwError(error);
  }
};

export { getActiveParkConditions, addParkConditionObservation };
