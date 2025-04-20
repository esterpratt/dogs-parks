import { useState, lazy, Suspense } from 'react';
import { useLocation, useParams, useRevalidator } from 'react-router';
import { Link } from 'react-router';
import {
  Cake,
  Camera,
  DogIcon,
  Mars,
  MoveLeft,
  Tag,
  Venus,
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MdOutlineModeEditOutline } from 'react-icons/md';
// import classnames from 'classnames';
import { DogDetails } from '../components/dog/DogDetails';
import { DogGalleryContainer } from '../components/dog/DogGalleryContainer';
import {
  fetchDogPrimaryImage,
  fetchDogs,
  uploadDogPrimaryImage,
} from '../services/dogs';
import { GENDER } from '../types/dog';
import { queryClient } from '../services/react-query';
import { AccordionContainer } from '../components/accordion/AccordionContainer';
import { getAge } from '../utils/time';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { Loader } from '../components/Loader';
import { LOADING } from '../utils/consts';
import { EnlargeImageModal } from '../components/EnlargeImageModal';
import { Button } from '../components/Button';
import styles from './UserDog.module.scss';

const CameraModal = lazy(() => import('../components/camera/CameraModal'));
const EditDogModal = lazy(() => import('../components/dog/EditDogModal'));

const UserDog = () => {
  const { dogId } = useParams();
  const { state } = useLocation();
  const [isEditDogsModalOpen, setIsEditDogsModalOpen] = useState(false);
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [imageToEnlarge, setImageToEnlarge] = useState<string>('');
  const [isEnlargedImageModalOpen, setIsEnlargeImageModalOpen] =
    useState(false);
  const { revalidate } = useRevalidator();
  const { isSignedInUser, userName } = state;

  const { data: dog, isLoading: isLoadingDog } = useQuery({
    queryKey: ['dogs', dogId],
    queryFn: async () => {
      const dogs = await fetchDogs([dogId!]);
      return dogs?.[0];
    },
  });

  const { data: primaryImage, isLoading: isLoadingImage } = useQuery({
    queryKey: ['dogImage', dogId],
    queryFn: async () => {
      const image = await fetchDogPrimaryImage(dogId!);
      return image || null;
    },
  });

  const { showLoader } = useDelayedLoading({
    isLoading: isLoadingDog || isLoadingImage,
    minDuration: 750,
  });

  const { mutate: setDogImage, isPending: isUploadingImage } = useMutation({
    mutationFn: (img: string | File) =>
      uploadDogPrimaryImage({
        image: img,
        dogId: dogId!,
        upsert: !!primaryImage,
      }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['dogImage', dogId] });
      const prevImage = queryClient.getQueryData(['dogImage', dogId]);
      queryClient.setQueryData(['dogImage', dogId], LOADING);

      return { prevImage };
    },
    onError: (_error, _data, context) => {
      queryClient.setQueryData(['dogImage', dogId], context?.prevImage);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dogImage', dogId] });
      revalidate();
    },
  });

  const onCloseDogsModal = () => {
    setIsEditDogsModalOpen(false);
  };

  const onEditDog = () => {
    setIsEditDogsModalOpen(true);
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
    return <Loader />;
  }

  if (!dog) {
    return null;
  }

  const age = !dog.birthday ? null : getAge(dog.birthday);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link to={`/profile/${dog.owner}/dogs`} className={styles.prevLink}>
            <MoveLeft size={16} />
            {isSignedInUser ? (
              <span>My</span>
            ) : (
              <span className={styles.userName}>{userName}'s</span>
            )}
            <span> pack</span>
          </Link>
          <div className={styles.imgContainer}>
            {isUploadingImage || primaryImage === LOADING ? (
              <div className={styles.img}>
                <div className={styles.noImg}>
                  <Loader inside />
                </div>
              </div>
            ) : primaryImage ? (
              <img
                onClick={() => onClickImage(primaryImage)}
                src={primaryImage}
                className={styles.img}
              />
            ) : (
              <div className={styles.img}>
                <div className={styles.noImg}>
                  <DogIcon size={64} color={styles.green} strokeWidth={1} />
                </div>
              </div>
            )}
            {isSignedInUser && (
              <Button
                variant="round"
                className={styles.editPhotoIcon}
                onClick={() => setIsAddImageModalOpen(true)}
              >
                <Camera size={18} />
              </Button>
            )}
          </div>
          <div className={styles.details}>
            <div className={styles.top}>
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
                <span className={styles.userName}>{userName}'s dog</span>
              )}
            </div>
            <div className={styles.bottom}>
              {age !== null && (
                <span className={styles.age}>
                  <Cake color={styles.green} size={14} />
                  <span>
                    {age.diff === 0
                      ? 'Just Born'
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
                    {dog.breed.toLowerCase() === 'mixed' && ' Breed'}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
        <AccordionContainer className={styles.accordion}>
          <AccordionContainer.TitleWithIcon
            title="Dog Details"
            showIcon={isSignedInUser}
            Icon={MdOutlineModeEditOutline}
            onClickIcon={onEditDog}
            iconSize={18}
          />
          <AccordionContainer.Content className={styles.contentContainer}>
            <DogDetails
              isSignedInUser={isSignedInUser}
              className={styles.content}
              dog={dog}
              userName={userName}
              onEditDog={onEditDog}
            />
          </AccordionContainer.Content>
        </AccordionContainer>
        <DogGalleryContainer
          dog={dog}
          isSignedInUser={isSignedInUser}
          className={styles.accordion}
          contentClassName={styles.contentContainer}
        />
      </div>
      <EnlargeImageModal
        isOpen={isEnlargedImageModalOpen}
        onClose={() => setIsEnlargeImageModalOpen(false)}
        imgSrc={imageToEnlarge}
        setImgSrc={setImageToEnlarge}
      />
      <Suspense fallback={null}>
        <EditDogModal
          dog={dog}
          isOpen={isEditDogsModalOpen}
          onClose={onCloseDogsModal}
        />
      </Suspense>
      <Suspense fallback={null}>
        <CameraModal
          open={isAddImageModalOpen}
          setOpen={setIsAddImageModalOpen}
          onUploadImg={onUploadImg}
        />
      </Suspense>
    </>
  );
};

export default UserDog;
