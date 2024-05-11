import { useOutletContext } from 'react-router';
import { User } from '../types/user';
import { Dog } from '../types/dog';
import { DogPreview } from '../components/profile/DogPreview';
import styles from './UserDogs.module.scss';
import { FaCirclePlus } from 'react-icons/fa6';
import { IconContext } from 'react-icons';
import { EditDogsModal } from '../components/profile/EditDogsModal';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface UserDogsProps {
  user: User;
  dogs: Dog[];
  isSignedInUser: boolean;
}

const UserDogs = () => {
  const { dogs, isSignedInUser } = useOutletContext() as UserDogsProps;
  const [isEditDogsModalOpen, setIsEditDogsModalOpen] = useState(false);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.title}>
          <span className={styles.titleText}>Your Dogs</span>
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
            <Link to={`${dog.id}`} key={dog.id}>
              <DogPreview dog={dog} />
            </Link>
          ))}
        </div>
        <div
          className={styles.addDogButton}
          onClick={() => setIsEditDogsModalOpen(true)}
        >
          <IconContext.Provider value={{ className: styles.plus }}>
            <FaCirclePlus />
          </IconContext.Provider>
          <span className={styles.addDogText}>Add Dog</span>
        </div>
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
