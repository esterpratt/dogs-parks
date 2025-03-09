import { supabase } from './supabase-client';

interface GetJsonFileUrlProps {
  bucketName: string;
  fileName: string;
}

export const getJsonFileUrl = async ({bucketName, fileName}: GetJsonFileUrlProps) => {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return data.publicUrl; 
};
