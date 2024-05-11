import { MouseEvent, useEffect, useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { Dog } from '../../types/dog';
import { fetchAllDogsImages, uploadDogImage } from '../../services/dogs';
import { CameraModal } from '../CameraModal';
import { Accordion } from '../Accordion/Accordion';
import { AccordionTitle } from '../Accordion/AccordionTitle';
import { AccordionArrow } from '../Accordion/AccordionArrow';
import { AccordionContent } from '../Accordion/AccordionContent';
import { DogGallery } from './DogGallery';
import styles from './DogGalleryContainer.module.scss';
import { IconContext } from 'react-icons';

interface DogGalleryContainerProps {
  dog: Dog;
  isSignedInUser: boolean;
  accordionTitleClassName?: string;
  accordionContentClassName?: string;
  accordionContentContainerClassName?: string;
}

const DogGalleryContainer: React.FC<DogGalleryContainerProps> = ({
  dog,
  isSignedInUser,
  accordionTitleClassName,
  accordionContentClassName,
  accordionContentContainerClassName,
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

  const onClickAddPhoto = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    openCameraModal();
  };

  return (
    <>
      <Accordion>
        <AccordionTitle className={accordionTitleClassName}>
          {(isOpen) => (
            <>
              <div className={styles.left}>
                <span>Gallery</span>
                <AccordionArrow isOpen={isOpen} />
              </div>
              {isSignedInUser && (
                <div
                  className={styles.addPhotoButton}
                  onClick={onClickAddPhoto}
                >
                  <IconContext.Provider value={{ className: styles.plus }}>
                    <FaPlus size={14} />
                  </IconContext.Provider>
                </div>
              )}
            </>
          )}
        </AccordionTitle>
        <AccordionContent className={accordionContentContainerClassName}>
          <DogGallery
            className={accordionContentClassName}
            images={images}
            dog={dog}
            isSignedInUser={isSignedInUser}
            openCameraModal={openCameraModal}
          />
        </AccordionContent>
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
