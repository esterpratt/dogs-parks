import { ChangeEvent, ReactNode } from 'react';
import classnames from 'classnames';
import styles from './FileInput.module.scss';

interface FileInputProps {
  onUploadFile: (event: ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
  className?: string;
}

const FileInput: React.FC<FileInputProps> = ({
  onUploadFile,
  children,
  className,
}) => {
  return (
    <div className={classnames(styles.inputFileContainer, className)}>
      <label htmlFor="file">{children}</label>
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
