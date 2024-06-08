import { Suspense, lazy, useContext, useState } from 'react';
import { useOutletContext } from 'react-router';
import { Link } from 'react-router-dom';
import { User } from '../types/user';
import { Dog } from '../types/dog';
import { DogPreview } from '../components/profile/DogPreview';
import styles from './UserDogs.module.scss';
import { FriendRequestButton } from '../components/profile/FriendRequestButton';
import { UserContext } from '../context/UserContext';
import { Loading } from '../components/Loading';
import { Button } from '../components/Button';

const EditDogsModal = lazy(() => import('../components/profile/EditDogsModal'));

interface UserDogsProps {
  user: User;
  dogs: Dog[];
  isSignedInUser: boolean;
  dogImages: (string | null)[];
}

const UserDogs = () => {
  const { dogs, dogImages, isSignedInUser, user } =
    useOutletContext() as UserDogsProps;
  const { userId: signedInUserId } = useContext(UserContext);
  const [isEditDogsModalOpen, setIsEditDogsModalOpen] = useState(false);

  return (
    <>
      <div className={styles.container}>
        <span className={styles.titleText}>
          {isSignedInUser ? 'My' : `${user.name}'s`} pack
        </span>
        <div className={styles.dogs}>
          {dogs.map((dog, index) => (
            <Link
              to={dog.id}
              key={dog.id}
              state={{ isSignedInUser, userName: user.name }}
            >
              <DogPreview dog={dog} image={dogImages[index]} />
            </Link>
          ))}
        </div>
        {isSignedInUser && (
          <Button
            variant="green"
            className={styles.addDogButton}
            onClick={() => setIsEditDogsModalOpen(true)}
          >
            Add a dog
          </Button>
        )}
        {!isSignedInUser && signedInUserId && (
          <FriendRequestButton
            className={styles.friendRequestButton}
            friendId={user.id}
          />
        )}
      </div>
      <Suspense fallback={<Loading />}>
        <EditDogsModal
          isOpen={isEditDogsModalOpen}
          onClose={() => setIsEditDogsModalOpen(false)}
        />
      </Suspense>
    </>
  );
};

export { UserDogs };
