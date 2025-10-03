import { LoaderFunction } from 'react-router-dom';
import { queryClient } from '../services/react-query';
import { fetchParkWithTranslation } from '../services/parks';
import { Network } from '@capacitor/network';
import { i18n } from '../i18n';
import { deriveAppLanguage } from '../utils/language';
import { parkKey } from '../hooks/api/keys';

const parkLoader: LoaderFunction = async ({ params }) => {
  const { id: parkId } = params;

  const status = await Network.getStatus();
  if (!status.connected) {
    throw new Response('Offline', { status: 503, statusText: 'Offline' });
  }

  const language = deriveAppLanguage(i18n.language);
  const parkPromise = queryClient.fetchQuery({
    queryKey: parkKey(parkId!, language),
    queryFn: () => fetchParkWithTranslation({ parkId: parkId!, language }),
  });

  return { park: parkPromise };
};

export { parkLoader };
