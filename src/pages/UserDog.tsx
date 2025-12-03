import { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Cake, Mars, MoveLeft, Pencil, Tag, Venus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { GENDER } from '../types/dog';
import {
  fetchDogPrimaryImage,
  fetchDogs,
  uploadDogPrimaryImage,
} from '../services/dogs';
import { queryClient } from '../services/react-query';
import { getLocalizedDogAgeText } from '../utils/dogAge';
import { capitalizeText } from '../utils/text';
import { useUploadImage } from '../hooks/api/useUploadImage';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import DogIcon from '../assets/dog.svg?react';
import { DogDetails } from '../components/dog/DogDetails';
import { DogGalleryContainer } from '../components/dog/DogGalleryContainer';
import { Loader } from '../components/Loader';
import { EnlargeImageModal } from '../components/EnlargeImageModal';
import { Button } from '../components/Button';
import { DogPreferences } from '../components/dog/DogPreferences';
import { Header } from '../components/Header';
import { HeaderImage } from '../components/HeaderImage';
import { PrevLinks } from '../components/PrevLinks';
import { EditDogModal } from '../components/dog/EditDogModal';
import { CameraModal } from '../components/camera/CameraModal';

import styles from './UserDog.module.scss';

const UserDog = () => {
  const { dogId } = useParams();
  const { state } = useLocation();
  const [isEditDogsModalOpen, setIsEditDogsModalOpen] = useState(false);
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [imageToEnlarge, setImageToEnlarge] = useState<string>('');
  const [isEnlargedImageModalOpen, setIsEnlargeImageModalOpen] =
    useState(false);
  const { isSignedInUser, userName } = state;
  const { t } = useTranslation();

  const { data: dog, isLoading: isLoadingDog } = useQuery({
    queryKey: ['dogs', dogId],
    queryFn: async () => {
      const dogs = await fetchDogs([dogId!]);
      return dogs?.[0];
    },
    throwOnError: true,
  });

  const { data: primaryImage } = useQuery({
    queryKey: ['dogImage', dogId],
    queryFn: async () => fetchDogPrimaryImage(dogId!),
  });

  const { showLoader } = useDelayedLoading({
    isLoading: isLoadingDog,
    minDuration: 750,
  });

  const { mutate: setDogImage, isPending } = useUploadImage({
    mutationFn: (img: string | File) =>
      uploadDogPrimaryImage({
        image: img,
        dogId: dogId!,
        upsert: !!primaryImage,
      }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dogImage', dogId] });
    },
  });

  const onCloseDogsModal = () => {
    setIsEditDogsModalOpen(false);
  };

  const onEditDog = (scrollToInput?: boolean) => {
    setIsEditDogsModalOpen(true);
    if (scrollToInput) {
      sessionStorage.setItem('scroll-to-input', 'true');
    }
  };

  const onUploadImg = async (img: string | File) => {
    setIsAddImageModalOpen(false);
    setDogImage(img);
  };

  const onClickImage = (img: string) => {
    setImageToEnlarge(img);
    setIsEnlargeImageModalOpen(true);
  };

  if (showLoader) {
    return <Loader style={{ paddingTop: '64px' }} />;
  }

  if (!dog) {
    return null;
  }

  const ageText = getLocalizedDogAgeText({
    birthday: dog.birthday,
    gender: dog.gender,
    t,
  });

  return (
    <>
      <div className={styles.container}>
        <Header
          prevLinksCmp={
            <PrevLinks
              links={{
                to: `/profile/${dog.owner}/dogs`,
                icon: <MoveLeft size={16} />,
                text: isSignedInUser ? (
                  t('userDogs.titleMyPack')
                ) : (
                  <Trans
                    i18nKey="userDogs.titleUsersPack"
                    values={{ name: userName }}
                    components={{
                      name: <span className={styles.name} />,
                    }}
                  />
                ),
              }}
            />
          }
          imgCmp={
            <HeaderImage
              imgSrc={primaryImage}
              onClickImg={onClickImage}
              NoImgIcon={DogIcon}
              onClickEditPhoto={
                isSignedInUser ? () => setIsAddImageModalOpen(true) : null
              }
              isLoading={isPending}
            />
          }
          bottomCmp={
            <>
              <div className={styles.details}>
                <div>
                  <span className={styles.name}>{dog.name}</span>
                  {dog.gender && (
                    <span className={styles.gender}>
                      {dog.gender === GENDER.FEMALE ? (
                        <Venus color={styles.green} size={18} />
                      ) : (
                        <Mars color={styles.green} size={18} />
                      )}
                    </span>
                  )}
                  {!isSignedInUser && (
                    <span className={styles.userName}>
                      {dog.gender === GENDER.FEMALE
                        ? t('dogs.labels.ownersDogFemale', {
                            name: capitalizeText(userName),
                          })
                        : t('dogs.labels.ownersDogMale', {
                            name: capitalizeText(userName),
                          })}
                    </span>
                  )}
                </div>
                <div>
                  {ageText && (
                    <span className={styles.age}>
                      <Cake color={styles.green} size={14} />
                      <span>{ageText}</span>
                    </span>
                  )}
                  {dog.breed && (
                    <span className={styles.breed}>
                      <Tag color={styles.green} size={14} />
                      <span>
                        {t(`dogs.breeds.${dog.breed}`, {
                          defaultValue: dog.breed,
                        })}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              {isSignedInUser && (
                <Button
                  variant="secondary"
                  onClick={() => onEditDog()}
                  className={styles.editButton}
                >
                  <Pencil size={18} />
                </Button>
              )}
            </>
          }
          bottomClassName={classnames(styles.bottom, {
            [styles.center]: !isSignedInUser,
          })}
        />
        <div className={styles.content}>
          <DogDetails
            isSignedInUser={isSignedInUser}
            dog={dog}
            userName={userName}
            onEditDog={() => onEditDog()}
          />
          <DogPreferences
            dog={dog}
            isSignedInUser={isSignedInUser}
            userName={userName}
            onEditDog={() => onEditDog(true)}
          />
          <DogGalleryContainer dog={dog} isSignedInUser={isSignedInUser} />
        </div>
      </div>
      <EnlargeImageModal
        isOpen={isEnlargedImageModalOpen}
        onClose={() => setIsEnlargeImageModalOpen(false)}
        imgSrc={imageToEnlarge}
        setImgSrc={setImageToEnlarge}
      />
      <EditDogModal
        dog={dog}
        isOpen={isEditDogsModalOpen}
        onClose={onCloseDogsModal}
      />
      <CameraModal
        open={isAddImageModalOpen}
        setOpen={setIsAddImageModalOpen}
        onUploadImg={onUploadImg}
      />
    </>
  );
};

export default UserDog;
