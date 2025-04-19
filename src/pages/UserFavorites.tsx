import { useParams } from 'react-router';
import styles from './UserFavorites.module.scss';
import { ParkPreview } from '../components/parks/ParkPreview';
import { Link } from 'react-router';
import { fetchParksJSON } from '../services/parks';
import { useQuery } from '@tanstack/react-query';
import { fetchUserFavorites } from '../services/favorites';
import { Loader } from '../components/Loader';
import { useDelayedLoading } from '../hooks/useDelayedLoading';

const UserFavorites = () => {
  const { id: userId } = useParams();

  const { data: favoriteParkIds, isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      const favorites = await fetchUserFavorites(userId!);
      return favorites ?? [];
    },
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
    return <Loader />;
  }

  if (!isLoading && !favoriteParkIds?.length) {
    return (
      <div className={styles.container}>
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
      <span className={styles.title}>My Favorite Parks</span>
      <div className={styles.list}>
        {favoriteParks.map((park) => (
          <ParkPreview park={park} key={park.id} />
        ))}
      </div>
    </div>
  );
};

export default UserFavorites;
