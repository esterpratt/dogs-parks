import {
  Camera as CapacitorCamera,
  CameraResultType,
  CameraSource,
} from '@capacitor/camera';
import { CapacitorException } from '@capacitor/core';
import { ChooseCamera } from './ChooseCamera';
import { UploadMobileButton } from './UploadMobileButton';
import { TakePhotoButton } from './TakePhotoButton';
import { CancelButton } from './CancelButton';
import { isIos } from '../../utils/platform';

interface CameraMobileModalProps {
  variant?: 'top' | 'bottom';
  onUploadImg: (img: string | File) => void;
  title?: string;
  onCameraError: (error: string | DOMException) => void;
  error?: string | DOMException | null;
  onCloseModal: () => void;
}

const requestPermission = async (type: 'camera' | 'photos') => {
  const check = await CapacitorCamera.checkPermissions();

  if (isIos()) {
    const isGranted =
      type === 'camera'
        ? check.camera === 'granted'
        : check.photos === 'granted';

    if (isGranted) return true;

    const requested = await CapacitorCamera.requestPermissions({
      permissions: [type],
    });

    return type === 'camera'
      ? requested.camera === 'granted'
      : requested.photos === 'granted';
  }

  if (type === 'camera') {
    if (check.camera === 'granted') return true;

    const requested = await CapacitorCamera.requestPermissions({
      permissions: ['camera'],
    });
    return requested.camera === 'granted';
  }

  if (type === 'photos') {
    if (check.photos === 'granted') return true;

    const requested = await CapacitorCamera.requestPermissions({
      permissions: ['photos'],
    });
    return requested.photos === 'granted';
  }

  return false;
};

const CameraMobileModal: React.FC<CameraMobileModalProps> = ({
  variant = 'bottom',
  onUploadImg,
  title,
  onCameraError,
  error,
  onCloseModal,
}) => {
  const onClickMobileUploadFile = async () => {
    try {
      onCameraError('');
      const photo = await CapacitorCamera.getPhoto({
        quality: 100,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });

      if (!photo?.base64String) {
        throw new Error('Image is not Base64');
      }

      onUploadImg(`data:image/jpeg;base64,${photo.base64String}`);
    } catch (error) {
      if ((error as CapacitorException).message?.includes('cancel')) {
        return;
      }

      if (
        (error as CapacitorException).message
          ?.toLowerCase()
          .includes('permission')
      ) {
        onCameraError('Gallery permission denied');
        return;
      }
      onCameraError(error as string);
    }
  };

  const captureImgMobile = async () => {
    try {
      onCameraError('');
      const hasPermission = await requestPermission('camera');

      if (!hasPermission) {
        throw new Error('Camera permission denied');
      }

      if (!isIos()) {
        await new Promise((resolve) =>
          requestAnimationFrame(() => resolve(null))
        );
      }

      const photo = await CapacitorCamera.getPhoto({
        quality: 100,
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
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
          ? error
          : 'Unknown error';

      if (message.toLowerCase().includes('cancel')) {
        return;
      }

      if (
        message.toLowerCase().includes('access') ||
        message.toLowerCase().includes('permission')
      ) {
        onCameraError('Camera permission denied');
      } else {
        onCameraError(message);
      }
    }
  };

  return (
    <ChooseCamera error={error} title={title}>
      <UploadMobileButton onUploadFile={onClickMobileUploadFile} />
      <TakePhotoButton onOpenCamera={() => captureImgMobile()} />
      <CancelButton
        onCancel={onCloseModal}
        text={variant === 'bottom' ? 'Cancel' : 'Later'}
      />
    </ChooseCamera>
  );
};

export default CameraMobileModal;
