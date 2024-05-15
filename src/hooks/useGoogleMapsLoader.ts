import { useJsApiLoader } from '@react-google-maps/api';

const useGoogleMapsLoader = () => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  return { isLoaded };
};

export { useGoogleMapsLoader };
