import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { User } from '../types/user';
import { Dog } from '../types/dog';
import { DogPreview } from '../components/profile/DogPreview';
import { Button } from '../components/Button';
import { uploadDogPrimaryImage } from '../services/dogs';
import { queryClient } from '../services/react-query';
import { CameraModal } from '../components/camera/CameraModal';
import { EditDogModal } from '../components/dog/EditDogModal';
import styles from './UserDogs.module.scss';
import { Plus } from 'lucide-react';
import { useUploadImage } from '../hooks/api/useUploadImage';
import { Trans, useTranslation } from 'react-i18next';
import { capitalizeText } from '../utils/text';

interface UserDogsProps {
  user: User;
  dogs: Dog[];
  isSignedInUser: boolean;
  dogImages: (string | null)[];
}

const UserDogs = () => {
  const { user, dogs, dogImages, isSignedInUser } =
    useOutletContext() as UserDogsProps;
  const { t } = useTranslation();

  const [isEditDogsModalOpen, setIsEditDogsModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [newDogId, setNewDogId] = useState('');

  const { mutate: setDogImage } = useUploadImage({
    mutationFn: (img: string | File) =>
      uploadDogPrimaryImage({
        image: img,
        dogId: newDogId!,
        upsert: true,
      }),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['dogImage', newDogId],
      });
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
              <span>
                {isSignedInUser ? (
                  capitalizeText(t('userDogs.titleMyPack'))
                ) : (
                  <Trans
                    i18nKey="userDogs.titleUsersPack"
                    values={{ name: user.name }}
                    components={{
                      name: <span className={styles.name} />,
                    }}
                  />
                )}
              </span>
            </div>
            {isSignedInUser && (
              <Button
                className={styles.addDogButton}
                onClick={() => setIsEditDogsModalOpen(true)}
              >
                <Plus size={16} />
                <span>{t('userDogs.addDog')}</span>
              </Button>
            )}
          </div>
        )}
        {!dogs?.length && isSignedInUser && (
          <div className={styles.noDogsTitleContainer}>
            <span>{t('userDogs.emptySignedIn1')}</span>
            <span>{t('userDogs.emptySignedIn2')}</span>
            {isSignedInUser && (
              <Button
                className={styles.addDogButton}
                onClick={() => setIsEditDogsModalOpen(true)}
              >
                <Plus size={16} />
                <span>{t('userDogs.addDog')}</span>
              </Button>
            )}
          </div>
        )}
        {!dogs?.length && !isSignedInUser && (
          <div className={styles.noDogsTitleContainer}>
            <div>
              <Trans
                i18nKey="userDogs.otherEmpty"
                values={{ name: user.name }}
                components={{
                  name: <span className={styles.name} />,
                }}
              />
            </div>
          </div>
        )}
        <div className={styles.dogs}>
          {dogs?.map((dog, index) => (
            <Link
              to={`/dogs/${dog.id}`}
              key={dog.id}
              state={{ userName: user.name, isSignedInUser }}
            >
              <DogPreview dog={dog} image={dogImages[index]} />
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
        title={t('userDogs.cameraModalTitle')}
        variant="top"
        onUploadImg={onAddDogImage}
        open={isCameraModalOpen}
        setOpen={setIsCameraModalOpen}
      />
    </>
  );
};

export default UserDogs;
