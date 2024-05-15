import { useLocation } from 'react-router';
import styles from './Home.module.scss';
import { Map } from '../components/parks/Map';
import { useGoogleMapsLoader } from '../hooks/useGoogleMapsLoader';

const Home: React.FC = () => {
  const { state } = useLocation();
  const { isLoaded } = useGoogleMapsLoader();

  if (!isLoaded) {
    return null;
  }

  return <Map className={styles.map} location={state?.location} />;
};

export { Home };
