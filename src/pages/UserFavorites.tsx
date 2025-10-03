import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import classnames from 'classnames';
import { ParkPreview } from '../components/parks/ParkPreview';
import { fetchParksJSON } from '../services/parks';
import { fetchUserFavorites } from '../services/favorites';
import { Loader } from '../components/Loader';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { useAppLocale } from '../hooks/useAppLocale';
import { parksKey } from '../hooks/api/keys';
import { usePrefetchParksWithTranslation } from '../hooks/api/usePrefetchParksWithTranslation';
import styles from './UserFavorites.module.scss';
import { useTranslation } from 'react-i18next';

const UserFavorites = () => {
  const { id: userId } = useParams();
  const { t } = useTranslation();

  const { data: favoriteParkIds, isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => fetchUserFavorites(userId!),
  });

  const currentLanguage = useAppLocale();

  const { data: parks, isLoading: isLoadingParks } = useQuery({
    queryKey: parksKey(currentLanguage),
    queryFn: () => fetchParksJSON({ language: currentLanguage }),
    enabled: !!favoriteParkIds?.length,
    placeholderData: (previous) => previous,
    retry: 0,
  });

  const isLoading = isLoadingParks || isLoadingFavorites;

  const { showLoader } = useDelayedLoading({
    isLoading,
    minDuration: 750,
  });

  const favoriteParks = parks?.length
    ? parks.filter((park) => favoriteParkIds?.includes(park.id))
    : [];

  // prefetch favorite parks with translations for current language
  usePrefetchParksWithTranslation({
    parkIds: favoriteParks.map((p) => p.id),
    language: currentLanguage,
  });

  if (showLoader) {
    return <Loader inside className={styles.loader} />;
  }

  if (!isLoading && !favoriteParkIds?.length) {
    return (
      <div className={classnames(styles.container, styles.empty)}>
        <div>{t('favorites.none')}</div>
        <div>
          {t('favorites.sniffParksPrefix')}{' '}
          <Link to="/parks" className={styles.link}>
            {t('favorites.sniffParksLink')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <span className={styles.title}>{t('favorites.title')}</span>
      <div className={styles.list}>
        {favoriteParks.map((park) => (
          <ParkPreview park={park} key={park.id} />
        ))}
      </div>
    </div>
  );
};

export default UserFavorites;
