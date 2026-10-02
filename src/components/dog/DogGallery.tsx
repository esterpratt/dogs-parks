import { DogImage } from '../../types/dog-image';
import { MAX_DOG_IMAGES } from '../../utils/consts';
import { Carousel } from '../Carousel';
import styles from './DogGallery.module.scss';

interface DogGalleryProps {
  images: DogImage[];
  openCameraModal: () => void;
  isSignedInUser: boolean;
  removeImage?: ((imageId: string) => void) | null;
  setPrimaryImage?: ((imageId: string) => void) | null;
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
  const imageIdByUrl = new Map(images.map(({ id, url }) => [url, id]));
  const deletableUrls = new Set(
    images.filter(({ canDelete }) => canDelete).map(({ url }) => url)
  );

  const removeImageByUrl = (imageUrl: string) => {
    const imageId = imageIdByUrl.get(imageUrl);
    if (imageId && removeImage) {
      removeImage(imageId);
    }
  };

  const setPrimaryImageByUrl = (imageUrl: string) => {
    const imageId = imageIdByUrl.get(imageUrl);
    if (imageId && setPrimaryImage) {
      setPrimaryImage(imageId);
    }
  };

  return (
    <div className={styles.container}>
      {(isSignedInUser || !!images.length) && (
        <Carousel
          isLoading={isLoading}
          images={images.map(({ url }) => url)}
          removeImage={isSignedInUser ? removeImageByUrl : null}
          canRemoveImage={(imageUrl) => deletableUrls.has(imageUrl)}
          setPrimaryImage={isSignedInUser ? setPrimaryImageByUrl : null}
          addImage={
            isSignedInUser && images.length < MAX_DOG_IMAGES
              ? openCameraModal
              : null
          }
        />
      )}
    </div>
  );
};

export { DogGallery };
