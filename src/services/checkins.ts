import { Checkin } from '../types/checkin';
import { supabase } from './supabase-client';

interface CheckinProps {
  userId?: string | null;
  parkId: string;
}

const checkin = async ({ userId = null, parkId }: CheckinProps) => {
  try {
    const { data, error } = await supabase
      .from('checkins')
      .insert([{ user_id: userId, park_id: parkId }])
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error(`there was an error while checking in: ${error}`);
    return null;
  }
};

const checkout = async (checkinId: string) => {
  try {
    const { error } = await supabase.rpc('update_checkout', {
      checkin_id: checkinId,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('there was an error while checking out: ', error);
  }
};

const fetchAllDayParkCheckins = async (parkId: string) => {
  try {
    const { data: checkins, error } = await supabase
      .from('checkins')
      .select('*')
      .eq('park_id', parkId);

    if (error) {
      throw error;
    }

    return checkins;
  } catch (error) {
    console.error(
      `there was an error while fetching all day checkins for park ${parkId}: ${error}`
    );
    return null;
  }
};

const fetchParkCheckins = async (parkId: string): Promise<Checkin[] | null> => {
  try {
    const { data: checkins, error } = await supabase.rpc('get_park_checkins', {
      p_park_id: parkId,
    });

    if (error) {
      throw error;
    }

    return checkins;
  } catch (error) {
    console.error(
      `there was an error while fetching checkins for park ${parkId}: ${error}`
    );
    return null;
  }
};

export { checkin, checkout, fetchParkCheckins, fetchAllDayParkCheckins };
