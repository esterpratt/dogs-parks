import { useEffect, useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { Dog } from '../../types/dog';
import { fetchAllDogsImages, uploadDogImage } from '../../services/dogs';
import { CameraModal } from '../CameraModal';
import { Accordion } from '../Accordion/Accordion';
import { DogGallery } from './DogGallery';

interface DogGalleryContainerProps {
  dog: Dog;
  isSignedInUser: boolean;
  className?: string;
  contentClassName?: string;
}

const DogGalleryContainer: React.FC<DogGalleryContainerProps> = ({
  dog,
  isSignedInUser,
  className,
  contentClassName,
}) => {
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const getImages = async () => {
      const images = await fetchAllDogsImages(dog.id);
      if (images) {
        setImages(images);
      } else {
        setImages([]);
      }
    };
    getImages();
  }, [dog.id]);

  const onUploadImg = async (img: string | File) => {
    setIsAddImageModalOpen(false);
    const uploadedImg = await uploadDogImage(img, dog.id);
    if (uploadedImg) {
      setImages((prevImages) => {
        return [...prevImages, uploadedImg];
      });
    }
  };

  const openCameraModal = () => {
    setIsAddImageModalOpen(true);
  };

  const onClickAddPhoto = () => {
    openCameraModal();
  };

  if (!isSignedInUser && !images.length) {
    return null;
  }

  return (
    <>
      <Accordion className={className}>
        <Accordion.TitleWithIcon
          title="Gallery"
          showIcon={isSignedInUser}
          Icon={FaPlus}
          onClickIcon={onClickAddPhoto}
        />
        <Accordion.Content className={contentClassName}>
          <DogGallery
            images={images}
            dog={dog}
            isSignedInUser={isSignedInUser}
            openCameraModal={openCameraModal}
          />
        </Accordion.Content>
      </Accordion>
      <CameraModal
        open={isAddImageModalOpen}
        setOpen={setIsAddImageModalOpen}
        onUploadImg={onUploadImg}
      />
    </>
  );
};

export { DogGalleryContainer };
