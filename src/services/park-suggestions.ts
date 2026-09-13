import { NewParkDetails } from '../types/park';
import { supabase } from './supabase-client';

const createParkSuggestion = async ({
  user_id,
  name,
  size_category,
  city,
  address,
  location,
}: NewParkDetails) => {
  try {
    const { error } = await supabase.from('park_suggestions').insert([
      {
        user_id,
        name: name || address,
        city,
        address,
        location,
        // Preserve the approximate size selected by the user.
        size_category,
      },
    ]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(`there was an error while creating park suggetion: ${error}`);
  }
};

export { createParkSuggestion };
