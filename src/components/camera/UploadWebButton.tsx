import { Folder } from 'lucide-react';
import { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FileInput } from '../inputs/FileInput';
import { CameraButton } from './CameraButton';
import styles from './UploadWebButton.module.scss';

interface UploadWebButtonProps {
  onUploadFile: (event: FormEvent<HTMLInputElement>) => void;
}

const UploadWebButton = (props: UploadWebButtonProps) => {
  const { onUploadFile } = props;
  const { t } = useTranslation();

  return (
    <FileInput onUploadFile={onUploadFile} className={styles.fileButton}>
      <CameraButton text={t('components.camera.uploadImage')} Icon={Folder} />
    </FileInput>
  );
};

export { UploadWebButton };
