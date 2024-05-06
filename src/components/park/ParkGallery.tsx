import { Carousel } from '../Carousel';

interface ParkGalleryProps {
  images: string[];
  openCameraModal: () => void;
}

const ParkGallery: React.FC<ParkGalleryProps> = ({
  images,
  openCameraModal,
}) => {
  return <Carousel images={images} addImage={openCameraModal} />;
};

export { ParkGallery };
