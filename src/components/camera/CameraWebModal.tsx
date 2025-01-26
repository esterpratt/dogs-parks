import { FormEvent, useState } from 'react';
import { IconContext } from 'react-icons';
import { CgClose } from 'react-icons/cg';
import { PiCamera } from 'react-icons/pi';
import { PiImageSquare } from 'react-icons/pi';
import classnames from 'classnames';
import { Button } from '../Button';
import { FileInput } from '../inputs/FileInput';
import { Camera } from './Camera';
import { Modal } from '../Modal';
import styles from './CameraModal.module.scss';

interface CameraWebModalProps {
  open: boolean;
  variant?: 'centerTop' | 'bottom';
  onUploadImg: (img: string | File) => void;
  title?: string;
  onCameraError: (error: string | DOMException) => void;
  error?: string | DOMException | null;
  onCloseModal: () => void;
}

const CameraWebModal: React.FC<CameraWebModalProps> = ({
  open,
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
      <Modal
        height={variant === 'bottom' ? '296px' : '370px'}
        open={open}
        onClose={onCloseModal}
        variant={variant}
        className={classnames(styles.modal, styles[variant])}
        removeCloseButton
        delay={variant !== 'bottom'}
      >
        {title && <div className={styles.title}>{title}</div>}
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
            onClick={() => setIsCameraOpen(true)}
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
            <span>{variant === 'bottom' ? 'Cancel' : 'Later'}</span>
          </Button>
        </div>
        <span className={styles.error}>
          {error && 'Sorry, cannot use your camera'}
        </span>
      </Modal>
      <Modal
        variant="fullScreen"
        open={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
      >
        <Camera
          isOpen={isCameraOpen}
          onSaveImg={onSaveImg}
          onError={handleError}
          onClose={() => setIsCameraOpen(false)}
        />
      </Modal>
    </>
  );
};

export default CameraWebModal;
