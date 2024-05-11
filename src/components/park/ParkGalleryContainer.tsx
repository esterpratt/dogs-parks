import { MouseEvent, useEffect, useState } from 'react';
import { fetchAllParkImages, uploadParkImage } from '../../services/parks';
import { CameraModal } from '../CameraModal';
import { Accordion } from '../Accordion/Accordion';
import { AccordionTitle } from '../Accordion/AccordionTitle';
import { AccordionArrow } from '../Accordion/AccordionArrow';
import { FaPlus } from 'react-icons/fa';
import { AccordionContent } from '../Accordion/AccordionContent';
import { ParkGallery } from './ParkGallery';
import styles from './ParkGalleryContainer.module.scss';
import { IconContext } from 'react-icons';

interface ParkGalleryContainerProps {
  parkId: string;
}

const ParkGalleryContainer: React.FC<ParkGalleryContainerProps> = ({
  parkId,
}) => {
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      const images = await fetchAllParkImages(parkId);
      if (images) {
        setImages(images);
      }
      setLoading(false);
    };

    fetchImages();
  }, [parkId]);

  const onUploadImg = async (img: string | File) => {
    setIsAddImageModalOpen(false);
    const uploadedImg = await uploadParkImage(img, parkId);
    if (uploadedImg) {
      setImages((prevImages) => [...prevImages, uploadedImg]);
    }
  };

  const onClickAddPhoto = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    setIsAddImageModalOpen(true);
  };

  if (loading) {
    return null;
  }

  return (
    <>
      <Accordion>
        <AccordionTitle className={styles.title}>
          {(isOpen) => (
            <>
              <div className={styles.left}>
                <span>Gallery</span>
                <AccordionArrow isOpen={isOpen} />
              </div>
              <div className={styles.addPhotoButton} onClick={onClickAddPhoto}>
                <IconContext.Provider value={{ className: styles.plus }}>
                  <FaPlus size={14} />
                </IconContext.Provider>
              </div>
            </>
          )}
        </AccordionTitle>
        <AccordionContent>
          <ParkGallery
            images={images}
            openCameraModal={() => setIsAddImageModalOpen(true)}
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

export { ParkGalleryContainer };
