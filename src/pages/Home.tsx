import { useLocation } from 'react-router';
import styles from './Home.module.scss';
import { NewMap } from '../components/map/NewMap';

const Home: React.FC = () => {
  const { state } = useLocation();

  return <NewMap className={styles.map} location={state?.location} />;
};

export { Home };
