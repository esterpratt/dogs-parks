import { FormEvent, useEffect, useState } from 'react';
import { Modal } from '../Modal';
import { Camera } from './Camera';
import { fetchAllParkImages, uploadParkImage } from '../../services/parks';
import { Carousel } from '../Carousel';
import { Button } from '../Button';
import styles from './ParkGallery.module.scss';
import { FileInput } from '../FileInput';

interface ParkGalleryProps {
  parkId: string;
}

const ParkGallery: React.FC<ParkGalleryProps> = ({ parkId }) => {
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState<string | DOMException | null>(null);
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
    setIsCameraOpen(false);
    setIsAddImageModalOpen(false);
    const uploadedImg = await uploadParkImage(img, parkId);
    if (uploadedImg) {
      setImages((prevImages) => [...prevImages, uploadedImg]);
    }
  };

  const onUploadFile = (event: FormEvent<HTMLInputElement>) => {
    if (event.currentTarget.files) {
      onUploadImg(event.currentTarget.files[0]);
    }
  };

  const onCloseModal = () => {
    setIsAddImageModalOpen(false);
  };

  const onCameraError = (error: string | DOMException) => {
    console.error(error);
    setError(error);
    setIsCameraOpen(false);
  };

  if (loading) {
    return null;
  }

  return (
    <div>
      {!!images.length && <Carousel images={images} />}
      <Button
        onClick={() => setIsAddImageModalOpen(true)}
        className={styles.addPhotoButton}
      >
        {!images.length && 'No photos yet. '}Add photo
      </Button>
      <Modal open={isAddImageModalOpen} onClose={onCloseModal}>
        {isCameraOpen ? (
          <Camera
            onSaveImg={onUploadImg}
            onError={onCameraError}
            onCancel={() => setIsCameraOpen(false)}
          />
        ) : (
          <div className={styles.buttonsContainer}>
            <FileInput onUploadFile={onUploadFile} />
            <span>or</span>
            <Button onClick={() => setIsCameraOpen(true)}>
              {error ? 'Sorry, cannot use your camera' : 'Take a photo'}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export { ParkGallery };
