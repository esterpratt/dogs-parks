import { useContext, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel, Session } from '@supabase/supabase-js';
import { supabase } from '../../services/supabase-client';
import type { Notification } from '../../types/notification';
import { queryClient } from '../../services/react-query';
import { UserContext } from '../../context/UserContext';

// Keep one channel across mounts
let activeChannelKey: string | null = null;
let activeChannelRef: RealtimeChannel | null = null;
let lastAccessToken: string | null = null;

function invalidateNotificationsKeys(
  uid: string,
  isOnNotificationsPage: boolean
): void {
  queryClient.invalidateQueries({ queryKey: ['unseenNotifications', uid] });
  queryClient.invalidateQueries({ queryKey: ['seenNotifications', uid] });

  // Only invalidate count if user is NOT on notifications page
  // (if on page, notifications get marked immediately, count stays 0)
  if (!isOnNotificationsPage) {
    queryClient.invalidateQueries({
      queryKey: ['notifications', 'unseenCount', uid],
    });
  }
}

function useNotificationsRealtime() {
  const { userId } = useContext(UserContext);
  const [isConnected, setIsConnected] = useState(false);

  const authUnsubscribeRef = useRef<() => void>();
  const startingRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      // Tear down when logged out / no user
      if (activeChannelRef) {
        supabase.removeChannel(activeChannelRef);
        activeChannelRef = null;
        activeChannelKey = null;
      }
      setIsConnected(false);
      if (authUnsubscribeRef.current) {
        authUnsubscribeRef.current();
        authUnsubscribeRef.current = undefined;
      }
      return;
    }

    async function startChannelFor(uid: string) {
      function handleNotificationInsert(newRow?: Notification) {
        if (!newRow) {
          return;
        }

        const onNotificationsPage =
          window.location.pathname === '/notifications';
        invalidateNotificationsKeys(uid, onNotificationsPage);
      }

      if (startingRef.current) {
        return;
      }

      startingRef.current = true;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token ?? null;
      if (!token) {
        startingRef.current = false;
        return;
      }

      if (token !== lastAccessToken) {
        supabase.realtime.setAuth(token); // authorize websocket with user JWT (RLS)
        lastAccessToken = token;
      }

      const key = `notifications:${uid}`;

      // If channel is for a different user, remove it
      if (activeChannelRef && activeChannelKey !== key) {
        supabase.removeChannel(activeChannelRef);
        activeChannelRef = null;
        activeChannelKey = null;
        setIsConnected(false);
      }

      // If a channel already exists for this user
      if (activeChannelRef && activeChannelKey === key) {
        if (activeChannelRef.state === 'joined') {
          setIsConnected(true);
        } else {
          activeChannelRef.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              invalidateNotificationsKeys(
                uid,
                window.location.pathname === '/notifications'
              );
            }
          });
        }
        startingRef.current = false;
        return;
      }

      // Listen to INSERT events
      const channel = supabase.channel(key).on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${uid}`,
        },
        (payload) => handleNotificationInsert(payload.new as Notification)
      );

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          invalidateNotificationsKeys(
            uid,
            window.location.pathname === '/notifications'
          );
          return;
        }
        if (
          status === 'CLOSED' ||
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT'
        ) {
          setIsConnected(false);
          queryClient.invalidateQueries({
            queryKey: ['notifications', 'unseenCount', uid],
          });
        }
      });

      activeChannelRef = channel;
      activeChannelKey = key;
      startingRef.current = false;
    }

    async function primeAndStart(uid: string): Promise<void> {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token ?? null;

        if (token && token !== lastAccessToken) {
          supabase.realtime.setAuth(token);
          lastAccessToken = token;
          invalidateNotificationsKeys(
            uid,
            window.location.pathname === '/notifications'
          );
        }

        await startChannelFor(uid);
      } catch (err) {
        console.error('[NotificationsRealtime] primeAndStart failed:', err);
      }
    }

    void primeAndStart(userId);

    // Auth listener (handles initial session + refresh + sign-out)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        const next = session?.access_token ?? null;

        if (next !== lastAccessToken) {
          if (next) {
            supabase.realtime.setAuth(next);
            lastAccessToken = next;
            invalidateNotificationsKeys(
              userId,
              window.location.pathname === '/notifications'
            );

            if (!activeChannelRef || activeChannelRef.state !== 'joined') {
              void startChannelFor(userId);
            }
          } else {
            // Signed out
            if (activeChannelRef) {
              supabase.removeChannel(activeChannelRef);
              activeChannelRef = null;
              activeChannelKey = null;
            }
            lastAccessToken = null;
            setIsConnected(false);
          }
        }
      }
    );

    if (authUnsubscribeRef.current) {
      authUnsubscribeRef.current();
    }

    authUnsubscribeRef.current = () => {
      listener.subscription.unsubscribe();
    };

    return () => {
      if (authUnsubscribeRef.current) {
        authUnsubscribeRef.current();
        authUnsubscribeRef.current = undefined;
      }
      setIsConnected(false);
    };
  }, [userId]);

  return { isConnected };
}

export { useNotificationsRealtime };
