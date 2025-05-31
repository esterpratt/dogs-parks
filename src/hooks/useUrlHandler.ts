import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from '../services/supabase-client';

export const useUrlHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let removeListener: (() => void) | null = null;

    const setupListener = async () => {
      const { remove } = await App.addListener('appUrlOpen', async ({ url }) => {
        try {
          const [base, hash] = url.split('#');
          const path = base.replace('com.klavhub://', '').replace(/^\/+/, '');
          const params = new URLSearchParams(hash);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (path.startsWith('auth-callback') && access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (error) {
              console.error('[Supabase auth error]', error.message);
            }

            const { data: userData, error: userError } = await supabase.auth.getUser();

            if (userError || !userData.user) {
              console.error('[Supabase getUser error]', userError?.message);
              navigate('/login'); // fallback
              return;
            }

            navigate(`/profile/${userData.user.id}`);
          } else {
            navigate(`/${path}`);
          }
        } catch (error) {
          console.error('[Deep link handler error]', error);
          navigate('/');
        } finally {
          await Browser.close();
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
