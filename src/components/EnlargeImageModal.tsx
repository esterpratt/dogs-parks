import { Star, Trash2, X } from 'lucide-react';
import classnames from 'classnames';
import { useOrientationContext } from '../context/OrientationContext';
import { AppearModal } from './modals/AppearModal';
import { Button } from './Button';
import styles from './EnlargeImageModal.module.scss';

interface EnlargeImageModalProps {
  isOpen: boolean;
  imgSrc: string;
  setImgSrc: (imgSrc: string) => void;
  onClose: () => void;
  onClickDeleteImage?: (() => void) | null;
  onSetPrimaryImage?: (() => void) | null;
}

const EnlargeImageModal: React.FC<EnlargeImageModalProps> = ({
  isOpen,
  onClose,
  onClickDeleteImage,
  onSetPrimaryImage,
  imgSrc,
  setImgSrc,
}) => {
  const orientation = useOrientationContext((state) => state.orientation);

  return (
    <AppearModal
      open={isOpen}
      onClose={onClose}
      width={orientation === 'landscape' ? 70 : 90}
      height={orientation === 'landscape' ? 90 : 70}
    >
      <div className={styles.modalImage}>
        <div className={styles.buttonsContainer}>
          {!!onClickDeleteImage && (
            <Button
              variant="secondary"
              className={styles.button}
              onClick={onClickDeleteImage}
              color={styles.red}
            >
              <Trash2 size={18} />
            </Button>
          )}
          {!!onSetPrimaryImage && (
            <Button
              className={classnames(styles.button, styles.primaryButton)}
              onClick={onSetPrimaryImage}
            >
              <Star size={18} />
              <span>Set as primary</span>
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={onClose}
            className={styles.button}
          >
            <X size={18} />
          </Button>
        </div>
        <div className={styles.img}>
          <img src={imgSrc} onTransitionEnd={() => !isOpen && setImgSrc('')} />
        </div>
      </div>
    </AppearModal>
  );
};

export { EnlargeImageModal };
