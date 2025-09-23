import { Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CameraButton } from './CameraButton';

interface TakePhotoButtonProps {
  onOpenCamera: () => void;
}

const TakePhotoButton = (props: TakePhotoButtonProps) => {
  const { onOpenCamera } = props;
  const { t } = useTranslation();

  return (
    <CameraButton
      onClick={onOpenCamera}
      text={t('components.camera.takePhoto')}
      Icon={Camera}
    />
  );
};

export { TakePhotoButton };
