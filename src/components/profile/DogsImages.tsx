import classnames from 'classnames';
import { PiDog } from 'react-icons/pi';
import styles from './DogsImages.module.scss';

interface DogsImagesProps {
  images: { id: string; src: string }[];
  currentDogId: string;
  setCurrentDogId: (id: string) => void;
  className?: string;
  isSignedInUser: boolean;
}

// right now support of up to 3 dogs
const getImagesTranslationClasses = (imagesCount: number) => {
  if (imagesCount % 2 > 0) {
    return ['center', 'left', 'right'];
  } else {
    return ['endLeft', 'endRight'];
  }
};

const DogsImages: React.FC<DogsImagesProps> = ({
  images,
  currentDogId,
  setCurrentDogId,
  className,
  // isSignedInUser,
}) => {
  // TODO: images should be editable if isSignedInUser is true

  const imagesTranslationClasses = getImagesTranslationClasses(images.length);

  return (
    <div className={classnames(styles.container, className)}>
      {images.map((img, index) => (
        <div
          key={img.id}
          className={classnames(
            styles.imgContainer,
            styles[imagesTranslationClasses[index]],
            img.id === currentDogId && styles.primary
          )}
          onClick={() => setCurrentDogId(img.id)}
        >
          {img.src ? (
            <img src={img.src} className={styles.img} />
          ) : (
            <div className={classnames(styles.img, styles.empty)}>
              <PiDog size={64} />
            </div>
          )}
          <div className={styles.transparent} />
        </div>
      ))}
    </div>
  );
};

export { DogsImages };
