import classnames from 'classnames';
import styles from './DogsImages.module.scss';

interface DogsImagesProps {
  images: { id: string; src: string }[];
  currentDogId: string;
  setCurrentDogId: (id: string) => void;
  className?: string;
}

const DogsImages: React.FC<DogsImagesProps> = ({
  images,
  currentDogId,
  setCurrentDogId,
  className,
}) => {
  return (
    <div className={classnames(styles.container, className)}>
      {images.map((img) => (
        <div
          key={img.id}
          className={classnames(
            styles.imgContainer,
            img.id === currentDogId && styles.primary
          )}
          onClick={() => setCurrentDogId(img.id)}
        >
          <img src={img.src} className={styles.img} />
          <div className={styles.transparent} />
        </div>
      ))}
    </div>
  );
};

export { DogsImages };
