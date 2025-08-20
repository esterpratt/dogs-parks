import { useContext, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../services/supabase-client';
import { UserContext } from '../../context/UserContext';
import { queryClient } from '../../services/react-query';
import type { Notification } from '../../types/notification';

// Module-level singleton so multiple mounts don't duplicate the channel
let activeChannelKey: string | null = null;
let activeChannelRef: RealtimeChannel | null = null;

function useNotificationsRealtime() {
  const { userId } = useContext(UserContext);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const latestUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      if (activeChannelRef) {
        supabase.removeChannel(activeChannelRef);
        activeChannelRef = null;
        activeChannelKey = null;
      }
      setIsConnected(false);
      latestUserIdRef.current = null;
      return;
    }

    const channelKey = `notifications:${userId}`;

    if (activeChannelKey === channelKey && activeChannelRef) {
      latestUserIdRef.current = userId;
      setIsConnected(activeChannelRef.state === 'joined');
      return;
    }

    if (activeChannelRef) {
      supabase.removeChannel(activeChannelRef);
      activeChannelRef = null;
      activeChannelKey = null;
      setIsConnected(false);
    }

    latestUserIdRef.current = userId;

    function upsertReadyUnseen(newRow?: Notification) {
      if (!newRow) {
        return;
      }
      if (!newRow.is_ready) {
        return;
      }
      if (newRow.seen_at) {
        return;
      }

      queryClient.setQueryData<Notification[]>(
        ['unseenNotifications', userId],
        (prev = []) => {
          const exists = prev.some((n) => n.id === newRow.id);
          const next = exists
            ? prev.map((n) => {
                if (n.id === newRow.id) {
                  return { ...n, ...newRow };
                } else {
                  return n;
                }
              })
            : [newRow, ...prev];

          next.sort((a, b) => {
            const aTime = new Date(a.created_at).getTime();
            const bTime = new Date(b.created_at).getTime();
            return bTime - aTime;
          });

          return next.slice(0, 200);
        }
      );
    }

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload?.new as Notification | undefined;
          upsertReadyUnseen(row);
        }
      )
      .subscribe((status) => {
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
          queryClient.invalidateQueries({ 
            queryKey: ['unseenNotifications', userId] 
          });
        }
      });

    activeChannelRef = channel;
    activeChannelKey = channelKey;

    return () => {
      if (activeChannelRef && activeChannelKey === channelKey) {
        supabase.removeChannel(activeChannelRef);
        activeChannelRef = null;
        activeChannelKey = null;
      }
      setIsConnected(false);
    };
  }, [userId]);

  return { isConnected };
}

export { useNotificationsRealtime };
