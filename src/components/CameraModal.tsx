import { Button } from './Button';
import { FileInput } from './FileInput';
import { Camera } from './Camera';
import { Modal } from './Modal';
import { FormEvent, useState } from 'react';
import styles from './CameraModal.module.scss';

interface CameraModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onUploadImg: (img: string | File) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({
  open,
  setOpen,
  onUploadImg,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState<string | DOMException | null>(null);

  const onSaveImg = async (img: string | File) => {
    setIsCameraOpen(false);
    onUploadImg(img);
  };

  const onUploadFile = (event: FormEvent<HTMLInputElement>) => {
    if (event.currentTarget.files) {
      onUploadImg(event.currentTarget.files[0]);
    }
  };

  const onCloseModal = () => {
    setOpen(false);
  };

  const onCameraError = (error: string | DOMException) => {
    console.error(error);
    setError(error);
    setIsCameraOpen(false);
  };

  return (
    <Modal open={open} onClose={onCloseModal}>
      {isCameraOpen ? (
        <Camera
          onSaveImg={onSaveImg}
          onError={onCameraError}
          onCancel={() => setIsCameraOpen(false)}
        />
      ) : (
        <div className={styles.buttonsContainer}>
          <FileInput onUploadFile={onUploadFile} />
          <span>or</span>
          <Button onClick={() => setIsCameraOpen(true)}>
            {error ? 'Sorry, cannot use your camera' : 'Take a photo'}
          </Button>
        </div>
      )}
    </Modal>
  );
};

export { CameraModal };
