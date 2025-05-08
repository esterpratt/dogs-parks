import { useState } from 'react';
import { useOutletContext, useRevalidator, Link } from 'react-router-dom';
import { useIsFetching, useMutation } from '@tanstack/react-query';
import { User } from '../types/user';
import { Dog } from '../types/dog';
import { DogPreview } from '../components/profile/DogPreview';
import { Button } from '../components/Button';
import { uploadDogPrimaryImage } from '../services/dogs';
import { queryClient } from '../services/react-query';
import { LOADING } from '../utils/consts';
import { CameraModal } from '../components/camera/CameraModal';
import { EditDogModal } from '../components/dog/EditDogModal';
import styles from './UserDogs.module.scss';

interface UserDogsProps {
  user: User;
  dogs: Dog[];
  isSignedInUser: boolean;
  dogImages: (string | null)[];
}

const UserDogs = () => {
  const { user, dogs, dogImages, isSignedInUser } =
    useOutletContext() as UserDogsProps;

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
        {!!dogs?.length && (
          <div className={styles.titleContainer}>
            <div className={styles.titleText}>
              <span className={styles.name}>
                {isSignedInUser ? 'My' : `${user.name}'s`}
              </span>{' '}
              pack
            </div>
            {isSignedInUser && (
              <Button
                className={styles.addDogButton}
                onClick={() => setIsEditDogsModalOpen(true)}
              >
                Add dog
              </Button>
            )}
          </div>
        )}
        {!dogs?.length && isSignedInUser && (
          <div className={styles.noDogsTitleContainer}>
            <span>Your dog squad is looking pretty empty.</span>
            <span>Time to recruit some furry friends!</span>
            {isSignedInUser && (
              <Button
                className={styles.addDogButton}
                onClick={() => setIsEditDogsModalOpen(true)}
              >
                Add dog
              </Button>
            )}
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
              to={`/dogs/${dog.id}`}
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
      </div>
      <EditDogModal
        isOpen={isEditDogsModalOpen}
        onClose={() => setIsEditDogsModalOpen(false)}
        onAddDog={onAddDog}
      />
      <CameraModal
        title="Add your dog image"
        variant="top"
        onUploadImg={onAddDogImage}
        open={isCameraModalOpen}
        setOpen={setIsCameraModalOpen}
      />
    </>
  );
};

export default UserDogs;
