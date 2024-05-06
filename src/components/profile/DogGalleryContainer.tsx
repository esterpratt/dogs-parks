import { MouseEvent, useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { Dog } from '../../types/dog';
import { uploadDogImage } from '../../services/dogs';
import { CameraModal } from '../CameraModal';
import { Accordion } from '../Accordion/Accordion';
import { AccordionTitle } from '../Accordion/AccordionTitle';
import { AccordionArrow } from '../Accordion/AccordionArrow';
import { AccordionContent } from '../Accordion/AccordionContent';
import { DogGallery } from './DogGallery';
import styles from './DogGalleryContainer.module.scss';

interface DogGalleryContainerProps {
  galleryImages: { [id: string]: string[] };
  dogs: Dog[];
  currentDogId: string;
  setCurrentDogId: (id: string) => void;
  accordionTitleClassName?: string;
  accordionContentClassName?: string;
  accordionContentContainerClassName?: string;
}

const DogGalleryContainer: React.FC<DogGalleryContainerProps> = ({
  dogs,
  currentDogId,
  setCurrentDogId,
  galleryImages,
  accordionTitleClassName,
  accordionContentClassName,
  accordionContentContainerClassName,
}) => {
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [images, setImages] = useState(galleryImages);

  const onUploadImg = async (img: string | File) => {
    setIsAddImageModalOpen(false);
    const uploadedImg = await uploadDogImage(img, currentDogId);
    if (uploadedImg) {
      setImages((prevImages) => {
        const prevDogImages = prevImages[currentDogId];
        return {
          ...prevImages,
          [currentDogId]: [...prevDogImages, uploadedImg],
        };
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
              <div className={styles.addPhotoButton} onClick={onClickAddPhoto}>
                <FaPlus size={14} />
              </div>
            </>
          )}
        </AccordionTitle>
        <AccordionContent className={accordionContentContainerClassName}>
          <DogGallery
            className={accordionContentClassName}
            images={images}
            dogs={dogs}
            currentDogId={currentDogId}
            setCurrentDogId={setCurrentDogId}
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
