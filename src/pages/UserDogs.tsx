import { Suspense, lazy, useContext, useState } from 'react';
import { useOutletContext, useRevalidator } from 'react-router';
import { Link } from 'react-router-dom';
import { User } from '../types/user';
import { Dog } from '../types/dog';
import { DogPreview, LOADING } from '../components/profile/DogPreview';
import styles from './UserDogs.module.scss';
import { FriendRequestButton } from '../components/profile/FriendRequestButton';
import { UserContext } from '../context/UserContext';
import { Loader } from '../components/Loading';
import { Button } from '../components/Button';
import CameraModal from '../components/camera/CameraModal';
import { useMutation } from '@tanstack/react-query';
import { uploadDogPrimaryImage } from '../services/dogs';
import { queryClient } from '../services/react-query';

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
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [newDogId, setNewDogId] = useState('');
  const { revalidate } = useRevalidator();

  const { mutate: setDogImage, isPending: isUploadingImage } = useMutation({
    mutationFn: (img: string | File) => uploadDogPrimaryImage(img, newDogId!),
    onMutate: async () => {
      queryClient.invalidateQueries({
        queryKey: ['dogImage', newDogId],
      });
    },
    onSettled: () => {
      revalidate();
    },
  });

  const onAddDog = (dogId?: string) => {
    if (dogId) {
      setNewDogId(dogId);
      setIsCameraModalOpen(true);
    }

    setIsEditDogsModalOpen(false);
  };

  const onAddDogImage = (img: string | File) => {
    setIsCameraModalOpen(false);
    setDogImage(img);
  };

  return (
    <>
      <div className={styles.container}>
        {!isSignedInUser && (
          <div className={styles.prevLinks}>
            {signedInUserId && (
              <Link
                to={`/profile/${signedInUserId}/friends`}
                className={styles.prevLink}
              >
                Go to My Friends
              </Link>
            )}
            <Link to="/users" className={styles.prevLink}>
              Go to Users
            </Link>
          </div>
        )}
        {!!dogs.length && (
          <div className={styles.titleText}>
            <span className={styles.name}>
              {isSignedInUser ? 'My' : `${user.name}'s`}
            </span>{' '}
            pack
          </div>
        )}
        {!dogs.length && isSignedInUser && (
          <div>
            Your dog squad is looking pretty empty! Time to recruit some furry
            friends!
          </div>
        )}
        {!dogs.length && !isSignedInUser && (
          <div>
            <span className={styles.name}>{user.name}'s </span>
            <span>pack seems to be empty</span>
          </div>
        )}
        <div className={styles.dogs}>
          {dogs.map((dog, index) => (
            <Link
              to={dog.id}
              key={dog.id}
              state={{ isSignedInUser, userName: user.name }}
            >
              <DogPreview
                dog={dog}
                image={
                  dog.id === newDogId && isUploadingImage
                    ? LOADING
                    : dogImages[index]
                }
              />
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
      <Suspense fallback={<Loader />}>
        <EditDogsModal
          isOpen={isEditDogsModalOpen}
          onClose={() => setIsEditDogsModalOpen(false)}
          onAddDog={onAddDog}
        />
      </Suspense>
      <Suspense fallback={<Loader />}>
        <CameraModal
          title="Add your dog image"
          variant="centerTop"
          onUploadImg={onAddDogImage}
          open={isCameraModalOpen}
          setOpen={setIsCameraModalOpen}
        />
      </Suspense>
    </>
  );
};

export { UserDogs };
