import { ReactNode } from 'react';
import classnames from 'classnames';
import { TopModal } from './TopModal';
import { Button } from '../Button';
import styles from './FormModal.module.scss';

interface FormModalProps {
  open: boolean;
  onClose?: () => void;
  className?: string;
  children: ReactNode;
  onSave?: () => void;
  height?: number | null;
  saveText?: string;
  disabled?: boolean;
  title?: string;
}

const FormModal = ({
  open,
  onClose,
  children,
  className,
  height,
  onSave,
  saveText = 'Save',
  disabled,
  title,
}: FormModalProps) => {
  return (
    <TopModal
      open={open}
      onClose={onClose}
      height={height}
      className={classnames(styles.modal, className)}
    >
      <div className={styles.container}>
        <div className={styles.formContainer}>
          {title && <div className={styles.title}>{title}</div>}
          {children}
        </div>
        <div className={styles.buttonsContainer}>
          {!!onSave && (
            <Button
              disabled={disabled}
              onClick={onSave}
              className={styles.button}
            >
              {saveText}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={onClose}
            className={styles.button}
          >
            Exit
          </Button>
        </div>
      </div>
    </TopModal>
  );
};

export { FormModal };
