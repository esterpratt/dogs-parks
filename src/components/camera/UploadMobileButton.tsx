import { Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CameraButton } from './CameraButton';

interface UploadMobileButtonProps {
  onUploadFile: () => void;
}

const UploadMobileButton = (props: UploadMobileButtonProps) => {
  const { onUploadFile } = props;
  const { t } = useTranslation();

  return (
    <CameraButton
      text={t('components.camera.uploadImage')}
      Icon={Folder}
      onClick={onUploadFile}
    />
  );
};

export { UploadMobileButton };
