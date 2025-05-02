import {
  Camera as CapacitorCamera,
  CameraResultType,
  CameraSource,
  CameraPluginPermissions,
} from '@capacitor/camera';
import { CapacitorException } from '@capacitor/core';
import { ChooseCamera } from './ChooseCamera';
import { UploadMobileButton } from './UploadMobileButton';
import { TakePhotoButton } from './TakePhotoButton';
import { CancelButton } from './CancelButton';

interface CameraMobileModalProps {
  variant?: 'top' | 'bottom';
  onUploadImg: (img: string | File) => void;
  title?: string;
  onCameraError: (error: string | DOMException) => void;
  error?: string | DOMException | null;
  onCloseModal: () => void;
}

const CameraMobileModal: React.FC<CameraMobileModalProps> = ({
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
