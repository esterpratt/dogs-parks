import { useState } from 'react';
import { useLocation, useParams, useRevalidator } from 'react-router';
import { Link } from 'react-router-dom';
import { IoMdFemale, IoMdMale } from 'react-icons/io';
import { MdOutlineModeEditOutline } from 'react-icons/md';
import { PiCameraFill, PiDog } from 'react-icons/pi';
import { FaArrowLeftLong } from 'react-icons/fa6';
import classnames from 'classnames';
import { Accordion } from '../components/accordion/Accordion';
import { DogDetails } from '../components/profile/DogDetails';
import { DogGalleryContainer } from '../components/profile/DogGalleryContainer';
import { EditDogsModal } from '../components/profile/EditDogsModal';
import {
  fetchDogPrimaryImage,
  fetchDogs,
  uploadDogPrimaryImage,
} from '../services/dogs';
import { IconContext } from 'react-icons';
import { GENDER } from '../types/dog';
import styles from './UserDog.module.scss';
import { CameraModal } from '../components/camera/CameraModal';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '../services/react-query';
import { Loading } from '../components/Loading';

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

  const { data: primaryImage, isLoading: isLoadingImage } = useQuery({
    queryKey: ['dogImage', dogId],
    queryFn: async () => {
      const images = await fetchDogPrimaryImage(dogId!);
      return images?.length ? images[0] : null;
    },
  });

  const { mutate: setDogImage } = useMutation({
    mutationFn: (img: string | File) => uploadDogPrimaryImage(img, dogId!),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['dogImage', dogId],
      });
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

  if (isLoadingDog || isLoadingImage) {
    return <Loading />;
  }

  if (!dog) {
    return null;
  }

  return (
    <>
      <div className={styles.container}>
        <Link to=".." relative="path" className={styles.prevLink}>
          <FaArrowLeftLong />
          <span>{isSignedInUser ? 'My' : `${userName}'s`} Dogs</span>
        </Link>
        <div className={styles.importantDetails}>
          <div className={styles.imgContainer}>
            {primaryImage ? (
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
            {dog.age && (
              <div className={styles.age}>
                {dog.age} Year{dog.age > 1 && 's'} old
              </div>
            )}
          </div>
        </div>
        <Accordion className={styles.accordion}>
          <Accordion.TitleWithIcon
            title="Dog Details"
            showIcon={isSignedInUser}
            Icon={MdOutlineModeEditOutline}
            onClickIcon={onEditDog}
            iconSize={18}
          />
          <Accordion.Content className={styles.contentContainer}>
            <DogDetails
              isSignedInUser={isSignedInUser}
              className={styles.content}
              dog={dog}
              userName={userName}
              onEditDog={onEditDog}
            />
          </Accordion.Content>
        </Accordion>
        <DogGalleryContainer
          dog={dog}
          isSignedInUser={isSignedInUser}
          className={styles.accordion}
          contentClassName={styles.contentContainer}
        />
      </div>
      <EditDogsModal
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
