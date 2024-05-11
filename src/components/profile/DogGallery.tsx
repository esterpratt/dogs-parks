import classnames from 'classnames';
import { Dog } from '../../types/dog';
import { Carousel } from '../Carousel';
import styles from './DogGallery.module.scss';

interface DogGalleryProps {
  images: string[];
  dog: Dog;
  className?: string;
  openCameraModal: () => void;
  isSignedInUser: boolean;
}

const DogGallery: React.FC<DogGalleryProps> = ({
  isSignedInUser,
  images,
  className,
  openCameraModal,
}) => {
  return (
    <div className={classnames(styles.container, className)}>
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
