import { useParams } from 'react-router';
import styles from './UserFavorites.module.scss';
import { ParkPreview } from '../components/parks/ParkPreview';
import { Link } from 'react-router-dom';
import { fetchParks } from '../services/parks';
import { useQuery } from '@tanstack/react-query';
import { fetchUserFavorites } from '../services/favorites';
import { Loading } from '../components/Loading';

const UserFavorites = () => {
  const { id: userId } = useParams();

  const { data: favoriteParkIds, isLoading: isLoadingFavorites } = useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      const favorites = await fetchUserFavorites(userId!);
      return favorites?.parkIds ?? [];
    },
  });

  const { data: parks, isLoading: isLoadingParks } = useQuery({
    queryKey: ['parks'],
    queryFn: fetchParks,
    enabled: !!favoriteParkIds?.length,
  });

  const favoriteParks = parks?.length
    ? parks.filter((park) => favoriteParkIds!.includes(park.id))
    : [];

  if (isLoadingParks || isLoadingFavorites) {
    return <Loading />;
  }

  if (!favoriteParkIds?.length) {
    return (
      <div className={styles.container}>
        <span className={styles.noFavoritesTitle}>No favorite parks yet.</span>
        <span className={styles.link}>
          Sniff out nearby parks <Link to="/">here!</Link>
        </span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <span className={styles.title}>Your Favorite Parks:</span>
      <div className={styles.list}>
        {favoriteParks.map((park) => (
          <ParkPreview park={park} key={park.id} className={styles.park} />
        ))}
      </div>
    </div>
  );
};

export default UserFavorites;
