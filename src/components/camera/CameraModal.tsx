import { useState } from 'react';
import { isMobile } from '../../utils/platform';
import CameraMobileModal from './CameraMobileModal';
import CameraWebModal from './CameraWebModal';
import { BottomModal } from '../modals/BottomModal';
import { TopModal } from '../modals/TopModal';
import styles from './CameraModal.module.scss';

interface CameraModalProps {
  open: boolean;
  variant?: 'top' | 'bottom';
  setOpen: (open: boolean) => void;
  onUploadImg: (img: string | File) => void;
  title?: string;
}

const CameraModal: React.FC<CameraModalProps> = ({
  open,
  setOpen,
  variant = 'bottom',
  onUploadImg,
  title,
}) => {
  const [error, setError] = useState<string | DOMException | null>(null);

  const onCloseModal = () => {
    setError(null);
    setOpen(false);
  };

  const onCameraError = (error: string | DOMException) => {
    console.error(error);
    setError(error);
  };

  const renderInnerModal = () => {
    return isMobile() ? (
      <CameraMobileModal
        error={error}
        onCameraError={onCameraError}
        onCloseModal={onCloseModal}
        onUploadImg={onUploadImg}
        variant={variant}
        title={title}
      />
    ) : (
      <CameraWebModal
        error={error}
        onCameraError={onCameraError}
        onCloseModal={onCloseModal}
        onUploadImg={onUploadImg}
        variant={variant}
        title={title}
      />
    );
  };

  return variant === 'bottom' ? (
    <BottomModal open={open} onClose={onCloseModal} className={styles.modal}>
      {renderInnerModal()}
    </BottomModal>
  ) : (
    <TopModal open={open} onClose={onCloseModal} className={styles.modal}>
      {renderInnerModal()}
    </TopModal>
  );
};

export { CameraModal };
