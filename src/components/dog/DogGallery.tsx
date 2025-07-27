import { Dog } from '../../types/dog';
import { MAX_IMAGES } from '../../utils/consts';
import { Carousel } from '../Carousel';
import styles from './DogGallery.module.scss';

interface DogGalleryProps {
  images: string[];
  dog: Dog;
  openCameraModal: () => void;
  isSignedInUser: boolean;
  removeImage?: ((imgPath: string) => void) | null;
  setPrimaryImage?: ((imgPath: string) => void) | null;
  isLoading?: boolean;
}

const DogGallery: React.FC<DogGalleryProps> = ({
  isSignedInUser,
  images,
  openCameraModal,
  removeImage,
  setPrimaryImage,
  isLoading,
}) => {
  return (
    <div className={styles.container}>
      {(isSignedInUser || !!images.length) && (
        <Carousel
          isLoading={isLoading}
          images={images}
          removeImage={isSignedInUser ? removeImage : null}
          setPrimaryImage={isSignedInUser ? setPrimaryImage : null}
          addImage={
            isSignedInUser && images.length < MAX_IMAGES
              ? openCameraModal
              : null
          }
        />
      )}
    </div>
  );
};

export { DogGallery };
