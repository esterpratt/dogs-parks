import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import DogIcon from '../assets/dog.svg?react';
import styles from './Image.module.scss';
import { Loader } from './Loader';
interface ImageProps {
  src: string;
  alt?: string;
  className?: string;
  loadingStrategy?: 'lazy' | 'eager';
  onClick?: () => void;
  isLoading?: boolean;
}

const Image = (props: ImageProps) => {
  const { src, alt, className, loadingStrategy, onClick, isLoading, ...rest } =
    props;
  const [newImageLoaded, setNewImageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoader, setShowLoader] = useState(false);
  const prevSrc = useRef(src);

  useEffect(() => {
    if (isLoading) {
      setShowLoader(true);
    }
  }, [isLoading]);

  useLayoutEffect(() => {
    if (src !== prevSrc.current) {
      setNewImageLoaded(false);
      setShowLoader(false);
      prevSrc.current = src;
    }
  }, [src, prevSrc]);

  return (
    <>
      {showLoader && (
        <div className={classnames(styles.noImgContainer, className)}>
          <Loader inside />
        </div>
      )}
      {!!error && !showLoader && (
        <div className={classnames(styles.noImgContainer, className)}>
          <DogIcon width={64} height={64} />
        </div>
      )}
      {!error && !showLoader && (
        <img
          src={src}
          alt={alt || ''}
          decoding="async"
          className={classnames(
            styles.img,
            { [styles.loaded]: newImageLoaded },
            className
          )}
          onLoad={() => setNewImageLoaded(true)}
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
