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
        <div className={styles.img}>
          <Button
            variant="round"
            onClick={onClose}
            className={styles.exitButton}
          >
            <X size={18} />
          </Button>
          <img src={imgSrc} onTransitionEnd={() => !isOpen && setImgSrc('')} />
        </div>
        {(!!onClickDeleteImage || !!onSetPrimaryImage) && (
          <div className={styles.buttonsContainer}>
            {!!onClickDeleteImage && (
              <Button
                variant="secondary"
                className={styles.button}
                onClick={onClickDeleteImage}
                color={styles.red}
              >
                <Trash2 size={18} />
                <span>Delete</span>
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
          </div>
        )}
      </div>
    </AppearModal>
  );
};

export { EnlargeImageModal };
