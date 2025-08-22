import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Preferences } from '@capacitor/preferences';
import { v4 as uuidv4 } from 'uuid';
import { UserContext } from '../context/UserContext';
import { upsertDeviceToken } from '../services/notifications';
import { Platform } from '../types/notification';
import { DEVICE_ID_KEY } from '../utils/consts';

const PLATFORM = Capacitor.getPlatform();

async function getDeviceId(): Promise<string> {
  const existing = await Preferences.get({ key: DEVICE_ID_KEY });
  if (existing.value) {
    return existing.value;
  } else {
    const id = uuidv4();
    await Preferences.set({ key: DEVICE_ID_KEY, value: id });
    return id;
  }
}

function usePushNotifications() {
  const { userId = null } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !userId) {
      return;
    }

    let tokenListener: PluginListenerHandle | undefined;
    let actionListener: PluginListenerHandle | undefined;

    async function saveToken(token?: string | null) {
      if (!token) return;
      try {
        const deviceId = await getDeviceId();
        await upsertDeviceToken({
          userId: userId!,
          deviceId,
          platform: PLATFORM as Platform,
          token,
        });
      } catch (err) {
        console.error('[Push] upsertDeviceToken failed:', err);
      }
    }

    async function init() {
      try {
        const perm = await FirebaseMessaging.checkPermissions();
        if (perm.receive !== 'granted') {
          const req = await FirebaseMessaging.requestPermissions();
          if (req.receive !== 'granted') {
            return;
          }
        }

        if (PLATFORM === 'android') {
          try {
            await FirebaseMessaging.createChannel({
              id: 'default',
              name: 'Default',
              description: 'General notifications',
              importance: 3,
              sound: 'default',
            });
          } catch (error) {
            console.error('There was an error creating channel: ', error);
          }
        }

        tokenListener = await FirebaseMessaging.addListener(
          'tokenReceived',
          (e) => saveToken(e.token ?? '')
        );

        const { token } = await FirebaseMessaging.getToken();
        await saveToken(token);

        actionListener = await FirebaseMessaging.addListener(
          'notificationActionPerformed',
          () => navigate('/notifications')
        );
      } catch (error) {
        console.error('[Push] init failed:', error);
      }
    }

    init();

    return () => {
      tokenListener?.remove();
      actionListener?.remove();
    };
  }, [navigate, userId]);
}

export { usePushNotifications };
