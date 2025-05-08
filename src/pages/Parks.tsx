import { ParksList } from '../components/parks/ParksList';
import styles from './Parks.module.scss';

const Parks: React.FC = () => {
  return (
    <div className={styles.container}>
      <ParksList />
    </div>
  );
};

export default Parks;
