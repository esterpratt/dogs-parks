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

  const { data: favoriteParkIds = [], isPending: isPendingFavorites } =
    useQuery({
      queryKey: ['favorites', userId],
      queryFn: async () => {
        const favorites = await fetchUserFavorites(userId!);
        return favorites?.parkIds ?? [];
      },
    });

  const { data: parks = [], isPending: isPendingParks } = useQuery({
    queryKey: ['parks'],
    queryFn: fetchParks,
    enabled: !!favoriteParkIds.length,
  });

  const favoriteParks = parks.filter((park) =>
    favoriteParkIds.includes(park.id)
  );

  if (isPendingParks || isPendingFavorites) {
    return <Loading />;
  }

  if (!favoriteParkIds.length) {
    return (
      <div className={styles.container}>
        <span className={styles.noFavoritesTitle}>
          You don't have any favorite parks yet.
        </span>
        <span className={styles.link}>
          See what parks are close to you <Link to="/">here</Link>
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
