import { useState } from 'react';
import { useLocation, useRevalidator } from 'react-router';
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
import { uploadDogPrimaryImage } from '../services/dogs';
import { IconContext } from 'react-icons';
import { GENDER } from '../types/dog';
import styles from './UserDog.module.scss';
import { CameraModal } from '../components/camera/CameraModal';

const UserDog = () => {
  const { state } = useLocation();
  const [isEditDogsModalOpen, setIsEditDogsModalOpen] = useState(false);
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const { dog, isSignedInUser, userName } = state;
  const { primaryImage, name, age, gender } = dog;
  const [image, setImage] = useState(primaryImage);
  const { revalidate } = useRevalidator();

  const onCloseDogsModal = () => {
    setIsEditDogsModalOpen(false);
  };

  const onEditDog = () => {
    setIsEditDogsModalOpen(true);
  };

  const onUploadImg = async (img: string | File) => {
    setIsAddImageModalOpen(false);
    const uploadedImg = await uploadDogPrimaryImage(img, dog.id);
    if (uploadedImg) {
      setImage(uploadedImg);
      revalidate();
    }
  };

  return (
    <>
      <div className={styles.container}>
        <Link to=".." relative="path" className={styles.prevLink}>
          <FaArrowLeftLong />
          <span>{isSignedInUser ? 'My' : `${userName}'s`} Dogs</span>
        </Link>
        <div className={styles.importantDetails}>
          <div className={styles.imgContainer}>
            {image ? (
              <img src={image} className={styles.img} />
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
              <span className={styles.name}>{name}</span>
              {gender && (
                <IconContext.Provider value={{ className: styles.genderIcon }}>
                  {gender === GENDER.FEMALE ? <IoMdFemale /> : <IoMdMale />}
                </IconContext.Provider>
              )}
            </div>
            {age && (
              <div className={styles.age}>
                {age} Year{age > 1 && 's'} old
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

export { UserDog };
