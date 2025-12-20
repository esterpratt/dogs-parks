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
    console.error(`there was an error while reporting park: ${error}`);
  }
};

export { createParkReport };
