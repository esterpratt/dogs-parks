import { useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { Cake, Mars, MoveLeft, Pencil, Tag, Venus } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import classnames from 'classnames';
import DogIcon from '../assets/dog.svg?react';
import { DogDetails } from '../components/dog/DogDetails';
import { DogGalleryContainer } from '../components/dog/DogGalleryContainer';
import {
  fetchDogPrimaryImage,
  fetchDogs,
  uploadDogPrimaryImage,
} from '../services/dogs';
import { GENDER } from '../types/dog';
import { queryClient } from '../services/react-query';
import { getAge } from '../utils/time';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { Loader } from '../components/Loader';
import { EnlargeImageModal } from '../components/EnlargeImageModal';
import { Button } from '../components/Button';
import { DogPreferences } from '../components/dog/DogPreferences';
import { Header } from '../components/Header';
import { HeaderImage } from '../components/HeaderImage';
import { EditDogModal } from '../components/dog/EditDogModal';
import { CameraModal } from '../components/camera/CameraModal';
import styles from './UserDog.module.scss';
import { capitalizeText } from '../utils/text';

const UserDog = () => {
  const { dogId } = useParams();
  const { state } = useLocation();
  const [isEditDogsModalOpen, setIsEditDogsModalOpen] = useState(false);
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [imageToEnlarge, setImageToEnlarge] = useState<string>('');
  const [isEnlargedImageModalOpen, setIsEnlargeImageModalOpen] =
    useState(false);
  const { isSignedInUser, userName } = state;

  const { data: dog, isLoading: isLoadingDog } = useQuery({
    queryKey: ['dogs', dogId],
    queryFn: async () => {
      const dogs = await fetchDogs([dogId!]);
      return dogs?.[0];
    },
  });

  const { data: primaryImage } = useQuery({
    queryKey: ['dogImage', dogId],
    queryFn: async () => fetchDogPrimaryImage(dogId!),
  });

  const { showLoader } = useDelayedLoading({
    isLoading: isLoadingDog,
    minDuration: 750,
  });

  const { mutate: setDogImage } = useMutation({
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
    return <Loader style={{ height: '100dvh' }} />;
  }

  if (!dog) {
    return null;
  }

  const age = !dog.birthday ? null : getAge(dog.birthday);

  return (
    <>
      <div className={styles.container}>
        <Header
          prevLinksCmp={
            <Link to={`/profile/${dog.owner}/dogs`}>
              <MoveLeft size={16} />
              {isSignedInUser ? (
                <span>My</span>
              ) : (
                <span className={styles.userName}>{userName}'s</span>
              )}
              <span> pack</span>
            </Link>
          }
          imgCmp={
            <HeaderImage
              imgSrc={primaryImage}
              onClickImg={onClickImage}
              NoImgIcon={DogIcon}
              onClickEditPhoto={
                isSignedInUser ? () => setIsAddImageModalOpen(true) : null
              }
            />
          }
          imgsClassName={styles.imgContainer}
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
                      {capitalizeText(userName)}'s dog
                    </span>
                  )}
                </div>
                <div>
                  {age !== null && (
                    <span className={styles.age}>
                      <Cake color={styles.green} size={14} />
                      <span>
                        {age.diff <= 0
                          ? 'Just born'
                          : `${age.diff} ${age.unit} old`}
                      </span>
                    </span>
                  )}
                  {dog.breed && (
                    <span className={styles.breed}>
                      <Tag color={styles.green} size={14} />
                      <span>
                        {dog.breed.toLowerCase() === 'other' && 'Breed: '}
                        {dog.breed}
                        {dog.breed.toLowerCase() === 'mixed' && ' breed'}
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
