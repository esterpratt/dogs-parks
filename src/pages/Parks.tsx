import { Link } from 'react-router';
import { ParksList } from '../components/parks/ParksList';
import styles from './Parks.module.scss';
import { Button } from '../components/Button';

const Parks: React.FC = () => {
  return (
    <div className={styles.container}>
      <Link to="/" className={styles.mapLink}>
        <Button>To Map View</Button>
      </Link>
      <ParksList className={styles.parksList} />
    </div>
  );
};

export { Parks };
