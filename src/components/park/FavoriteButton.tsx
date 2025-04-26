import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  addFavorite,
  fetchUserFavorites,
  removeFavorite,
} from '../../services/favorites';
import { queryClient } from '../../services/react-query';
import { ParkIcon } from './ParkIcon';
import styles from './FavoriteButton.module.scss';

interface FavoriteButtonProps {
  parkId: string;
  userId: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ parkId, userId }) => {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const { data: favoritesParkIds } = useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      const favorites = await fetchUserFavorites(userId);
      return favorites ?? [];
    },
  });

  useEffect(() => {
    setIsFavorite(favoritesParkIds ? favoritesParkIds.includes(parkId) : false);
  }, [favoritesParkIds, parkId]);

  const { mutate: mutateFavorite } = useMutation({
    mutationFn: (isFavorite: boolean) =>
      isFavorite
        ? addFavorite({ parkId, userId })
        : removeFavorite({ parkId, userId }),
    onMutate: async (isFavorite) => {
      setIsFavorite(isFavorite);
      return { prevFavorite: !isFavorite };
    },
    onError: (_error, _data, context) => {
      setIsFavorite(!context!.prevFavorite);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
  });

  const toggleFavorite = async () => {
    mutateFavorite(!isFavorite);
  };

  return (
    <ParkIcon
      IconCmp={Heart}
      onClick={toggleFavorite}
      iconColor={isFavorite ? styles.pink : styles.grey}
      textCmp={<span>{isFavorite ? 'Unlike' : 'Like'}</span>}
    />
  );
};

export { FavoriteButton };
