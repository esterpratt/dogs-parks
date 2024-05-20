import { useContext } from 'react';
import { useLoaderData } from 'react-router';
import styles from './UserFavorites.module.scss';
import { ParksContext } from '../context/ParksContext';
import { ParkPreview } from '../components/parks/ParkPreview';
import { Link } from 'react-router-dom';

const UserFavorites = () => {
  const { favoriteParkIds } = useLoaderData() as { favoriteParkIds: string[] };
  const { parks } = useContext(ParksContext);

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

  const favoriteParks = parks.filter((park) =>
    favoriteParkIds.includes(park.id)
  );

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
