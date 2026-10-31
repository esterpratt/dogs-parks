import { supabase } from './supabase-client';

let backendCheck: Promise<boolean> | null = null;
let checkedAt = 0;
const BACKEND_CHECK_LIFETIME_MS = 60_000;

const checkBackend = async (): Promise<boolean> => {
  try {
    // This table arrives with the ownership foundation. A missing table means
    // the deployed client must keep using the original solo-dog API.
    const { error } = await supabase
      .from('app_feature_compatibility')
      .select('feature')
      .limit(1);
    if (!error || error.code === '42501') {
      checkedAt = Date.now();
      return false;
    }
    if (error.code === 'PGRST205' || error.code === '42P01') {
      checkedAt = Date.now();
      return true;
    }
    throw error;
  } catch (error) {
    // A transient error must be retryable instead of locking in a guess.
    backendCheck = null;
    throw error;
  }
};

const usesLegacyDogBackend = (): Promise<boolean> => {
  if (!backendCheck ||
      (checkedAt > 0 && Date.now() - checkedAt > BACKEND_CHECK_LIFETIME_MS)) {
    // Reprobe during a rollout so an open browser eventually switches to the
    // new API after the database migration without requiring a tab reload.
    backendCheck = checkBackend();
  }
  return backendCheck;
};

export { usesLegacyDogBackend };
