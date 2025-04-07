import { lazy, Suspense, useContext, useState } from 'react';
import { useOutletContext, useRevalidator } from 'react-router';
import { Link } from 'react-router';
import { User } from '../types/user';
import { Dog } from '../types/dog';
import { DogPreview } from '../components/profile/DogPreview';
import styles from './UserDogs.module.scss';
import { FriendRequestButton } from '../components/profile/FriendRequestButton';
import { UserContext } from '../context/UserContext';
import { Button } from '../components/Button';
import { useIsFetching, useMutation } from '@tanstack/react-query';
import { uploadDogPrimaryImage } from '../services/dogs';
import { queryClient } from '../services/react-query';
import { LOADING } from '../utils/consts';

const EditDogsModal = lazy(() => import('../components/profile/EditDogsModal'));
const CameraModal = lazy(() => import('../components/camera/CameraModal'));

interface UserDogsProps {
  user: User;
  dogs: Dog[];
  isSignedInUser: boolean;
  dogImages: (string | null)[];
}

const UserDogs = () => {
  const { user, dogs, dogImages, isSignedInUser } =
    useOutletContext() as UserDogsProps;
  const { userId: signedInUserId } = useContext(UserContext);

  const [isEditDogsModalOpen, setIsEditDogsModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [newDogId, setNewDogId] = useState('');
  const { revalidate } = useRevalidator();

  const isFetching = useIsFetching({
    queryKey: ['dogImage', newDogId],
  });

  const { mutate: setDogImage, isPending: isUploadingImage } = useMutation({
    mutationFn: (img: string | File) =>
      uploadDogPrimaryImage({
        image: img,
        dogId: newDogId!,
        upsert: true,
      }),
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
        {!!dogs?.length && (
          <div className={styles.titleText}>
            <span className={styles.name}>
              {isSignedInUser ? 'My' : `${user.name}'s`}
            </span>{' '}
            pack
          </div>
        )}
        {!dogs?.length && isSignedInUser && (
          <div>
            Your dog squad is looking pretty empty! Time to recruit some furry
            friends!
          </div>
        )}
        {!dogs?.length && !isSignedInUser && (
          <div>
            <span className={styles.name}>{user.name}'s </span>
            <span>pack seems to be empty</span>
          </div>
        )}
        <div className={styles.dogs}>
          {dogs?.map((dog, index) => (
            <Link
              to={dog.id}
              key={dog.id}
              state={{ userName: user.name, isSignedInUser }}
            >
              <DogPreview
                dog={dog}
                image={
                  dog.id === newDogId && (isUploadingImage || isFetching > 0)
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
      <Suspense fallback={null}>
        <EditDogsModal
          isOpen={isEditDogsModalOpen}
          onClose={() => setIsEditDogsModalOpen(false)}
          onAddDog={onAddDog}
        />
      </Suspense>
      <Suspense fallback={null}>
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
