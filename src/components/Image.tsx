import { useLayoutEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import styles from './Image.module.scss';
import { LOADING } from '../utils/consts';

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
      loading={loadingStrategy}
      onClick={onClick && (() => onClick())}
      {...rest}
    />
  );
};

export { Image };
