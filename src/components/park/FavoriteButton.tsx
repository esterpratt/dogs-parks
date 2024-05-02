import { TiHeartFullOutline } from 'react-icons/ti';
import classnames from 'classnames';
import styles from './FavoriteButton.module.scss';
import { useEffect, useState } from 'react';
import { IconContext } from 'react-icons';
import {
  addFavorite,
  fetchUserFavorites,
  removeFavorite,
} from '../../services/favorites';

interface FavoriteButtonProps {
  parkId: string;
  userId: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ parkId, userId }) => {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  useEffect(() => {
    const getIsFavorite = async () => {
      const favorites = await fetchUserFavorites(userId);
      setIsFavorite(Boolean(favorites) && favorites!.parkIds.includes(parkId));
    };
    getIsFavorite();
  }, [parkId, userId]);

  const toggleFavorite = async () => {
    setIsFavorite((prev) => !prev);
    if (isFavorite) {
      await removeFavorite({ parkId, userId });
    } else {
      await addFavorite({ parkId, userId });
    }
  };

  return (
    <IconContext.Provider
      value={{
        size: '32',
        className: classnames(styles.heart, isFavorite && styles.favorite),
      }}
    >
      <TiHeartFullOutline onClick={toggleFavorite} />
    </IconContext.Provider>
  );
};

export { FavoriteButton };
