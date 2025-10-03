import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  Eye,
  Footprints,
  Hourglass,
  Navigation,
  TreeDeciduous,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import classnames from 'classnames';
import { useQuery } from '@tanstack/react-query';
import { Location, ParkJSON as Park } from '../../types/park';
import { fetchParkPrimaryImage, fetchParksJSON } from '../../services/parks';
import { FavoriteRibbon } from '../FavoriteRibbon';
import { fetchFavoriteParks } from '../../services/favorites';
import { Button } from '../Button';
import { useOrientationContext } from '../../context/OrientationContext';
import { Image } from '../Image';
import { useGeoFormat } from '../../hooks/useGeoFormat';
import { useAppLocale } from '../../hooks/useAppLocale';
import { parksKey, parkKey } from '../../hooks/api/keys';
import { APP_LANGUAGES } from '../../utils/consts';
import { fetchParkWithTranslation } from '../../services/parks';
import { resolveTranslatedPark } from '../../utils/parkTranslations';
import styles from './ParkPopup.module.scss';

interface ParkPopupProps {
  activePark: Park | null;
  onGetDirections: (location: Location) => void;
  isLoadingDirections: boolean;
  directions?: {
    distanceKm?: number;
    durationSeconds?: number;
    error?: string;
  };
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
  const { t } = useTranslation();
  const { formatDistanceKm, formatTravelDurationSeconds } = useGeoFormat();
  const navigate = useNavigate();
  const currentLanguage = useAppLocale();
  const [isClosing, setIsClosing] = useState(false);
  const orientation = useOrientationContext((state) => state.orientation);

  const { data: image } = useQuery({
    queryKey: ['parkImage', activePark?.id],
    queryFn: async () => fetchParkPrimaryImage(activePark!.id),
    enabled: !!activePark,
  });

  const { data: favoriteParkIds } = useQuery({
    queryKey: ['favoriteParks'],
    queryFn: fetchFavoriteParks,
    staleTime: HOUR_IN_MS,
    gcTime: HOUR_IN_MS,
  });

  const { data: parksCurrentLang } = useQuery({
    queryKey: parksKey(currentLanguage),
    queryFn: () => fetchParksJSON({ language: currentLanguage }),
    placeholderData: (previous) => previous,
    retry: 0,
  });

  // prepare EN dataset as a fallback if needed
  const { data: parksEnglish } = useQuery({
    queryKey: parksKey(APP_LANGUAGES.EN),
    queryFn: () => fetchParksJSON({ language: APP_LANGUAGES.EN }),
    enabled: currentLanguage !== APP_LANGUAGES.EN,
    placeholderData: (previous) => previous,
    retry: 0,
  });

  // prefetch park with translation for current language
  useQuery({
    queryKey: parkKey(activePark?.id || '', currentLanguage),
    queryFn: () =>
      fetchParkWithTranslation({
        parkId: activePark!.id,
        language: currentLanguage,
      }),
    enabled: !!activePark?.id,
  });

  const translatedFromCurrent = activePark
    ? (parksCurrentLang?.find((p) => p.id === activePark.id) as undefined)
    : undefined;
  const translatedFromEnglish = activePark
    ? (parksEnglish?.find((p) => p.id === activePark.id) as undefined)
    : undefined;

  const {
    name: displayName,
    city: displayCity,
    address: displayAddress,
  } = resolveTranslatedPark({
    activePark,
    preferred: translatedFromCurrent,
    fallback: translatedFromEnglish,
  });

  const isFavorite =
    activePark && favoriteParkIds && favoriteParkIds.includes(activePark?.id);

  const onClickGetDirections = () => {
    if (activePark) {
      onGetDirections(activePark!.location);
    }
  };

  const onClickViewPark = () => {
    navigate(`/parks/${activePark?.id}`);
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
      <Button
        variant="round"
        className={styles.close}
        onClick={() => setIsClosing(true)}
      >
        <X size={18} />
      </Button>
      <Link
        to={`/parks/${activePark?.id}`}
        className={classnames(styles.imgContainer, {
          [styles.hidden]: orientation === 'portrait' && (directions || !image),
        })}
      >
        {image && <Image src={image} className={styles.img} />}
        {!image && (
          <div className={styles.noImg}>
            <TreeDeciduous size={56} color={styles.green} strokeWidth={1} />
          </div>
        )}
        {isFavorite && <FavoriteRibbon className={styles.favorite} />}
      </Link>
      <div className={styles.detailsContainer}>
        <div className={styles.details}>
          <Link to={`/parks/${activePark?.id}`} className={styles.name}>
            <span>{displayName}</span>{' '}
            {/* changed by me: use translated name with fallback */}
          </Link>
          <div className={styles.addressContainer}>
            <span className={styles.address}>{displayAddress},</span>{' '}
            <span className={styles.city}>{displayCity}</span>
          </div>
        </div>
        <div>
          {canGetDirections && (
            <div className={styles.directionsContainer}>
              {isLoadingDirections && <div>{t('parks.popup.loading')}</div>}
              {!isLoadingDirections && directions && (
                <div className={styles.directions}>
                  {directions.error ? (
                    <div className={styles.error}>{directions.error}</div>
                  ) : (
                    <>
                      <div className={styles.distance}>
                        <Footprints
                          className={classnames(
                            styles.icon,
                            styles.directionsIcon
                          )}
                          color={styles.pink}
                          size={16}
                        />
                        <span>
                          {formatDistanceKm({
                            km: directions.distanceKm ?? 0,
                            maximumFractionDigits: 1,
                          })}
                        </span>
                      </div>
                      <div className={styles.duration}>
                        <Hourglass
                          className={classnames(
                            styles.icon,
                            styles.directionsIcon
                          )}
                          color={styles.pink}
                          size={16}
                        />
                        <span>
                          {formatTravelDurationSeconds({
                            seconds: directions.durationSeconds ?? 0,
                          })}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          <div className={styles.buttons}>
            {canGetDirections && (
              <Button
                variant="secondary"
                className={styles.button}
                onClick={onClickGetDirections}
              >
                <Navigation size={12} className={styles.icon} />
                <span>{t('parks.popup.leadTheWay')}</span>
              </Button>
            )}
            <Button className={styles.button} onClick={onClickViewPark}>
              <Eye size={12} className={styles.icon} />
              <span>{t('parks.preview.view')}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ParkPopup };
