import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PiDog } from 'react-icons/pi';
import classnames from 'classnames';
import { User } from '../../types/user';
import { Dog } from '../../types/dog';
import styles from './UserPreview.module.scss';
import { fetchDogPrimaryImage } from '../../services/dogs';
import { FriendRequestButton } from '../profile/FriendRequestButton';
import { UserContext } from '../../context/UserContext';

interface UserPreviewProps {
  user: User & { dogs: Dog[] };
}

const UserPreview: React.FC<UserPreviewProps> = ({ user }) => {
  const [dogImage, setDogImage] = useState('');
  const { userId } = useContext(UserContext);

  useEffect(() => {
    const getDogPrimaryImage = async () => {
      const dogId = user.dogs[0].id;
      const image = await fetchDogPrimaryImage(dogId);
      if (image && image.length) {
        setDogImage(image[0]);
      }
    };

    getDogPrimaryImage();
  }, [user]);

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
      {!!userId && (
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
