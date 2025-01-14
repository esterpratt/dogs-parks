import React, { MouseEvent } from 'react';
import { useNavigate } from 'react-router';
import { Link } from 'react-router-dom';
import classnames from 'classnames';
import { Park } from '../../types/park';
import styles from './ParkPreview.module.scss';
import { Button } from '../Button';

interface ParkPreviewProps {
  park: Park;
  className?: string;
}

const ParkPreview: React.FC<ParkPreviewProps> = ({ park, className }) => {
  const navigate = useNavigate();
  const onClickMapLink = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigate('/', { state: { location: park.location } });
  };

  return (
    <Link
      to={`/parks/${park.id}`}
      className={classnames(styles.park, className)}
    >
      <div className={styles.detailsContainer}>
        <span className={styles.name}>{park.name}</span>
        <span className={styles.address}>
          {park.address}, {park.city}
        </span>
      </div>
      <div className={styles.buttonsContainer}>
        <span>See park page</span>
        <Button onClick={onClickMapLink} className={styles.mapLink}>
          See in map
        </Button>
      </div>
    </Link>
  );
};

export { ParkPreview };
