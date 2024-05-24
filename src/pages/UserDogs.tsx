import { useOutletContext } from 'react-router';
import { User } from '../types/user';
import { Dog } from '../types/dog';
import { DogPreview } from '../components/profile/DogPreview';
import styles from './UserDogs.module.scss';
import { FaCirclePlus } from 'react-icons/fa6';
import { IconContext } from 'react-icons';
import { EditDogsModal } from '../components/profile/EditDogsModal';
import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { FriendRequestButton } from '../components/profile/FriendRequestButton';
import { UserContext } from '../context/UserContext';

interface UserDogsProps {
  user: User;
  dogs: Dog[];
  isSignedInUser: boolean;
}

const UserDogs = () => {
  const { dogs, isSignedInUser, user } = useOutletContext() as UserDogsProps;
  const { userId: signedInUserId } = useContext(UserContext);
  const [isEditDogsModalOpen, setIsEditDogsModalOpen] = useState(false);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.title}>
          <span className={styles.titleText}>
            {isSignedInUser ? 'Your' : `${user.name}'s`} Dogs
          </span>
          {isSignedInUser && (
            <div
              className={styles.addDogText}
              onClick={() => setIsEditDogsModalOpen(true)}
            >
              Add Dog
            </div>
          )}
        </div>
        <div className={styles.dogs}>
          {dogs.map((dog) => (
            <Link
              to={dog.id}
              key={dog.id}
              state={{ isSignedInUser, userName: user.name }}
            >
              <DogPreview dog={dog} />
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
            <span className={styles.addDogText}>Add Dog</span>
          </div>
        )}
        {!isSignedInUser && signedInUserId && (
          <FriendRequestButton
            className={styles.friendRequestButton}
            friendId={user.id}
          />
        )}
      </div>
      <EditDogsModal
        isOpen={isEditDogsModalOpen}
        onClose={() => setIsEditDogsModalOpen(false)}
      />
      ;
    </>
  );
};

export { UserDogs };
