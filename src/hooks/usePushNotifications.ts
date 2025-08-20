import { useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Preferences } from '@capacitor/preferences';
import { v4 as uuidv4 } from 'uuid';
import { UserContext } from '../context/UserContext';
import {
  upsertDeviceToken,
  removeDeviceToken,
} from '../services/notifications';
import { Platform } from '../types/notification';

const PLATFORM = Capacitor.getPlatform();
const KEYS = {
  deviceId: 'device_id',
  cachedToken: 'push_token',
};

async function getDeviceId(): Promise<string> {
  const { value } = await Preferences.get({ key: KEYS.deviceId });
  if (value) {
    return value;
  }
  const id = uuidv4();
  await Preferences.set({ key: KEYS.deviceId, value: id });
  return id;
}

export const usePushNotifications = () => {
  const { userId = null } = useContext(UserContext);
  const navigate = useNavigate();

  const previousUserId = useRef<string | null>(null);
  const currentToken = useRef<string | null>(null);

  useEffect(() => {
    if (PLATFORM === 'web') {
      return;
    }

    async function cleanupOnLogout() {
      try {
        const deviceId = await getDeviceId();
        const { value: cachedToken } = await Preferences.get({
          key: KEYS.cachedToken,
        });

        if (cachedToken) {
          await removeDeviceToken({
            deviceId,
            token: cachedToken,
          });
        }
      } catch (err) {
        console.error('Failed to remove device token on logout:', err);
      } finally {
        previousUserId.current = null;
        currentToken.current = null;
        await Preferences.remove({ key: KEYS.cachedToken });
      }
    }

    if (!userId) {
      cleanupOnLogout();
      return;
    }

    previousUserId.current = userId;

    let tokenListener: PluginListenerHandle | undefined;
    let actionListener: PluginListenerHandle | undefined;

    async function persistDeviceToken(nextToken?: string | null) {
      if (!nextToken) {
        return;
      }

      if (nextToken === currentToken.current) {
        return;
      }

      currentToken.current = nextToken;

      if (previousUserId.current !== userId) {
        return;
      }

      try {
        await Preferences.set({
          key: KEYS.cachedToken,
          value: nextToken,
        });

        const deviceId = await getDeviceId();

        await upsertDeviceToken({
          userId: userId!,
          deviceId,
          platform: PLATFORM as Platform,
          token: nextToken,
        });
      } catch (err) {
        console.error('Failed to save push token:', err);
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
          await FirebaseMessaging.createChannel({
            id: 'default',
            name: 'Default',
            description: 'General notifications',
            importance: 3,
            sound: 'default',
          });
        }

        tokenListener = await FirebaseMessaging.addListener(
          'tokenReceived',
          async (e) => {
            await persistDeviceToken(e.token ?? '');
          }
        );

        const { token } = await FirebaseMessaging.getToken();
        await persistDeviceToken(token);

        actionListener = await FirebaseMessaging.addListener(
          'notificationActionPerformed',
          async () => {
            navigate('/notifications');
          }
        );
      } catch (err) {
        console.error('Push notifications init failed:', err);
      }
    }

    init();

    return () => {
      tokenListener?.remove();
      actionListener?.remove();
    };
  }, [navigate, userId]);
};
