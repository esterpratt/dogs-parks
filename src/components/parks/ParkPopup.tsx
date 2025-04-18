import { useState } from 'react';
import { Footprints, Hourglass, X } from 'lucide-react';
import { Link } from 'react-router';
import classnames from 'classnames';
import { useQuery } from '@tanstack/react-query';
import { Location, Park } from '../../types/park';
import { fetchParkPrimaryImage } from '../../services/parks';
import { FavoriteRibbon } from '../FavoriteRibbon';
import { fetchFavoriteParks } from '../../services/favorites';
import { Button } from '../Button';
import styles from './ParkPopup.module.scss';

interface ParkPopupProps {
  activePark: Park | null;
  onGetDirections: (location: Location) => void;
  isLoadingDirections: boolean;
  directions?: { distance: string; duration: string };
  onClose: () => void;
  canGetDirections: boolean;
}

const HOUR_IN_MS = 1000 * 60 * 60;

const ParkPopup: React.FC<ParkPopupProps> = ({
  activePark,
  onGetDirections,
  isLoadingDirections,
  directions,
  onClose,
  canGetDirections,
}) => {
  const { data: image } = useQuery({
    queryKey: ['parkImage', activePark?.id],
    queryFn: async () => {
      const image = await fetchParkPrimaryImage(activePark!.id);
      return image ? image : null;
    },
    enabled: !!activePark,
  });

  const { data: favoriteParkIds } = useQuery({
    queryKey: ['favoriteParks'],
    queryFn: fetchFavoriteParks,
    staleTime: HOUR_IN_MS,
    gcTime: HOUR_IN_MS,
  });

  const [isClosing, setIsClosing] = useState(false);

  const isFavorite =
    activePark && favoriteParkIds && favoriteParkIds.includes(activePark?.id);

  const onClickGetDirections = () => {
    if (activePark) {
      onGetDirections(activePark!.location);
    }
  };

  const handleTransitionEnd = () => {
    if (isClosing) {
      setIsClosing(false);
      onClose();
    }
  };

  return (
    <div
      className={classnames(
        styles.parkModal,
        !!activePark && !isClosing && styles.open,
        { [styles.noImg]: !image }
      )}
      onTransitionEnd={handleTransitionEnd}
    >
      <Button variant="round" className={styles.close}>
        <X onClick={() => setIsClosing(true)} size={18} />
      </Button>
      <Link
        to={`/parks/${activePark?.id}`}
        className={classnames(styles.imgContainer, {
          [styles.hidden]: directions || !image,
        })}
      >
        <img src={image!} className={styles.img} />
        {isFavorite && <FavoriteRibbon className={styles.favorite} />}
      </Link>
      <div className={styles.detailsContainer}>
        <div className={styles.details}>
          <Link to={`/parks/${activePark?.id}`} className={styles.name}>
            <span>{activePark?.name}</span>
          </Link>
          <div className={styles.addressContainer}>
            <span className={styles.address}>{activePark?.address},</span>
            <span className={styles.city}>{activePark?.city}</span>
          </div>
        </div>
        {canGetDirections && (
          <div className={styles.bottomContainer}>
            <div className={styles.directionsContainer}>
              {isLoadingDirections && (
                <div className={styles.loadingDirections}>
                  Sniffing the way...
                </div>
              )}
              {!isLoadingDirections && directions && (
                <div className={styles.directions}>
                  <div className={styles.distance}>
                    <Footprints className={styles.icon} size={16} />
                    <span>{directions?.distance}</span>
                  </div>
                  <div className={styles.duration}>
                    <Hourglass className={styles.icon} size={16} />
                    <span>{directions?.duration}</span>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.buttons}>
              <Button
                variant="secondary"
                className={styles.button}
                onClick={onClickGetDirections}
              >
                Lead the way
              </Button>
              <Button className={styles.button}>
                <Link to={`/parks/${activePark?.id}`}>View park</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { ParkPopup };
