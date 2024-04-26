import { Map } from '../components/parks/Map';
import { ParksList } from '../components/parks/ParksList';
import { ParksContextProvider } from '../context/ParksContextProvider';
import styles from './Home.module.scss';

const Home: React.FC = () => {
  return (
    <ParksContextProvider>
      <Map className={styles.map} />
      <ParksList />
    </ParksContextProvider>
  );
};

export { Home };
