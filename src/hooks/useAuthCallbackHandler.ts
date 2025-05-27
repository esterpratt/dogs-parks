import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from '../services/supabase-client';

export const useAuthCallbackHandler = () => {
  useEffect(() => {
    let removeListener: (() => void) | null = null;

    const setupListener = async () => {
      const {remove } = await App.addListener('appUrlOpen', async ({ url }) => {

  if (url.includes('auth-callback') && url.includes('access_token')) {
    const hash = url.split('#')[1];
    const params = new URLSearchParams(hash);

    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (access_token && refresh_token) {
      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) {
        console.error('[OAuth error]', error.message);
      } else {
        await Browser.close();
      }
    }
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
  }, []);
};
