import { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';
import type { PluginListenerHandle } from '@capacitor/core';

export interface TransportStatus {
  isConnected: boolean;
  type: string;
}

function useTransportOnline(): TransportStatus | null {
  const [status, setStatus] = useState<TransportStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    let listenerHandle: PluginListenerHandle | null = null;

    const setupNetworkListener = async () => {
      try {
        const networkStatus = await Network.getStatus();
        if (mounted) {
          setStatus({
            isConnected: networkStatus.connected,
            type: networkStatus.connectionType ?? 'unknown',
          });
        }

        listenerHandle = await Network.addListener(
          'networkStatusChange',
          (networkStatus) => {
            if (mounted) {
              setStatus({
                isConnected: networkStatus.connected,
                type: networkStatus.connectionType ?? 'unknown',
              });
            }
          }
        );
      } catch (error) {
        console.error('Error setting up network listener:', error);
      }
    };

    setupNetworkListener();

    return () => {
      mounted = false;
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, []);

  return status;
}

export { useTransportOnline };
