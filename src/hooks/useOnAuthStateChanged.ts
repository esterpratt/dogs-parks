import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase-client';

const useOnAuthStateChanged = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingUser(false);
    });
  }, []);

  return {
    session,
    isLoadingAuthUser: loadingUser,
  };
};

export { useOnAuthStateChanged };
