import { useLocation } from 'react-router';
import { MapLoader } from '../components/parks/MapLoader';
import styles from './Home.module.scss';

const Home: React.FC = () => {
  const { state } = useLocation();

  return <MapLoader className={styles.map} location={state?.location} />;
};

export { Home };
