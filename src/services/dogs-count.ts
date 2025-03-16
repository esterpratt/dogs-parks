import { supabase } from './supabase-client';

interface ReportParkDogsCountProps {
  parkId: string;
  dogsCount: number;
  userId?: string | null;
}

const reportDogsCount = async ({
  parkId,
  dogsCount,
}: ReportParkDogsCountProps) => {
  try {
    const { error } = await supabase
    .from('dogs_count_reports')
    .insert([
      { park_id: parkId, count: dogsCount },
    ])
  
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('there was an error reporting dogs count: ', JSON.stringify(error));
  }
};

const fetchDogsCountByReports = async (parkId: string) => {
  try {
    const { data: dogsCountReport, error } = await supabase
    .from('dogs_count_reports')
    .select('*')
    .eq('park_id', parkId)

    if (error) {
      throw error;
    }

    return dogsCountReport;
  } catch (error) {
    console.error(`there was an error fetching dogs count: ${JSON.stringify(error)}`);
    return []
  }
};

export { reportDogsCount, fetchDogsCountByReports };
