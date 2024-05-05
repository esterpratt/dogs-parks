import { useState } from 'react';
import classnames from 'classnames';
import styles from './DogsImages.module.scss';

interface DogsImagesProps {
  images: string[];
  className?: string;
}

const DogsImages: React.FC<DogsImagesProps> = ({ images, className }) => {
  const [primaryImg, setPrimaryImg] = useState(images[0]);

  return (
    <div className={classnames(styles.container, className)}>
      {images.map((img) => (
        <div
          key={img}
          className={classnames(
            styles.imgContainer,
            img === primaryImg && styles.primary
          )}
          onClick={() => setPrimaryImg(img)}
        >
          <img src={img} className={styles.img} />
          <div className={styles.transparent} />
        </div>
      ))}
    </div>
  );
};

export { DogsImages };
