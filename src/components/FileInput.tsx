import { ChangeEvent } from 'react';
import styles from './FileInput.module.scss';

interface FileInputProps {
  onUploadFile: (event: ChangeEvent<HTMLInputElement>) => void;
}

const FileInput: React.FC<FileInputProps> = ({ onUploadFile }) => {
  return (
    <div className={styles.inputFileContainer}>
      <label htmlFor="file">Upload Photo</label>
      <input
        type="file"
        id="file"
        onChange={onUploadFile}
        className={styles.uploadFileButton}
      />
    </div>
  );
};

export { FileInput };
