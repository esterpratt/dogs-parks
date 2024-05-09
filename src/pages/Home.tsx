import { MapLoader } from '../components/parks/MapLoader';
import { ParksList } from '../components/parks/ParksList';
import { ParksContextProvider } from '../context/ParksContext';
import styles from './Home.module.scss';

const Home: React.FC = () => {
  return (
    <ParksContextProvider>
      <MapLoader className={styles.map} />
      <ParksList />
    </ParksContextProvider>
  );
};

export { Home };
