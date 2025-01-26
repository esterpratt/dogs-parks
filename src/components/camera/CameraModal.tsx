import { useState } from 'react';
import { isMobile } from '../../utils/platform';
import CameraMobileModal from './CameraMobileModal';
import CameraWebModal from './CameraWebModal';

interface CameraModalProps {
  open: boolean;
  variant?: 'centerTop' | 'bottom';
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

  return isMobile ? (
    <CameraMobileModal
      error={error}
      onCameraError={onCameraError}
      onCloseModal={onCloseModal}
      open={open}
      onUploadImg={onUploadImg}
      variant={variant}
      title={title}
    />
  ) : (
    <CameraWebModal
      error={error}
      onCameraError={onCameraError}
      onCloseModal={onCloseModal}
      open={open}
      onUploadImg={onUploadImg}
      variant={variant}
      title={title}
    />
  );
};

export default CameraModal;
