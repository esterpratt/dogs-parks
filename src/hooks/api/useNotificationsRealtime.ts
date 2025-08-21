import { useContext, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel, Session } from '@supabase/supabase-js';
import { supabase } from '../../services/supabase-client';
import { UserContext } from '../../context/UserContext';
import { queryClient } from '../../services/react-query';
import type { Notification } from '../../types/notification';

// Keep one channel across mounts
let activeChannelKey: string | null = null;
let activeChannelRef: RealtimeChannel | null = null;
let lastAccessToken: string | null = null;

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

    function upsertReadyUnseen(newRow?: Notification) {
      if (!newRow || !newRow.is_ready || newRow.seen_at) {
        return;
      }
      queryClient.setQueryData<Notification[]>(
        ['unseenNotifications', userId],
        (prev = []) => {
          const exists = prev.some((n) => n.id === newRow.id);
          const next = exists
            ? prev.map((n) => (n.id === newRow.id ? { ...n, ...newRow } : n))
            : [newRow, ...prev];

          next.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
          return next.slice(0, 200);
        }
      );
    }

    async function startChannelFor(uid: string) {
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
            }
          });
        }
        startingRef.current = false;
        return;
      }

      // Create a fresh channel
      const channel = supabase.channel(key).on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${uid}`,
        },
        (payload) => upsertReadyUnseen(payload.new as Notification)
      );

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          return;
        }
        if (
          status === 'CLOSED' ||
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT'
        ) {
          setIsConnected(false);
          // Keep UI fresh if socket drops
          queryClient.invalidateQueries({
            queryKey: ['unseenNotifications', uid],
          });
        }
      });

      activeChannelRef = channel;
      activeChannelKey = key;
      startingRef.current = false;
    }

    // Prime socket with current token and start
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? null;
      if (token && token !== lastAccessToken) {
        supabase.realtime.setAuth(token);
        lastAccessToken = token;
      }
      await startChannelFor(userId);
    })();

    // Auth listener (handles initial session + refresh + sign-out)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        const next = session?.access_token ?? null;

        if (next !== lastAccessToken) {
          if (next) {
            supabase.realtime.setAuth(next);
            lastAccessToken = next;
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
