import React, { MouseEvent } from 'react';
import { Park } from '../../types/park';
import styles from './ParkPreview.module.scss';
import { Button } from '../Button';
import { useNavigate } from 'react-router';

interface ParkPreviewProps {
  park: Park;
}

const ParkPreview: React.FC<ParkPreviewProps> = ({ park }) => {
  const navgiate = useNavigate();
  const onClickMapLink = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navgiate('/', { state: { location: park.location } });
  };

  return (
    <div className={styles.park}>
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
    </div>
  );
};

export { ParkPreview };
