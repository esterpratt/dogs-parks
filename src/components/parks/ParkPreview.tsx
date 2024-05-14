import React from 'react';
import { Park } from '../../types/park';
import styles from './ParkPreview.module.scss';

interface ParkPreviewProps {
  park: Park;
}

const ParkPreview: React.FC<ParkPreviewProps> = ({ park }) => {
  return (
    <div className={styles.park}>
      <p className={styles.name}>{park.name}</p>
      <p className={styles.address}>
        {park.address} {park.city}
      </p>
    </div>
  );
};

export { ParkPreview };
