import React, { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ParkJSON as Park } from '../../types/park';
import { ParkImageLazy } from '../park/ParkImageLazy';
import { Card } from '../card/Card';
import styles from './ParkPreview.module.scss';

interface ParkPreviewProps {
  park: Park;
}

const ParkPreview: React.FC<ParkPreviewProps> = ({ park }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const onClickMapLink = (event: MouseEvent) => {
    event.preventDefault();
    navigate('/', { state: { location: park.location } });
  };

  return (
    <Card
      testId="park-card"
      url={`/parks/${park.id}`}
      imgCmp={
        <div className={styles.img}>
          <ParkImageLazy
            parkId={park.id}
            alt={park.name}
            noImgClassName={styles.noImg}
            iconSize={48}
            lazy
          />
        </div>
      }
      detailsCmp={
        <div className={styles.detailsContainer}>
          <span className={styles.name} data-test="park-title">
            {park.name}
          </span>
          <span className={styles.address}>
            {park.address}, {park.city}
          </span>
        </div>
      }
      buttons={[
        {
          children: (
            <Link to={`/parks/${park.id}`} className={styles.viewParkButton}>
              <Eye size={12} />
              <span>{t('parks.preview.view')}</span>
            </Link>
          ),
        },
        {
          children: (
            <>
              <Navigation size={12} />
              <span>{t('parks.preview.seeOnMap')}</span>
            </>
          ),
          onClick: onClickMapLink,
          className: styles.mapLink,
          variant: 'secondary',
        },
      ]}
    />
  );
};

export { ParkPreview };
