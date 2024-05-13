import { MapLoader } from '../components/parks/MapLoader';
import styles from './Home.module.scss';

const Home: React.FC = () => {
  return <MapLoader className={styles.map} />;
};

export { Home };
