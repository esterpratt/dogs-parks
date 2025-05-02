import { Folder } from 'lucide-react';
import { CameraButton } from './CameraButton';

interface UploadMobileButtonProps {
  onUploadFile: () => void;
}

const UploadMobileButton = (props: UploadMobileButtonProps) => {
  const { onUploadFile } = props;

  return (
    <CameraButton text="Upload photo" Icon={Folder} onClick={onUploadFile} />
  );
};

export { UploadMobileButton };
