import { useInView } from 'react-intersection-observer';
import { useQuery } from '@tanstack/react-query';
import classnames from 'classnames';
import { TreeDeciduous } from 'lucide-react';
import { fetchParkPrimaryImage } from '../../services/parks';
import { Image } from '../Image';
import styles from './ParkImageLazy.module.scss';

interface ParkImageLazyProps {
  parkId: string;
  alt?: string;
  lazy?: boolean;
  onClick?: (image: string) => void;
  className?: string;
  noImgClassName?: string;
  iconSize?: number;
  hideNoImgIcon?: boolean;
}

const ParkImageLazy = ({
  parkId,
  alt = '',
  lazy,
  onClick,
  className,
  noImgClassName,
  iconSize,
  hideNoImgIcon,
}: ParkImageLazyProps) => {
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '100px' });

  const { data: primaryImage } = useQuery({
    queryKey: ['parkImage', parkId],
    queryFn: async () => fetchParkPrimaryImage(parkId!),
    enabled: inView || !lazy,
  });

  return (
    <div ref={ref} className={classnames(styles.container, className)}>
      {primaryImage && (
        <Image
          src={primaryImage}
          alt={alt}
          loadingStrategy={lazy ? 'lazy' : 'eager'}
          onClick={() => onClick?.(primaryImage)}
          className={styles.img}
        />
      )}
      {!primaryImage && (
        <div className={classnames(styles.noImg, noImgClassName)}>
          {!hideNoImgIcon && (
            <TreeDeciduous
              size={iconSize || 24}
              color={styles.green}
              strokeWidth={1}
            />
          )}
        </div>
      )}
    </div>
  );
};

export { ParkImageLazy };
