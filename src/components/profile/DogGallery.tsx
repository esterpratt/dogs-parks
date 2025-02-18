import { Dog } from '../../types/dog';
import { Carousel } from '../Carousel';
import styles from './DogGallery.module.scss';

interface DogGalleryProps {
  images: string[];
  dog: Dog;
  openCameraModal: () => void;
  isSignedInUser: boolean;
  removeImage?: ((imgPath: string) => void) | null;
}

const DogGallery: React.FC<DogGalleryProps> = ({
  isSignedInUser,
  images,
  openCameraModal,
  removeImage,
}) => {
  return (
    <div className={styles.container}>
      {(isSignedInUser || !!images.length) && (
        <Carousel
          images={images}
          removeImage={isSignedInUser ? removeImage : null}
          addImage={
            isSignedInUser && images.length < 8 ? openCameraModal : null
          }
        />
      )}
    </div>
  );
};

export { DogGallery };
