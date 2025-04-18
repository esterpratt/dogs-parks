import { IconContext } from 'react-icons';
import { CgClose } from 'react-icons/cg';
import { PiCamera } from 'react-icons/pi';
import { PiImageSquare } from 'react-icons/pi';
import classnames from 'classnames';
import {
  Camera as CapacitorCamera,
  CameraResultType,
  CameraSource,
  CameraPluginPermissions,
} from '@capacitor/camera';
import { Button } from '../Button';
import { Modal } from '../Modal';
import styles from './CameraModal.module.scss';
import { CapacitorException } from '@capacitor/core';

interface CameraMobileModalProps {
  open: boolean;
  variant?: 'centerTop' | 'bottom';
  onUploadImg: (img: string | File) => void;
  title?: string;
  onCameraError: (error: string | DOMException) => void;
  error?: string | DOMException | null;
  onCloseModal: () => void;
}

const CameraMobileModal: React.FC<CameraMobileModalProps> = ({
  open,
  variant = 'bottom',
  onUploadImg,
  title,
  onCameraError,
  error,
  onCloseModal,
}) => {
  const requestPermission = async (options: CameraPluginPermissions) => {
    const permission = await CapacitorCamera.requestPermissions(options);
    return permission.camera === 'granted' || permission.photos === 'granted';
  };

  const onClickMobileUploadFile = async () => {
    try {
      const hasPermission = await requestPermission({
        permissions: ['photos'],
      });
      if (!hasPermission) {
        throw new Error('Gallery permission denied');
      }

      const photo = await CapacitorCamera.getPhoto({
        quality: 80,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });

      if (photo.base64String) {
        onUploadImg(`data:image/jpeg;base64,${photo.base64String}`);
      } else {
        throw new Error('Image is not Base64');
      }
    } catch (error) {
      if ((error as CapacitorException).message?.includes('cancel')) {
        return;
      }
      onCameraError(error as string);
    }
  };

  const captureImgMobile = async () => {
    try {
      const hasPermission = await requestPermission({
        permissions: ['camera'],
      });
      if (!hasPermission) {
        throw new Error('Camera permission denied');
      }

      const photo = await CapacitorCamera.getPhoto({
        quality: 80,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        allowEditing: true,
      });

      if (photo.base64String) {
        onUploadImg(`data:image/jpeg;base64,${photo.base64String}`);
      } else {
        throw new Error('Image is not Base64');
      }
    } catch (error) {
      if ((error as CapacitorException).message?.includes('cancel')) {
        return;
      }
      onCameraError(error as string);
    }
  };

  return (
    <>
      <Modal
        height={variant === 'bottom' ? '296px' : '370px'}
        open={open}
        onClose={onCloseModal}
        variant={variant}
        className={styles.modal}
        removeCloseButton
        delay={variant !== 'bottom'}
      >
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.buttonsContainer}>
          <Button
            onClick={onClickMobileUploadFile}
            className={classnames(styles.button, styles.buttonContainer)}
            variant="simple"
          >
            <div className={styles.button}>
              <IconContext.Provider value={{ className: styles.icon }}>
                <PiImageSquare />
              </IconContext.Provider>
              <span>Upload a Photo</span>
            </div>
          </Button>
          <Button
            onClick={() => captureImgMobile()}
            className={classnames(styles.button, styles.buttonContainer)}
            variant="simple"
          >
            <IconContext.Provider value={{ className: styles.icon }}>
              <PiCamera />
            </IconContext.Provider>
            <span>Take a Photo</span>
          </Button>
          <Button
            onClick={onCloseModal}
            className={classnames(styles.button, styles.buttonContainer)}
            variant="simple"
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
    </>
  );
};

export default CameraMobileModal;
