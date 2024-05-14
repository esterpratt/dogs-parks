import { Link } from 'react-router-dom';
import { ParksList } from '../components/parks/ParksList';
import styles from './Parks.module.scss';
import { Button } from '../components/Button';
import { FaArrowLeftLong } from 'react-icons/fa6';

const Parks: React.FC = () => {
  return (
    <div className={styles.container}>
      <Link to="/" className={styles.mapLink}>
        <FaArrowLeftLong />
        <Button>Map View</Button>
      </Link>
      <ParksList className={styles.parksList} />
    </div>
  );
};

export { Parks };
