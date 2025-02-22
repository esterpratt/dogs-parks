import { useEffect } from 'react';
import { SafeArea, SafeAreaInsets } from 'capacitor-plugin-safe-area';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { PluginListenerHandle } from '@capacitor/core';

const useSafeArea = () => {
  useEffect(() => {
    let safeAreaListener: PluginListenerHandle | undefined;
    let orientationListener: PluginListenerHandle | undefined;

    const updateSafeAreaVariables = (insets: SafeAreaInsets['insets']) => {
      for (const [key, value] of Object.entries(insets)) {
        document.documentElement.style.setProperty(
          `--safe-area-inset-${key}`,
          `${value}px`
        );
      }
    };

    const fetchAndUpdateSafeArea = async () => {
      const result = await SafeArea.getSafeAreaInsets();
      updateSafeAreaVariables(result.insets);
    };

    const setupListeners = async () => {
      safeAreaListener = await SafeArea.addListener(
        'safeAreaChanged',
        (info) => {
          updateSafeAreaVariables(info.insets);
        }
      );

      orientationListener = await ScreenOrientation.addListener(
        'screenOrientationChange',
        () => {
          fetchAndUpdateSafeArea();
        }
      );

      fetchAndUpdateSafeArea();
    };

    setupListeners();

    return () => {
      safeAreaListener?.remove();
      orientationListener?.remove();
    };
  }, []);
};

export { useSafeArea };
