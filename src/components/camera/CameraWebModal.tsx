import { FormEvent, useState } from 'react';
import { Camera } from './Camera';
import { ChooseCamera } from './ChooseCamera';
import { UploadWebButton } from './UploadWebButton';
import { TakePhotoButton } from './TakePhotoButton';
import { CancelButton } from './CancelButton';
import { AppearModal } from '../modals/AppearModal';

interface CameraWebModalProps {
  variant?: 'top' | 'bottom';
  onUploadImg: (img: string | File) => void;
  title?: string;
  onCameraError: (error: string | DOMException) => void;
  error?: string | DOMException | null;
  onCloseModal: () => void;
}

const CameraWebModal: React.FC<CameraWebModalProps> = ({
  variant = 'bottom',
  onUploadImg,
  title,
  onCameraError,
  error,
  onCloseModal,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const onSaveImg = async (img: string | File) => {
    setIsCameraOpen(false);
    onUploadImg(img);
  };

  const onUploadFile = (event: FormEvent<HTMLInputElement>) => {
    if (event.currentTarget.files) {
      onUploadImg(event.currentTarget.files[0]);
    }
  };

  const handleError = (error: string | DOMException) => {
    setIsCameraOpen(false);
    onCameraError(error);
  };

  return (
    <>
      <ChooseCamera error={error} title={title}>
        <UploadWebButton onUploadFile={onUploadFile} />
        <TakePhotoButton onOpenCamera={() => setIsCameraOpen(true)} />
        <CancelButton
          onCancel={onCloseModal}
          text={variant === 'bottom' ? 'Cancel' : 'Later'}
        />
      </ChooseCamera>
      <AppearModal open={isCameraOpen} onClose={() => setIsCameraOpen(false)}>
        <Camera
          isOpen={isCameraOpen}
          onSaveImg={onSaveImg}
          onError={handleError}
          onClose={() => setIsCameraOpen(false)}
        />
      </AppearModal>
    </>
  );
};

export default CameraWebModal;
