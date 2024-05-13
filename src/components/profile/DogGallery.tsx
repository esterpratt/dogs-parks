import { Dog } from '../../types/dog';
import { Carousel } from '../Carousel';
import styles from './DogGallery.module.scss';

interface DogGalleryProps {
  images: string[];
  dog: Dog;
  openCameraModal: () => void;
  isSignedInUser: boolean;
}

const DogGallery: React.FC<DogGalleryProps> = ({
  isSignedInUser,
  images,
  openCameraModal,
}) => {
  return (
    <div className={styles.container}>
      {(isSignedInUser || !!images.length) && (
        <Carousel
          images={images}
          addImage={isSignedInUser ? openCameraModal : null}
        />
      )}
    </div>
  );
};

export { DogGallery };
