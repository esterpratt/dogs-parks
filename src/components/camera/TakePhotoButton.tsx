import { Camera } from 'lucide-react';
import { CameraButton } from './CameraButton';

interface TakePhotoButtonProps {
  onOpenCamera: () => void;
}

const TakePhotoButton = (props: TakePhotoButtonProps) => {
  const { onOpenCamera } = props;

  return (
    <CameraButton onClick={onOpenCamera} text="Take a Photo" Icon={Camera} />
  );
};

export { TakePhotoButton };
