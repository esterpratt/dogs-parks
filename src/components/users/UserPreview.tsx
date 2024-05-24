import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { PiDog } from 'react-icons/pi';
import classnames from 'classnames';
import { User } from '../../types/user';
import { Dog } from '../../types/dog';
import styles from './UserPreview.module.scss';
import { fetchDogPrimaryImage } from '../../services/dogs';
import { FriendRequestButton } from '../profile/FriendRequestButton';
import { UserContext } from '../../context/UserContext';
import { useQuery } from '@tanstack/react-query';

interface UserPreviewProps {
  user: User & { dogs: Dog[] };
  showFriendshipButton?: boolean;
}

const UserPreview: React.FC<UserPreviewProps> = ({
  user,
  showFriendshipButton = true,
}) => {
  const { userId } = useContext(UserContext);
  const { data: dogImage } = useQuery({
    queryKey: ['dogImage', user.dogs[0].id],
    queryFn: async () => {
      const images = await fetchDogPrimaryImage(user.dogs[0].id);
      if (images?.length) {
        return images[0];
      }
      return null;
    },
  });

  let dogNames = user.dogs[0].name;
  if (user.dogs.length > 1) {
    const names = user.dogs.map((dog) => dog.name);
    names.pop();
    const strNames = names.join(', ');
    dogNames = `${strNames} & ${user.dogs[user.dogs.length - 1].name}`;
  }

  return (
    <div className={styles.container}>
      <Link
        to={`/profile/${user.id}`}
        className={classnames(styles.cardContainer, !userId && styles.disabled)}
      >
        <div className={classnames(styles.dogImage, !dogImage && styles.empty)}>
          {dogImage ? <img src={dogImage} /> : <PiDog size={64} />}
        </div>
        <div className={styles.details}>
          <span className={styles.dogNames}>{dogNames}</span>
          <span className={styles.userName}>Owner: {user.name}</span>
        </div>
      </Link>
      {!!userId && showFriendshipButton && (
        <FriendRequestButton
          friendId={user.id}
          buttonVariant="basic"
          className={styles.button}
        />
      )}
    </div>
  );
};

export { UserPreview };
