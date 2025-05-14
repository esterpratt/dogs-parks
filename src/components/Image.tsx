import { useLayoutEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import styles from './Image.module.scss';
import { LOADING } from '../utils/consts';
import { Bone } from 'lucide-react';

interface ImageProps {
  src: string;
  alt?: string;
  className?: string;
  loadingStrategy?: 'lazy' | 'eager';
  onClick?: () => void;
}

const Image = (props: ImageProps) => {
  const { src, alt, className, loadingStrategy, onClick, ...rest } = props;
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevSrc = useRef(src);

  const isLoading = src === LOADING;

  useLayoutEffect(() => {
    if (src !== prevSrc.current) {
      setLoaded(false);
      prevSrc.current = src;
    }
  }, [src, prevSrc]);

  const handleImageLoad = () => {
    if (!isLoading) {
      setLoaded(true);
    }
  };

  return (
    <>
      {!!error && (
        <div className={classnames(styles.noImgContainer, className)}>
          <Bone size={48} color={styles.green} strokeWidth={1} />
        </div>
      )}
      {!error && (
        <img
          src={
            isLoading
              ? 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
              : src
          }
          alt={alt || ''}
          decoding="async"
          className={classnames(
            styles.img,
            { [styles.loaded]: loaded && !isLoading },
            { [styles.loading]: isLoading },
            className
          )}
          onLoad={handleImageLoad}
          onError={() => setError('There was an error loading the image')}
          loading={loadingStrategy}
          onClick={onClick && (() => onClick())}
          {...rest}
        />
      )}
    </>
  );
};

export { Image };
