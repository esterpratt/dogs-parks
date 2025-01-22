import { useEffect, useState } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';

const useKeyboardFix = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    let willShowListener: PluginListenerHandle;
    let didShowListener: PluginListenerHandle;
    let hideListener: PluginListenerHandle;

    const setupListeners = async () => {
      willShowListener = await Keyboard.addListener(
        'keyboardWillShow',
        (info) => {
          setKeyboardHeight(info.keyboardHeight);
        }
      );

      didShowListener = await Keyboard.addListener('keyboardDidShow', () => {
        const focusedElement = document.activeElement;
        requestAnimationFrame(() => {
          focusedElement?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        });
      });

      hideListener = await Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardHeight(0);
      });
    };

    if (Capacitor.getPlatform() !== 'web') {
      setupListeners();
    }

    return () => {
      willShowListener?.remove();
      didShowListener?.remove();
      hideListener?.remove();
    };
  }, []);

  return keyboardHeight;
};

export default useKeyboardFix;
