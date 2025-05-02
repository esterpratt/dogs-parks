import { Folder } from 'lucide-react';
import { FormEvent } from 'react';
import { FileInput } from '../inputs/FileInput';
import { CameraButton } from './CameraButton';
import styles from './UploadWebButton.module.scss';

interface UploadWebButtonProps {
  onUploadFile: (event: FormEvent<HTMLInputElement>) => void;
}

const UploadWebButton = (props: UploadWebButtonProps) => {
  const { onUploadFile } = props;

  return (
    <FileInput onUploadFile={onUploadFile} className={styles.fileButton}>
      <CameraButton text="Upload photo" Icon={Folder} />
    </FileInput>
  );
};

export { UploadWebButton };
