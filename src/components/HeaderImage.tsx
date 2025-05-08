import { CSSProperties } from 'react';
import { Camera, LucideIcon } from 'lucide-react';
import classnames from 'classnames';
import { Loader } from './Loader';
import { Button } from './Button';
import styles from './HeaderImage.module.scss';

interface HeaderImageProps {
  imgSrc?: string | null;
  showLoader?: boolean;
  onClickImg?: (imgSrc: string) => void;
  NoImgIcon: LucideIcon;
  onClickEditPhoto?: null | (() => void);
  className?: string;
  editButtonClassName?: string;
  style?: CSSProperties;
  size?: number;
  isLoading?: boolean;
}

const HeaderImage = (props: HeaderImageProps) => {
  const {
    size = 152,
    imgSrc,
    showLoader = false,
    onClickImg,
    NoImgIcon,
    onClickEditPhoto,
    className,
    style,
    editButtonClassName,
    isLoading,
  } = props;

  return (
    <div
      className={classnames(styles.imgContainer, className)}
      style={{ '--img-size': `${size}px`, ...style }}
    >
      {showLoader ? (
        <div className={styles.img}>
          <div className={styles.noImg}>
            <Loader inside />
          </div>
        </div>
      ) : imgSrc ? (
        <img
          onClick={onClickImg && (() => onClickImg(imgSrc))}
          src={imgSrc}
          className={styles.img}
        />
      ) : !isLoading ? (
        <div className={styles.img}>
          <div className={styles.noImg}>
            <NoImgIcon size={64} color={styles.green} strokeWidth={1} />
          </div>
        </div>
      ) : null}
      {!isLoading && !!onClickEditPhoto && (
        <Button
          variant="round"
          className={classnames(styles.editPhotoIcon, editButtonClassName)}
          onClick={onClickEditPhoto}
        >
          <Camera size={18} />
        </Button>
      )}
    </div>
  );
};

export { HeaderImage };
