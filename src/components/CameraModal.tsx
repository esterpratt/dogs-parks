import { FormEvent, useState } from 'react';
import { PiCamera } from 'react-icons/pi';
import { PiImageSquare } from 'react-icons/pi';
import { Button } from './Button';
import { FileInput } from './FileInput';
import { Camera } from './Camera';
import { Modal } from './Modal';
import styles from './CameraModal.module.scss';
import { IconContext } from 'react-icons';

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
    <Modal
      open={open}
      onClose={onCloseModal}
      variant="bottom"
      className={styles.modal}
    >
      {isCameraOpen ? (
        <Camera
          onSaveImg={onSaveImg}
          onError={onCameraError}
          onCancel={() => setIsCameraOpen(false)}
        />
      ) : (
        <>
          <div className={styles.buttonsContainer}>
            <FileInput onUploadFile={onUploadFile}>
              <div className={styles.button}>
                <IconContext.Provider value={{ className: styles.icon }}>
                  <PiImageSquare />
                </IconContext.Provider>
                <span>Upload</span>
              </div>
            </FileInput>
            <Button
              onClick={() => setIsCameraOpen(true)}
              className={styles.button}
            >
              <IconContext.Provider value={{ className: styles.icon }}>
                <PiCamera />
              </IconContext.Provider>
              <span>Camera</span>
            </Button>
          </div>
          <span>{error && 'Sorry, cannot use your camera'}</span>
        </>
      )}
    </Modal>
  );
};

export { CameraModal };
