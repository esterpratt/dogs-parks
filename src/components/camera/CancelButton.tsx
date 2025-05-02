import { X } from 'lucide-react';
import { CameraButton } from './CameraButton';

interface CancelButtonProps {
  onCancel: () => void;
  text: string;
}

const CancelButton = (props: CancelButtonProps) => {
  const { onCancel, text } = props;

  return (
    <CameraButton variant="secondary" onClick={onCancel} text={text} Icon={X} />
  );
};

export { CancelButton };
