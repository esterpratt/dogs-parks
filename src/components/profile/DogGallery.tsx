import classnames from 'classnames';
import { Dog } from '../../types/dog';
import { Carousel } from '../Carousel';
import styles from './DogGallery.module.scss';
import { DogsTabs } from './DogsTabs';

interface DogGalleryProps {
  images: { [id: string]: string[] };
  dogs: Dog[];
  currentDogId: string;
  setCurrentDogId: (id: string) => void;
  className?: string;
  openCameraModal: () => void;
}

const DogGallery: React.FC<DogGalleryProps> = ({
  dogs,
  currentDogId,
  setCurrentDogId,
  images,
  className,
  openCameraModal,
}) => {
  const currentDogImages = images[currentDogId];

  return (
    <div className={classnames(styles.container, className)}>
      {dogs.length > 1 && (
        <DogsTabs
          dogs={dogs}
          currentDogId={currentDogId}
          setCurrentDogId={setCurrentDogId}
        />
      )}
      <Carousel images={currentDogImages} addImage={openCameraModal} />
    </div>
  );
};

export { DogGallery };
