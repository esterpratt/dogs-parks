import { throwError } from './error';
import { supabase } from './supabase-client';

interface CreateParkReportProps {
  user_id: string;
  park_id: string;
  text: string;
}

const createParkReport = async ({
  user_id,
  park_id,
  text,
}: CreateParkReportProps) => {
  try {
    const { error } = await supabase
      .from('park_reports')
      .insert([{ user_id, park_id, content: text }]);

    if (error) {
      throw error;
    }
  } catch (error) {
    // Allow the report modal to display a real failure state.
    throwError(error);
  }
};

export { createParkReport };
