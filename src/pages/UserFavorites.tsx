import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import classnames from 'classnames';
import { ParkPreview } from '../components/parks/ParkPreview';
import { fetchParksJSON } from '../services/parks';
import { fetchUserFavorites } from '../services/favorites';
import { Loader } from '../components/Loader';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import styles from './UserFavorites.module.scss';

const UserFavorites = () => {
  const { id: userId } = useParams();

  const { data: favoriteParkIds, isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => fetchUserFavorites(userId!),
  });

  const { data: parks, isLoading: isLoadingParks } = useQuery({
    queryKey: ['parks'],
    queryFn: fetchParksJSON,
    enabled: !!favoriteParkIds?.length,
  });

  const isLoading = isLoadingParks || isLoadingFavorites;

  const { showLoader } = useDelayedLoading({
    isLoading,
    minDuration: 750,
  });

  const favoriteParks = parks?.length
    ? parks.filter((park) => favoriteParkIds?.includes(park.id))
    : [];

  if (showLoader) {
    return <Loader inside className={styles.loader} />;
  }

  if (!isLoading && !favoriteParkIds?.length) {
    return (
      <div className={classnames(styles.container, styles.empty)}>
        <div>No favorite parks yet.</div>
        <div>
          Sniff out nearby parks{' '}
          <Link to="/" className={styles.link}>
            here!
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <span className={styles.title}>My favorite parks</span>
      <div className={styles.list}>
        {favoriteParks.map((park) => (
          <ParkPreview park={park} key={park.id} />
        ))}
      </div>
    </div>
  );
};

export default UserFavorites;
