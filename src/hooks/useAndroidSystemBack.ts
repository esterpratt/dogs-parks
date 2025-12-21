import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useLocation, useNavigate } from 'react-router-dom';

function useAndroidSystemBack() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathnameRef = useRef(location.pathname);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    let removeListener: (() => void) | null = null;
    let isCancelled = false;

    const registerBackButtonListener = async () => {
      const handle = await App.addListener('backButton', () => {
        const historyState = window.history.state as { idx?: number } | null;
        const historyIndex = historyState?.idx ?? 0;
        const canGoBackInApp = historyIndex > 0;

        if (canGoBackInApp) {
          navigate(-1);
          return;
        }

        const currentPathname = pathnameRef.current;

        if (currentPathname === '/') {
          App.exitApp();
          return;
        }

        navigate('/', { replace: true });
      });

      // If effect already cleaned up before await resolved, remove immediately
      if (isCancelled === true) {
        handle.remove();
        return;
      }

      removeListener = handle.remove;
    };

    registerBackButtonListener();

    return () => {
      // Cancel pending async registration to avoid orphan listeners
      isCancelled = true;

      if (removeListener) {
        removeListener();
      }
    };
  }, [navigate]);
}

export { useAndroidSystemBack };
