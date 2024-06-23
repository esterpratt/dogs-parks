import { Link } from 'react-router-dom';
import { FaWalking, FaRegClock } from 'react-icons/fa';
import classnames from 'classnames';
import { Location, Park } from '../../types/park';
import styles from './ParkPopup.module.scss';
import { fetchParkPrimaryImage } from '../../services/parks';
import { IconContext } from 'react-icons';
import { LuTrees } from 'react-icons/lu';
import { CgClose } from 'react-icons/cg';
import { FavoriteRibbon } from '../FavoriteRibbon';
import { useQuery } from '@tanstack/react-query';
import { fetchFavoriteParks } from '../../services/favorites';
import { Loading } from '../Loading';

interface ParkPopupProps {
  activePark: Park | null;
  onGetDirections: (location: Location) => void;
  isLoadingDirections: boolean;
  directions?: { distance: string; duration: string };
  onClose: () => void;
}

const HOUR_IN_MS = 1000 * 60 * 60;

const ParkPopup: React.FC<ParkPopupProps> = ({
  activePark,
  onGetDirections,
  isLoadingDirections,
  directions,
  onClose,
}) => {
  const { data: image } = useQuery({
    queryKey: ['parkImage', activePark?.id],
    queryFn: async () => {
      const images = await fetchParkPrimaryImage(activePark!.id);
      return images?.length ? images[0] : null;
    },
    enabled: !!activePark,
  });

  const { data: favoriteParkIds } = useQuery({
    queryKey: ['favoriteParks'],
    queryFn: fetchFavoriteParks,
    staleTime: HOUR_IN_MS,
    gcTime: HOUR_IN_MS,
  });

  const isFavorite =
    activePark && favoriteParkIds && favoriteParkIds.includes(activePark?.id);

  const onClickGetDirections = () => {
    if (activePark) {
      onGetDirections(activePark!.location);
    }
  };

  return (
    <div className={classnames(styles.parkModal, !!activePark && styles.open)}>
      <CgClose onClick={onClose} size={24} className={styles.close} />
      <Link to={`/parks/${activePark?.id}`} className={styles.imgContainer}>
        {image ? (
          <img src={image} className={styles.img} />
        ) : (
          <IconContext.Provider value={{ className: styles.parkIcon }}>
            <LuTrees />
          </IconContext.Provider>
        )}
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
        <div className={styles.directionsContainer}>
          <div className={styles.buttons}>
            <button
              className={styles.directionsButton}
              onClick={onClickGetDirections}
            >
              Lead the way
            </button>
            <Link to={`/parks/${activePark?.id}`}>Fetch park page</Link>
          </div>
          {isLoadingDirections && (
            <Loading className={styles.loadingDirections} />
          )}
          {!isLoadingDirections && directions && (
            <div className={styles.directions}>
              <div className={styles.distance}>
                <IconContext.Provider value={{ className: styles.icon }}>
                  <FaWalking />
                </IconContext.Provider>
                <span>{directions?.distance}</span>
              </div>
              <div className={styles.duration}>
                <IconContext.Provider value={{ className: styles.icon }}>
                  <FaRegClock />
                </IconContext.Provider>
                <span>{directions?.duration}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { ParkPopup };
