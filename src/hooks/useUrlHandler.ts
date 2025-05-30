import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from '../services/supabase-client';
import { useNavigate } from 'react-router-dom';

const useUrlHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let removeListener: (() => void) | null = null;

    const setupListener = async () => {
      const { remove } = await App.addListener('appUrlOpen', async ({ url }) => {
        try {
          const parsed = new URL(url);

          if (parsed.pathname.includes('auth-callback') && parsed.hash.includes('access_token')) {
            const hash = parsed.hash.slice(1);
            const params = new URLSearchParams(hash);

            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');

            if (access_token && refresh_token) {
              await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
            }

            navigate('/login');
          } else {
            const path = parsed.pathname;
            navigate(path);
          }

          await Browser.close();
        } catch (error) {
          console.error('[Deep link error]', JSON.stringify(error));
        }
      });

      removeListener = remove;
    };

    setupListener();

    return () => {
      if (removeListener) {
        removeListener();
      }
    };
  }, [navigate]);
};

export { useUrlHandler };