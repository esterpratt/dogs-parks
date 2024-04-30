import { TiHeartFullOutline } from 'react-icons/ti';
import classnames from 'classnames';
import styles from './FavoriteButton.module.scss';
import { useEffect, useState } from 'react';
import { IconContext } from 'react-icons';

interface FavoriteButtonProps {
  parkId: string;
  userId: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ parkId, userId }) => {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    console.log(parkId, userId);
  }, [parkId, userId]);

  const toggleFavorite = () => {
    setFavorite((prev) => !prev);
  };

  return (
    <IconContext.Provider
      value={{
        size: '32',
        className: classnames(styles.heart, favorite && styles.favorite),
      }}
    >
      <TiHeartFullOutline onClick={toggleFavorite} />
    </IconContext.Provider>
  );
};

export { FavoriteButton };
