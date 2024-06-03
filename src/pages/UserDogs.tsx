import { Suspense, lazy } from 'react';
import { useOutletContext } from 'react-router';
import { User } from '../types/user';
import { Dog } from '../types/dog';
import { DogPreview } from '../components/profile/DogPreview';
import styles from './UserDogs.module.scss';
import { FaCirclePlus } from 'react-icons/fa6';
import { IconContext } from 'react-icons';
import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { FriendRequestButton } from '../components/profile/FriendRequestButton';
import { UserContext } from '../context/UserContext';
import { Loading } from '../components/Loading';

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
        <div className={styles.title}>
          <span className={styles.titleText}>
            {isSignedInUser ? 'Your' : `${user.name}'s`} pack
          </span>
          {isSignedInUser && (
            <div
              className={styles.addDogText}
              onClick={() => setIsEditDogsModalOpen(true)}
            >
              Add a Dog
            </div>
          )}
        </div>
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
          <div
            className={styles.addDogButton}
            onClick={() => setIsEditDogsModalOpen(true)}
          >
            <IconContext.Provider value={{ className: styles.plus }}>
              <FaCirclePlus />
            </IconContext.Provider>
            <span className={styles.addDogText}>Add a Dog</span>
          </div>
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
      ;
    </>
  );
};

export { UserDogs };
