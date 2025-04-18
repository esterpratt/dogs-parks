import React, { MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Park } from '../../types/park';
import { ParkImage } from '../park/ParkImage';
import { Card } from '../card/Card';
import styles from './ParkPreview.module.scss';

interface ParkPreviewProps {
  park: Park;
  className?: string;
}

const ParkPreview: React.FC<ParkPreviewProps> = ({ park, className }) => {
  const navigate = useNavigate();
  const onClickMapLink = (event: MouseEvent) => {
    event.preventDefault();
    navigate('/', { state: { location: park.location } });
  };

  return (
    <Card
      url={`/parks/${park.id}`}
      imgCmp={
        <ParkImage
          parkId={park.id}
          alt={park.name}
          className={styles.img}
          noImgClassName={styles.noImg}
          iconSize={48}
          lazy
        />
      }
      detailsCmp={
        <div className={styles.detailsContainer}>
          <span className={styles.name}>{park.name}</span>
          <span className={styles.address}>
            {park.address}, {park.city}
          </span>
        </div>
      }
      buttons={[
        {
          children: (
            <Link to={`/parks/${park.id}`} className={styles.viewParkButton}>
              View park
            </Link>
          ),
        },
        {
          children: 'See in map',
          onClick: onClickMapLink,
          className: styles.mapLink,
          variant: 'secondary',
        },
      ]}
      className={className}
    />
    // <div className={styles.container}>
    //   <Link
    //     to={`/parks/${park.id}`}
    //     className={classnames(styles.park, className)}
    //   >
    //     <ParkImage
    //       parkId={park.id}
    //       alt={park.name}
    //       className={styles.img}
    //       noImgClassName={styles.noImg}
    //       iconSize={48}
    //       lazy
    //     />
    // <div className={styles.detailsContainer}>
    //   <span className={styles.name}>{park.name}</span>
    //   <span className={styles.address}>
    //     {park.address}, {park.city}
    //   </span>
    // </div>
    //   </Link>
    //   <div className={styles.buttonsContainer}>
    //     <Button className={styles.viewParkButton}>View park</Button>
    //     <Button
    //       variant="secondary"
    //       onClick={onClickMapLink}
    //       className={styles.mapLink}
    //     >
    //       See in map
    //     </Button>
    //   </div>
    // </div>
  );
};

export { ParkPreview };
