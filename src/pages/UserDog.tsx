import { useState, lazy, Suspense } from 'react';
import { useLocation, useParams, useRevalidator } from 'react-router';
import { Link } from 'react-router-dom';
import { IoMdFemale, IoMdMale } from 'react-icons/io';
import { MdOutlineModeEditOutline } from 'react-icons/md';
import { PiCameraFill, PiDog } from 'react-icons/pi';
import classnames from 'classnames';
import { DogDetails } from '../components/profile/DogDetails';
import { DogGalleryContainer } from '../components/profile/DogGalleryContainer';
import {
  fetchDogPrimaryImage,
  fetchDogs,
  uploadDogPrimaryImage,
} from '../services/dogs';
import { IconContext } from 'react-icons';
import { GENDER } from '../types/dog';
import styles from './UserDog.module.scss';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '../services/react-query';
import { AccordionContainer } from '../components/accordion/AccordionContainer';
import { getAge } from '../utils/time';
import { LOADING } from '../components/profile/DogPreview';

const CameraModal = lazy(() => import('../components/camera/CameraModal'));
const EditDogsModal = lazy(() => import('../components/profile/EditDogsModal'));

const UserDog = () => {
  const { dogId } = useParams();
  const { state } = useLocation();
  const [isEditDogsModalOpen, setIsEditDogsModalOpen] = useState(false);
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const { revalidate } = useRevalidator();
  const { isSignedInUser, userName } = state;

  const { data: dog, isLoading: isLoadingDog } = useQuery({
    queryKey: ['dogs', dogId],
    queryFn: async () => {
      const dogs = await fetchDogs([dogId!]);
      return dogs?.[0];
    },
  });

  console.log('loading dog? ', isLoadingDog);

  const { data: primaryImage } = useQuery({
    queryKey: ['dogImage', dogId],
    queryFn: async () => {
      const images = await fetchDogPrimaryImage(dogId!);
      return images?.length ? images[0] : null;
    },
  });

  const { mutate: setDogImage, isPending: isUploadingImage } = useMutation({
    mutationFn: (img: string | File) => uploadDogPrimaryImage(img, dogId!),
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

  if (!dog || isLoadingDog) {
    return null;
  }

  const age = !dog.birthday ? null : getAge(dog.birthday);

  return (
    <>
      <div className={styles.container}>
        <Link to=".." relative="path" className={styles.prevLink}>
          <span>Back to </span>
          {isSignedInUser ? (
            <span>my</span>
          ) : (
            <span className={styles.userName}>{userName}'s</span>
          )}
          <span> pack</span>
        </Link>
        <div className={styles.importantDetails}>
          <div className={styles.imgContainer}>
            {isUploadingImage || primaryImage === LOADING ? (
              <div className={classnames(styles.img, styles.empty)}>
                <span>Loading...</span>
              </div>
            ) : primaryImage ? (
              <img src={primaryImage} className={styles.img} />
            ) : (
              <div className={classnames(styles.img, styles.empty)}>
                <PiDog size={64} />
              </div>
            )}
            {isSignedInUser && (
              <IconContext.Provider value={{ className: styles.editPhotoIcon }}>
                <PiCameraFill onClick={() => setIsAddImageModalOpen(true)} />
              </IconContext.Provider>
            )}
          </div>
          <div className={styles.details}>
            <div>
              <span className={styles.name}>{dog.name}</span>
              {dog.gender && (
                <IconContext.Provider value={{ className: styles.genderIcon }}>
                  {dog.gender === GENDER.FEMALE ? <IoMdFemale /> : <IoMdMale />}
                </IconContext.Provider>
              )}
            </div>
            {age !== null && (
              <div className={styles.age}>
                {age.diff === 0 ? 'Just Born' : `${age.diff} ${age.unit} old`}
              </div>
            )}
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
      <Suspense fallback={null}>
        <EditDogsModal
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
