import { Location } from '../types/park';
import { supabase } from './supabase-client';

interface CreateParkSuggestionProps {
  user_id: string;
  name: string;
  size: number | null;
  city: string;
  address: string;
  location: Location
}

const createParkSuggestion = async ({user_id, name, size, city, address, location}: CreateParkSuggestionProps) => {
  try {
    const { error } = await supabase
      .from('park_suggestions')
      .insert([
        {user_id, name: name || address, city, address, location, size: size || null}
      ])

    if (error) {
      throw error;
    }

  } catch (error) {
    console.error(
      `there was an error while creating park suggetion: ${JSON.stringify(error)}`
    );
  }
};

export { createParkSuggestion };
