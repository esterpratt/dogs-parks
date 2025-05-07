import { useLocation } from 'react-router-dom';
import { NewMap } from '../components/map/NewMap';
import styles from './Home.module.scss';

const Home: React.FC = () => {
  const { state } = useLocation();

  return <NewMap className={styles.map} location={state?.location} />;
};

export { Home };
