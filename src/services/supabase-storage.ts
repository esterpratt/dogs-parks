import { supabase } from './supabase-client';

interface GetFileUrlProps {
  bucketName: string;
  fileName: string;
}

export const getFileUrl = ({ bucketName, fileName }: GetFileUrlProps) => {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return data.publicUrl; 
};
