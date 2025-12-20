import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase-client';
import { FORCED_LOGOUT_EVENT } from '../utils/consts';

const useOnAuthStateChanged = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    // Initialize from persisted storage
    supabase.auth.getSession().then(({ data, error }) => {
      if (!error) {
        setSession(data.session ?? null);
      }
      setLoadingUser(false);
    });

    // Save subscription and unsubscribe on cleanup
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, updatedSession) => {
        setSession(updatedSession);
        setLoadingUser(false);
      }
    );

    const handleForcedLogout = () => {
      setSession(null);
      setLoadingUser(false);
    };

    window.addEventListener(FORCED_LOGOUT_EVENT, handleForcedLogout);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener(FORCED_LOGOUT_EVENT, handleForcedLogout);
    };
  }, []);

  return {
    session,
    isLoadingAuthUser: loadingUser,
  };
};

export { useOnAuthStateChanged };
