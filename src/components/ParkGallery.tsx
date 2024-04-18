import { FormEvent, useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Camera } from './Camera';
import { fetchAllParkImages, uploadParkImage } from '../services/parks';

interface ParkGalleryProps {
  parkId: string;
}

const ParkGallery: React.FC<ParkGalleryProps> = ({ parkId }) => {
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchImages = async () => {
      const images = await fetchAllParkImages(parkId);
      setImages(images);
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

  return (
    <div>
      <div>
        {images.map((img) => (
          <img src={img} key={img}></img>
        ))}
      </div>
      <button onClick={() => setIsAddImageModalOpen(true)}>
        Add image to gallery
      </button>
      <Modal open={isAddImageModalOpen} onClose={onCloseModal}>
        {isCameraOpen ? (
          <Camera onSaveImg={onUploadImg} />
        ) : (
          <div>
            <input type="file" onChange={onUploadFile} value="" />
            <button onClick={() => setIsCameraOpen(true)}>Take a photo</button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export { ParkGallery };
