import { useEffect, useState } from 'react';
import { fetchAllParkImages, uploadParkImage } from '../../services/parks';
import { CameraModal } from '../camera/CameraModal';
import { Accordion } from '../accordion/Accordion';
import { FaPlus } from 'react-icons/fa';
import { ParkGallery } from './ParkGallery';

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

  const onClickAddPhoto = () => {
    setIsAddImageModalOpen(true);
  };

  if (loading) {
    return null;
  }

  return (
    <>
      <Accordion>
        <Accordion.TitleWithIcon
          title="Gallery"
          showIcon
          Icon={FaPlus}
          onClickIcon={onClickAddPhoto}
          iconSize={14}
        />
        <Accordion.Content>
          <ParkGallery
            images={images}
            openCameraModal={() => setIsAddImageModalOpen(true)}
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

export { ParkGalleryContainer };
