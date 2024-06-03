import { FormEvent, useState } from 'react';
import { PiCamera } from 'react-icons/pi';
import { PiImageSquare } from 'react-icons/pi';
import classnames from 'classnames';
import { Button } from '../Button';
import { FileInput } from '../inputs/FileInput';
import { Camera } from './Camera';
import { Modal } from '../Modal';
import styles from './CameraModal.module.scss';
import { IconContext } from 'react-icons';
import { CgClose } from 'react-icons/cg';

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

  const openCamera = () => {
    setIsCameraOpen(true);
    onCloseModal();
  };

  const onCameraError = (error: string | DOMException) => {
    console.error(error);
    setError(error);
    setIsCameraOpen(false);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onCloseModal}
        variant="bottom"
        className={styles.modal}
        removeCloseButton
      >
        <div className={styles.buttonsContainer}>
          <FileInput
            onUploadFile={onUploadFile}
            className={styles.buttonContainer}
          >
            <div className={styles.button}>
              <IconContext.Provider value={{ className: styles.icon }}>
                <PiImageSquare />
              </IconContext.Provider>
              <span>Upload a Photo</span>
            </div>
          </FileInput>
          <Button
            onClick={openCamera}
            className={classnames(styles.button, styles.buttonContainer)}
          >
            <IconContext.Provider value={{ className: styles.icon }}>
              <PiCamera />
            </IconContext.Provider>
            <span>Take a Photo</span>
          </Button>
          <Button
            onClick={onCloseModal}
            className={classnames(styles.button, styles.buttonContainer)}
          >
            <IconContext.Provider value={{ className: styles.icon }}>
              <CgClose />
            </IconContext.Provider>
            <span>Cancel</span>
          </Button>
        </div>
        <span>{error && 'Sorry, cannot use your camera'}</span>
      </Modal>
      <Modal
        variant="fullScreen"
        open={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
      >
        <Camera
          isOpen={isCameraOpen}
          onSaveImg={onSaveImg}
          onError={onCameraError}
          onClose={() => setIsCameraOpen(false)}
        />
      </Modal>
    </>
  );
};

export default CameraModal;
